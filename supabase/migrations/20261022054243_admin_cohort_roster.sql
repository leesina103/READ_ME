-- 운영자만 기수별 실제 배정과 가입 대기 명단을 조회합니다.
create or replace function public.admin_cohort_roster(p_cohort text)
returns table (
  person_key text,
  group_id uuid,
  name text,
  display_name text,
  registration_status text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_talk_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  return query
  select 'member:' || p.id::text, m.group_id,
    coalesce(nullif(trim(p.full_name), ''), '이름 미등록'),
    case when p.onboarding_completed_at is not null then p.display_name else null end,
    'joined'::text
  from public.member_cohorts h
  join public.profiles p on p.id = h.user_id
  left join public.talk_group_members m on m.user_id = h.user_id and m.cohort = h.cohort
  where h.cohort = p_cohort
  union all
  select 'invitation:' || i.id::text, i.group_id, i.name, null::text, 'pending'::text
  from public.member_invitations i
  where i.cohort = p_cohort and i.claimed_by is null
  order by 3, 1;
end;
$$;
revoke all on function public.admin_cohort_roster(text) from public, anon;
grant execute on function public.admin_cohort_roster(text) to authenticated;
