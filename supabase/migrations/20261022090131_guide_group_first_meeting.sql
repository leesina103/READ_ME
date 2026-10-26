-- 담당 모임 목록에 첫 회차의 실제 모임 시각을 함께 반환합니다.
create or replace function public.guide_groups() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'cohort',g.cohort,'venue',g.venue,'ended',coalesce(c.ends_at<=now(),false),'first_meeting_at',m.starts_at) order by g.cohort,g.name),'[]')
    from public.talk_groups g join public.cohorts c on c.name=g.cohort
    left join public.talk_meetings m on m.group_id=g.id and m.week_number=1
    where private.can_guide(g.id);
$$;
