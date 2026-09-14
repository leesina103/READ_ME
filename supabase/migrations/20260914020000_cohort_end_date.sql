-- 기수 종료일. 종료일이 지난 기수의 대화방은 현재 기수라도 읽기만 허용한다.
-- 종료일이 비어 있으면 아직 진행 중인 기수로 본다.
alter table public.cohorts
  add column if not exists ends_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cohorts_ends_after_starts'
  ) then
    alter table public.cohorts
      add constraint cohorts_ends_after_starts check (ends_at is null or ends_at >= starts_at);
  end if;
end;
$$;

create or replace function public.is_cohort_ended(target_cohort text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.cohorts as cohort
    where cohort.name = target_cohort
      and cohort.ends_at is not null
      and cohort.ends_at <= now()
  );
$$;

revoke all on function public.is_cohort_ended(text) from public, anon;
grant execute on function public.is_cohort_ended(text) to authenticated;

-- 답변 저장: 현재 기수라도 종료일이 지났으면 막는다.
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

  if public.is_cohort_ended(member_cohort) then
    raise exception 'cohort_ended' using errcode = '42501';
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
