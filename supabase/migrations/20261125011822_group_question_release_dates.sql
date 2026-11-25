-- 공개일의 기준 모임은 1·2·3주차에는 첫 모임, 이후에는 직전 오프라인 모임입니다.
create function private.group_talk_week_opens_at(p_group uuid, p_week integer)
returns timestamptz language sql stable strict set search_path = '' as $$
  select ((m.starts_at at time zone 'Asia/Seoul')::date
          + case when p_week = 1 then -14 else 1 end)::timestamp at time zone 'Asia/Seoul'
  from public.talk_meetings m
  where m.group_id = p_group and p_week between 1 and 8
    and m.week_number = case when p_week = 1 then 1
                             when p_week % 2 = 0 then p_week - 1
                             else p_week - 2 end;
$$;
revoke all on function private.group_talk_week_opens_at(uuid, integer) from public, anon, authenticated;

create or replace function public.talk_week_opens_at(target_cohort text, target_week smallint)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select private.group_talk_week_opens_at(private.member_view_group(target_cohort), target_week)
  where public.has_active_membership() and public.is_cohort_member(target_cohort);
$$;

create or replace function public.guide_group_answers(p_group uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_guide(p_group) then raise exception 'guide_required' using errcode='42501'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object('week', w.week, 'opens_at', w.opens_at, 'answers', (
      select coalesce(jsonb_agg(jsonb_build_object('nickname', p.display_name, 'content', a.content) order by a.created_at), '[]')
      from public.session_answers a
      join public.talk_group_members tm on tm.user_id = a.user_id and tm.cohort = a.cohort
      join public.profiles p on p.id = a.user_id
      where tm.group_id = p_group and a.week_number = w.week
    )) order by w.week), '[]')
    from (select week, private.group_talk_week_opens_at(p_group, week) as opens_at
          from generate_series(1, 8) week) w
    where w.opens_at <= now()
  );
end;
$$;
