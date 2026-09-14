-- 운영자용 기수 회원 명단.
-- 가입 완료 회원은 참여한 기수(member_cohorts)마다 한 줄씩, 가입 전 회원은 승인된 기수 한 줄만 반환한다.
-- current_cohort는 프로필의 현재 기수라서, cohort와 다르면 다른 기수로 옮겨간 이력 줄이다.
drop function if exists public.admin_list_members();

create or replace function public.admin_list_members()
returns table (
  id bigint,
  name text,
  email text,
  cohort text,
  current_cohort text,
  display_name text,
  claimed_at timestamptz,
  onboarding_completed_at timestamptz,
  membership_status text,
  is_admin boolean
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  return query
  select
    invitation.id,
    invitation.name,
    invitation.email,
    coalesce(history.cohort, invitation.cohort),
    coalesce(profile.cohort, invitation.cohort),
    profile.display_name,
    invitation.claimed_at,
    profile.onboarding_completed_at,
    membership.status,
    coalesce(account.raw_app_meta_data ->> 'role', '') = 'admin'
  from public.member_invitations as invitation
  left join public.profiles as profile on profile.id = invitation.claimed_by
  left join public.memberships as membership on membership.user_id = invitation.claimed_by
  left join auth.users as account on account.id = invitation.claimed_by
  left join public.member_cohorts as history on history.user_id = invitation.claimed_by
  order by coalesce(history.cohort, invitation.cohort), invitation.name, invitation.created_at;
end;
$$;

revoke all on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
