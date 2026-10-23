-- 운영자 > 가이드 > 회원. 역할과 기수 범위는 서버의 현재 데이터로 확인합니다.
create function private.staff_cohort(p_cohort text) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from public.cohorts where name=p_cohort)
    and (private.is_talk_admin() or exists(
      select 1 from public.guide_accounts a join public.guide_assignments ga on ga.user_id=a.user_id
      join public.talk_groups g on g.id=ga.group_id
      where a.user_id=auth.uid() and a.status='active' and g.cohort=p_cohort));
$$;
create or replace function private.can_guide(p_group uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.talk_groups where id=p_group) and
    (private.is_talk_admin() or exists(select 1 from public.guide_assignments a join public.guide_accounts g on g.user_id=a.user_id
      where a.group_id=p_group and a.user_id=auth.uid() and g.status='active'));
$$;
create or replace function public.has_active_membership() returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (private.is_talk_admin()
    or exists(select 1 from public.guide_accounts where user_id=auth.uid() and status='active')
    or exists(select 1 from public.memberships where user_id=auth.uid() and status='active' and (ended_at is null or ended_at>now())));
$$;
create or replace function public.is_cohort_member(target_cohort text) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (private.staff_cohort(target_cohort) or exists(
    select 1 from public.member_cohorts where user_id=auth.uid() and cohort=target_cohort));
$$;
create function public.membership_staff_context() returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('role',case when private.is_talk_admin() then 'admin'
    when exists(select 1 from public.guide_accounts where user_id=auth.uid() and status='active') then 'guide' else 'member' end,
    'cohorts',coalesce((select jsonb_agg(name order by starts_at desc,name) from public.cohorts where private.staff_cohort(name)),'[]'));
$$;
-- 본인의 참여 모임을 우선 사용하고, 운영 조회는 담당 모임 중 이름순 첫 모임을 기준으로 합니다.
create function private.member_view_group(p_cohort text) returns uuid
language sql stable security definer set search_path='' as $$
  select g.id from public.talk_groups g where g.cohort=p_cohort and (
    exists(select 1 from public.talk_group_members m where m.group_id=g.id and m.user_id=auth.uid())
    or private.can_guide(g.id)) order by
    exists(select 1 from public.talk_group_members m where m.group_id=g.id and m.user_id=auth.uid()) desc,g.name,g.id limit 1;
$$;
create or replace function public.talk_week_opens_at(target_cohort text,target_week smallint) returns timestamptz
language sql stable security definer set search_path='' as $$
  select case when target_week=1 then c.starts_at when target_week%2=1 then s.starts_at-interval '7 days'
    else ((s.starts_at at time zone 'Asia/Seoul')::date+1)::timestamp at time zone 'Asia/Seoul' end
    from public.cohorts c left join public.talk_meetings s on s.group_id=private.member_view_group(c.name)
      and s.week_number=case when target_week%2=1 then target_week else target_week-1 end
    where c.name=target_cohort and target_week between 1 and 8 and public.has_active_membership() and public.is_cohort_member(target_cohort);
$$;
create or replace function public.my_talk_schedule(p_cohort text)
returns table(week_number integer,group_name text,meeting_at timestamptz,due_at timestamptz,opens_at timestamptz,answered boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.has_active_membership() or not public.is_cohort_member(p_cohort) then raise exception 'membership_required' using errcode='42501'; end if;
  return query select w,g.name,case when w%2=1 then s.starts_at else null::timestamptz end,
    public.talk_due_at(null,w,s.starts_at),public.talk_week_opens_at(p_cohort,w::smallint),
    exists(select 1 from public.session_answers a where a.cohort=p_cohort and a.week_number=w and a.user_id=auth.uid())
    from public.cohorts c cross join generate_series(1,8) w
    left join public.talk_groups g on g.id=private.member_view_group(c.name)
    left join public.talk_meetings s on s.group_id=g.id and s.week_number=case when w%2=1 then w else w-1 end where c.name=p_cohort;
end;
$$;
create function public.staff_member_directory(p_cohort text)
returns table(cohort text,user_id uuid,display_name text,bio text,cohort_message text,introduction_word text)
language plpgsql stable security definer set search_path='' as $$
begin
  if not private.staff_cohort(p_cohort) then raise exception 'cohort_access_required' using errcode='42501'; end if;
  return query select p.cohort,p.id,p.display_name,p.bio,p.cohort_message,p.introduction_word from public.profiles p
    where p.cohort=p_cohort and p.onboarding_completed_at is not null order by p.display_name,p.id;
end;
$$;
-- 운영 조회도 공개된 주차만 허용합니다. 회원의 기존 답변 잠금 정책은 그대로 둡니다.
create function public.can_staff_read_talk(p_cohort text,p_week smallint) returns boolean
language sql stable security definer set search_path='' as $$
  select private.staff_cohort(p_cohort) and public.talk_week_opens_at(p_cohort,p_week)<=now();
$$;
create policy "운영자와 담당 기수 가이드의 공개된 답변 조회" on public.session_answers for select to authenticated
  using(public.can_staff_read_talk(cohort,week_number));
create function public.can_staff_read_cohort(p_cohort text) returns boolean
language sql stable security definer set search_path='' as $$select private.staff_cohort(p_cohort);$$;
create policy "운영자와 담당 기수 가이드의 일정 조회" on public.cohorts for select to authenticated
  using(public.can_staff_read_cohort(name));
revoke all on function private.staff_cohort(text),private.member_view_group(text) from public,anon,authenticated;
revoke all on function public.membership_staff_context(),public.staff_member_directory(text),public.can_staff_read_talk(text,smallint) from public,anon;
grant execute on function public.membership_staff_context(),public.staff_member_directory(text),public.can_staff_read_talk(text,smallint) to authenticated;
revoke all on function public.can_staff_read_cohort(text) from public,anon;
grant execute on function public.can_staff_read_cohort(text) to authenticated;
