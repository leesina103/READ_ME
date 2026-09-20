-- 자기소개는 첫 만남 전에 작성한다. 가입 완료 여부는 닉네임 설정과 분리한다.
alter table public.profiles
  add column introduction_word text not null default ''
  constraint profiles_introduction_word_length check (
    introduction_word = '' or (
      char_length(introduction_word) between 1 and 20
      and introduction_word !~ '[[:space:]]'
    )
  );

alter table public.profiles drop constraint profiles_completed_onboarding_content;
alter table public.profiles add constraint profiles_completed_onboarding_content check (
  onboarding_completed_at is null or char_length(trim(display_name)) between 2 and 30
);

grant update (introduction_word) on public.profiles to authenticated;

-- 기존 가입 화면의 세 인자 호출도 허용하되, 새 화면에서는 닉네임만 보낸다.
create or replace function public.complete_member_onboarding(
  p_display_name text,
  p_bio text default null,
  p_cohort_message text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required';
  end if;

  if p_display_name is null or char_length(trim(p_display_name)) not between 2 and 30
    or (p_bio is not null and char_length(trim(p_bio)) > 200)
    or (p_cohort_message is not null and char_length(trim(p_cohort_message)) > 300) then
    raise exception 'invalid_onboarding_content';
  end if;

  update public.profiles
  set display_name = trim(p_display_name),
      bio = coalesce(trim(p_bio), bio),
      cohort_message = coalesce(trim(p_cohort_message), cohort_message),
      onboarding_completed_at = now(),
      updated_at = now()
  where id = (select auth.uid()) and onboarding_completed_at is null;

  if not found then
    raise exception 'onboarding_not_available';
  end if;
end;
$$;

revoke all on function public.complete_member_onboarding(text, text, text) from public, anon;
grant execute on function public.complete_member_onboarding(text, text, text) to authenticated;

-- 본인의 행 조회 정책과 열 수정 권한으로 소개를 한 번에 저장한다.
create function public.save_member_introduction(
  p_word text,
  p_bio text,
  p_cohort_message text,
  p_cohort text default null
)
returns void
language plpgsql
security invoker set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_cohort text;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;
  if not public.has_active_membership() then
    raise exception 'membership_required';
  end if;
  if p_word is null or char_length(trim(p_word)) not between 1 and 20 or trim(p_word) ~ '[[:space:]]'
    or p_bio is null or char_length(trim(p_bio)) not between 2 and 200
    or p_cohort_message is null or char_length(trim(p_cohort_message)) not between 2 and 300 then
    raise exception 'invalid_introduction_content';
  end if;

  select profile.cohort into current_cohort
  from public.profiles as profile
  where profile.id = current_user_id and profile.onboarding_completed_at is not null
  for update;
  if not found then
    raise exception 'membership_required';
  end if;

  -- 대화방에서는 현재 진행 기수만 작성한다. 나의 서재에서는 공통 소개를 언제든 수정한다.
  if p_cohort is not null and (
    p_cohort is distinct from current_cohort or not exists (
      select 1 from public.cohorts as cohort
      where cohort.name = current_cohort and (cohort.ends_at is null or cohort.ends_at > now())
    )
  ) then
    raise exception 'cohort_read_only';
  end if;

  update public.profiles
  set introduction_word = trim(p_word), bio = trim(p_bio),
      cohort_message = trim(p_cohort_message), updated_at = now()
  where id = current_user_id;
  if not found then
    raise exception 'membership_required';
  end if;
end;
$$;

revoke all on function public.save_member_introduction(text, text, text, text) from public, anon;
grant execute on function public.save_member_introduction(text, text, text, text) to authenticated;

-- 기존의 본인 프로필 조회 정책은 유지하고, 참여했던 기수에만 소개를 공유한다.
drop function public.list_member_directory();
create function public.list_member_directory()
returns table (
  cohort text, user_id uuid, display_name text, bio text, cohort_message text, introduction_word text
)
language plpgsql
security definer set search_path = ''
stable
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null or not public.has_active_membership() then
    return;
  end if;

  return query
  with membership_row as (
    select history.user_id as member_id, history.cohort as cohort_name from public.member_cohorts as history
    union
    select profile.id, profile.cohort from public.profiles as profile where profile.cohort is not null
  ), my_cohort as (
    select mine.cohort_name from membership_row as mine where mine.member_id = current_user_id
  )
  select peer.cohort_name, peer.member_id, profile.display_name, profile.bio,
         profile.cohort_message, profile.introduction_word
  from membership_row as peer
  join public.profiles as profile on profile.id = peer.member_id
  where peer.cohort_name in (select mine.cohort_name from my_cohort as mine)
    and profile.onboarding_completed_at is not null
  order by peer.cohort_name desc, profile.display_name;
end;
$$;

revoke all on function public.list_member_directory() from public, anon;
grant execute on function public.list_member_directory() to authenticated;
