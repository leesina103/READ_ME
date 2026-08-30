-- 답변 개수는 요청자의 기수에 대해서만 공개한다.
create or replace function public.session_answer_count(target_cohort text, target_week smallint)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  answer_count integer;
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.cohort = target_cohort
  ) then
    return 0;
  end if;

  select count(*)::integer
  into answer_count
  from public.session_answers
  where cohort = target_cohort
    and week_number = target_week;

  return answer_count;
end;
$$;

revoke all on function public.session_answer_count(text, smallint) from public;
grant execute on function public.session_answer_count(text, smallint) to authenticated;

-- 클라이언트가 기수, 주차, 작성자 정보를 임의로 수정하지 못하도록
-- 본문 저장만 허용하는 전용 함수를 사용한다.
create or replace function public.save_session_answer(target_week smallint, target_content text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  member_cohort text;
  member_display_name text;
  normalized_content text := trim(target_content);
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if target_week is null or target_week not between 1 and 8 then
    raise exception 'invalid_week' using errcode = '22023';
  end if;

  if normalized_content is null or char_length(normalized_content) not between 2 and 2000 then
    raise exception 'invalid_content_length' using errcode = '22023';
  end if;

  select profile.cohort, profile.display_name
  into member_cohort, member_display_name
  from public.profiles as profile
  where profile.id = current_user_id;

  if member_cohort is null or member_display_name is null then
    raise exception 'member_cohort_required' using errcode = '42501';
  end if;

  insert into public.session_answers (
    cohort,
    week_number,
    user_id,
    display_name,
    content,
    updated_at
  )
  values (
    member_cohort,
    target_week,
    current_user_id,
    member_display_name,
    normalized_content,
    now()
  )
  on conflict (cohort, week_number, user_id)
  do update set
    display_name = excluded.display_name,
    content = excluded.content,
    updated_at = now();
end;
$$;

revoke all on function public.save_session_answer(smallint, text) from public;
grant execute on function public.save_session_answer(smallint, text) to authenticated;

-- 테이블 직접 쓰기를 막고 위 전용 함수만 쓰기 경로로 남긴다.
revoke insert, update on table public.session_answers from authenticated;

drop policy if exists "자신의 기수에만 답변 작성 가능" on public.session_answers;
drop policy if exists "자신의 답변만 수정 가능" on public.session_answers;
