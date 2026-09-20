-- 소개는 요청자와 동료의 현재 기수가 같을 때만 공개한다.
-- 지난 참여 이력은 소개 공개 범위에 포함하지 않으며, 프로필 표의 본인 조회 정책은 유지한다.
create or replace function public.list_member_directory()
returns table (
  cohort text, user_id uuid, display_name text, bio text, cohort_message text, introduction_word text
)
language plpgsql
security definer set search_path = ''
stable
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_cohort text;
begin
  if current_user_id is null or not public.has_active_membership() then
    return;
  end if;

  select mine.cohort into current_cohort
  from public.profiles as mine
  where mine.id = current_user_id and mine.onboarding_completed_at is not null;

  if current_cohort is null then
    return;
  end if;

  return query
  select peer.cohort, peer.id, peer.display_name, peer.bio, peer.cohort_message, peer.introduction_word
  from public.profiles as peer
  where peer.cohort = current_cohort
    and peer.onboarding_completed_at is not null
  order by peer.display_name, peer.id;
end;
$$;

revoke all on function public.list_member_directory() from public, anon;
grant execute on function public.list_member_directory() to authenticated;
