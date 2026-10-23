-- 회원 연결 여부는 담당 모임과 실제 회원 데이터를 대조해 운영자에게만 제공합니다.
create function public.admin_guide_member_roster() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'user_id',a.user_id,'name',p.full_name,'nickname',p.display_name,
    'cohort',g.cohort,'current_cohort',p.cohort,'group_id',g.id,'group_name',g.name,
    'linked',p.cohort is not distinct from g.cohort and p.onboarding_completed_at is not null
      and u.email_confirmed_at is not null
      and exists(select 1 from public.memberships m where m.user_id=a.user_id and m.status='active' and (m.ended_at is null or m.ended_at>now()))
      and exists(select 1 from public.member_cohorts h where h.user_id=a.user_id and h.cohort=g.cohort)
      and exists(select 1 from public.talk_group_members tm where tm.user_id=a.user_id and tm.cohort=g.cohort and tm.group_id=g.id)
      and exists(select 1 from public.member_invitations i where i.claimed_by=a.user_id and i.claimed_at is not null and i.cohort=g.cohort and i.group_id=g.id)
    ) order by g.cohort,g.name,p.full_name)
    from public.guide_accounts a join public.guide_assignments ga on ga.user_id=a.user_id
    join public.talk_groups g on g.id=ga.group_id join public.profiles p on p.id=a.user_id
    join auth.users u on u.id=a.user_id where a.status='active'),'[]'::jsonb);
end;
$$;
revoke all on function public.admin_guide_member_roster() from public,anon;
grant execute on function public.admin_guide_member_roster() to authenticated;
