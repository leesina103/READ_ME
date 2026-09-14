-- 대화방 주차 순차 공개. 기수 시작 시각(cohorts.starts_at)을 1주차 공개 시각으로 보고
-- 매주 같은 요일·시각에 다음 주차를 연다. 시작 전이면 어느 주차도 열리지 않는다.
-- 화면(lib/membership/talkSchedule.ts)과 같은 규칙을 유지해야 한다.
create or replace function public.talk_week_opens_at(target_cohort text, target_week smallint)
returns timestamptz
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select cohort.starts_at + (target_week - 1) * interval '7 days'
  from public.cohorts as cohort
  where cohort.name = target_cohort;
$$;

revoke all on function public.talk_week_opens_at(text, smallint) from public, anon;
grant execute on function public.talk_week_opens_at(text, smallint) to authenticated;

create or replace function public.is_talk_week_open(target_cohort text, target_week smallint)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(public.talk_week_opens_at(target_cohort, target_week) <= now(), false);
$$;

revoke all on function public.is_talk_week_open(text, smallint) from public, anon;
grant execute on function public.is_talk_week_open(text, smallint) to authenticated;

-- 답변 저장: 아직 열리지 않은 주차는 거절한다.
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

  if not public.is_talk_week_open(member_cohort, target_week) then
    raise exception 'week_not_open' using errcode = '42501';
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
