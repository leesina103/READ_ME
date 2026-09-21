-- 기수 시작일은 운영 기록으로 보존하고, 작성 일정은 실제 그룹 모임으로 계산한다.
create or replace function public.talk_due_at(p_starts_at timestamptz, p_week integer, p_meeting_at timestamptz)
returns timestamptz language sql immutable set search_path = '' as $$
  select case when p_week % 2 = 1 then
    ((p_meeting_at at time zone 'Asia/Seoul')::date - 2 + time '23:59') at time zone 'Asia/Seoul'
  else
    ((p_meeting_at at time zone 'Asia/Seoul')::date + 7
      + ((7 - extract(dow from p_meeting_at at time zone 'Asia/Seoul')::integer) % 7)
      + time '23:59') at time zone 'Asia/Seoul'
  end;
$$;

create or replace function public.talk_week_opens_at(target_cohort text, target_week smallint)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select case when target_week % 2 = 1 then s.starts_at - interval '7 days'
    else ((s.starts_at at time zone 'Asia/Seoul')::date + 1)::timestamp at time zone 'Asia/Seoul' end
  from public.talk_group_members m join public.talk_meetings s on s.group_id=m.group_id
  where m.user_id=auth.uid() and m.cohort=target_cohort
    and s.week_number=case when target_week % 2=1 then target_week else target_week-1 end
    and target_week between 1 and 8
    and public.has_active_membership() and public.is_cohort_member(target_cohort);
$$;

create or replace function public.my_talk_schedule(p_cohort text)
returns table(week_number integer, group_name text, meeting_at timestamptz, due_at timestamptz, opens_at timestamptz, answered boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_active_membership() or not public.is_cohort_member(p_cohort) then
    raise exception 'membership_required' using errcode = '42501';
  end if;
  return query
  select w, g.name, case when w % 2=1 then s.starts_at else null::timestamptz end,
    public.talk_due_at(null,w,s.starts_at), public.talk_week_opens_at(p_cohort,w::smallint),
    exists(select 1 from public.session_answers a where a.cohort=p_cohort and a.week_number=w and a.user_id=auth.uid())
  from public.cohorts c cross join generate_series(1,8) w
  left join public.talk_group_members m on m.cohort=c.name and m.user_id=auth.uid()
  left join public.talk_groups g on g.id=m.group_id
  left join public.talk_meetings s on s.group_id=g.id and s.week_number=case when w % 2=1 then w else w-1 end
  where c.name=p_cohort;
end;
$$;

-- 희망 요일은 더 이상 접수하지 않는다. 기존 입력은 삭제하지 않고 보존한다.
revoke insert, update on public.talk_day_preferences from authenticated;
create or replace function public.admin_talk_members(p_cohort text)
returns table(user_id uuid, display_name text, weekday smallint, group_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  return query select p.id,p.display_name,null::smallint,m.group_id from public.profiles p
    left join public.talk_group_members m on m.user_id=p.id and m.cohort=p.cohort
    where p.cohort=p_cohort and p.onboarding_completed_at is not null order by p.display_name,p.id;
end;
$$;
