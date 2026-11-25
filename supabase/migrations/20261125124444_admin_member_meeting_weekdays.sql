-- 승인된 모임을 우선하고, 신청서 없이 연결된 회원은 같은 기수의 배정 모임을 사용합니다.
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
  is_admin boolean,
  meeting_weekdays integer[]
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
    coalesce(account.raw_app_meta_data ->> 'role', '') = 'admin',
    array(
      select distinct extract(dow from meeting.starts_at at time zone 'Asia/Seoul')::integer as weekday
      from public.talk_meetings as meeting
      where meeting.group_id = coalesce(
        case when history.cohort is null or history.cohort = invitation.cohort then invitation.group_id end,
        assignment.group_id
      )
      order by weekday
    )
  from public.member_invitations as invitation
  left join public.profiles as profile on profile.id = invitation.claimed_by
  left join public.memberships as membership on membership.user_id = invitation.claimed_by
  left join auth.users as account on account.id = invitation.claimed_by
  left join public.member_cohorts as history on history.user_id = invitation.claimed_by
  left join public.talk_group_members as assignment
    on assignment.user_id = invitation.claimed_by and assignment.cohort = coalesce(history.cohort, invitation.cohort)
  order by coalesce(history.cohort, invitation.cohort), invitation.name, invitation.created_at;
end;
$$;

revoke all on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
