-- 멤버 소개. 회원이 참여했던 기수의 동료 소개를 읽을 수 있게 한다.
-- 프로필 표는 계속 "자기 것만 조회"로 잠가 두고, 공유가 필요한 항목만 이 함수로 내보낸다.
-- 반환 범위는 온라인 대화방과 같다. 요청자가 참여한 기수의 회원만, 가입을 마친 사람만 포함한다.
drop function if exists public.list_member_directory();

create or replace function public.list_member_directory()
returns table (
  cohort text,
  user_id uuid,
  display_name text,
  bio text,
  cohort_message text
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null or not public.has_active_membership() then
    return;
  end if;

  return query
  -- 기수 이력 표를 기본으로 삼되, 이력이 아직 쌓이지 않은 회원은 프로필의 현재 기수로 채운다.
  with membership_row as (
    select history.user_id as member_id, history.cohort as cohort_name
    from public.member_cohorts as history
    union
    select profile.id, profile.cohort
    from public.profiles as profile
    where profile.cohort is not null
  ),
  my_cohort as (
    select mine.cohort_name
    from membership_row as mine
    where mine.member_id = current_user_id
  )
  select
    peer.cohort_name,
    peer.member_id,
    profile.display_name,
    profile.bio,
    profile.cohort_message
  from membership_row as peer
  join public.profiles as profile on profile.id = peer.member_id
  where peer.cohort_name in (select my_cohort.cohort_name from my_cohort)
    and profile.onboarding_completed_at is not null
  order by peer.cohort_name desc, profile.display_name;
end;
$$;

revoke all on function public.list_member_directory() from public, anon;
grant execute on function public.list_member_directory() to authenticated;
