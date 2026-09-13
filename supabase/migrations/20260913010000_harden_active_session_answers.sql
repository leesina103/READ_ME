create or replace function public.has_answered(target_cohort text, target_week smallint)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select public.has_active_membership() and exists (
    select 1
    from public.session_answers
    where cohort = target_cohort
      and week_number = target_week
      and user_id = (select auth.uid())
  );
$$;

revoke all on function public.has_answered(text, smallint) from public, anon;
grant execute on function public.has_answered(text, smallint) to authenticated;

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
  if (select auth.uid()) is null
    or not public.has_active_membership()
    or not exists (
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

revoke all on function public.session_answer_count(text, smallint) from public, anon;
grant execute on function public.session_answer_count(text, smallint) to authenticated;

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
  if current_user_id is null or not public.has_active_membership() then
    raise exception 'active_membership_required' using errcode = '42501';
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

revoke all on function public.save_session_answer(smallint, text) from public, anon;
grant execute on function public.save_session_answer(smallint, text) to authenticated;

drop policy if exists "자신의 답변은 항상 조회 가능" on public.session_answers;
drop policy if exists "활성 회원은 자신의 답변을 조회할 수 있음" on public.session_answers;
create policy "활성 회원은 자신의 답변을 조회할 수 있음"
on public.session_answers for select
to authenticated
using (
  public.has_active_membership()
  and (select auth.uid()) = user_id
);

drop policy if exists "답변을 남긴 기수원만 같은 주차 답변 조회 가능" on public.session_answers;
drop policy if exists "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능" on public.session_answers;
create policy "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능"
on public.session_answers for select
to authenticated
using (
  public.has_active_membership()
  and public.has_answered(cohort, week_number)
  and exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.cohort = session_answers.cohort
  )
);
