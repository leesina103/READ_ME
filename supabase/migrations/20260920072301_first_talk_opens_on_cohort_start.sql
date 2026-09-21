-- 1주차 사전 질문만 기수 시작일에 공개한다. 작성 마감은 모임일 기준을 유지한다.
create or replace function public.talk_week_opens_at(target_cohort text, target_week smallint)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select case when target_week=1 then c.starts_at
    when target_week % 2=1 then s.starts_at - interval '7 days'
    else ((s.starts_at at time zone 'Asia/Seoul')::date + 1)::timestamp at time zone 'Asia/Seoul' end
  from public.cohorts c
  left join public.talk_group_members m on m.cohort=c.name and m.user_id=auth.uid()
  left join public.talk_meetings s on s.group_id=m.group_id
    and s.week_number=case when target_week % 2=1 then target_week else target_week-1 end
  where c.name=target_cohort and target_week between 1 and 8
    and public.has_active_membership() and public.is_cohort_member(target_cohort);
$$;
