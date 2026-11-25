-- 회원 자기소개와 별도로, 가이드 본인이 회원 공개용으로 작성합니다.
alter table public.profiles add column guide_introduction text not null default ''
  check (char_length(guide_introduction) <= 600);
grant update (guide_introduction) on public.profiles to authenticated;

create function public.member_guide_profiles(p_group_id uuid default null)
returns table(guide_id uuid, nickname text, introduction text)
language sql stable security definer set search_path = '' as $$
  select p.id, btrim(p.display_name), p.guide_introduction
  from public.profiles p
  join public.guide_accounts ga on ga.user_id = p.id and ga.status = 'active'
  where auth.uid() is not null and nullif(btrim(p.display_name), '') is not null
    and exists (
      select 1 from public.guide_assignments a
      where a.user_id = p.id and (
        (p_group_id is null and public.has_active_membership())
        or (a.group_id = p_group_id and exists (
          select 1 from public.talk_group_members m
          where m.group_id = a.group_id and m.user_id = auth.uid()
        ))
      )
    )
  order by btrim(p.display_name), p.id;
$$;
revoke all on function public.member_guide_profiles(uuid) from public, anon;
grant execute on function public.member_guide_profiles(uuid) to authenticated;

create or replace function public.list_member_guides()
returns table(host_name text, host_style text)
language sql stable security invoker set search_path = '' as $$
  select nickname, introduction from public.member_guide_profiles();
$$;

create or replace function public.guide_save_group(p_group uuid,p_details jsonb,p_before jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare g public.talk_groups%rowtype; c public.cohorts%rowtype; old_value jsonb; duration integer;
begin
  -- 권한 확인과 저장 사이에 담당 배정이 바뀌지 않도록 잠급니다.
  perform 1 from public.guide_accounts where user_id=auth.uid() and status='active' for share;
  perform 1 from public.guide_assignments where group_id=p_group and user_id=auth.uid() for share;
  if not private.can_guide(p_group) then raise exception 'guide_required' using errcode='42501'; end if;
  select * into g from public.talk_groups where id=p_group for update;
  select * into c from public.cohorts where name=g.cohort for share;
  if c.ends_at<=now() then raise exception 'cohort_ended'; end if;
  old_value:=jsonb_build_object('host_name',g.host_name,'host_style',g.host_style,'venue',g.venue,'duration_minutes',g.duration_minutes,
    'meetings',(select coalesce(jsonb_agg(jsonb_build_object('week_number',week_number,'starts_at',starts_at) order by week_number),'[]') from public.talk_meetings where group_id=p_group));
  if old_value is distinct from p_before then raise exception 'stale_group'; end if;
  duration:=(p_details->>'duration_minutes')::integer;
  if coalesce(length(trim(p_details->>'venue')),0) not between 1 and 200 or duration is null or duration not between 30 and 480 then raise exception 'invalid_details'; end if;
  if jsonb_typeof(p_details->'meetings') is distinct from 'array' then raise exception 'invalid_schedule'; end if;
  if (select array_agg(m.week_number order by m.week_number) from jsonb_to_recordset(p_details->'meetings') as m(week_number integer,starts_at timestamptz)) is distinct from array[1,3,5,7] then raise exception 'invalid_schedule'; end if;
  if exists(select 1 from jsonb_to_recordset(p_details->'meetings') as m(week_number integer,starts_at timestamptz)
    left join public.talk_meetings old on old.group_id=p_group and old.week_number=m.week_number
    where m.starts_at is null or not isfinite(m.starts_at) or m.starts_at<c.starts_at or m.starts_at>c.ends_at
    or ((old.starts_at<=now() or m.starts_at<=now()) and m.starts_at is distinct from old.starts_at)) then raise exception 'invalid_schedule'; end if;
  if exists(select 1 from (select starts_at,lag(starts_at) over(order by week_number) prev from jsonb_to_recordset(p_details->'meetings') as m(week_number integer,starts_at timestamptz)) t where starts_at<=prev) then raise exception 'invalid_schedule'; end if;
  update public.talk_groups set venue=trim(p_details->>'venue'),duration_minutes=duration where id=p_group;
  insert into public.talk_meetings(group_id,week_number,starts_at) select p_group,m.week_number,m.starts_at from jsonb_to_recordset(p_details->'meetings') as m(week_number smallint,starts_at timestamptz) on conflict(group_id,week_number) do update set starts_at=excluded.starts_at;
  insert into public.guide_audit(actor_id,action,target_id,before_value,after_value) values(auth.uid(),'save_group',p_group,old_value,p_details);
end;
$$;

-- 그룹과 담당자 배정을 함께 저장해 배정 실패 시 빈 그룹을 남기지 않습니다.
create function public.admin_create_guided_group(p_cohort text, p_name text, p_guide uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare new_group uuid;
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  perform 1 from public.profiles where id = p_guide for update;
  if not exists (select 1 from public.guide_accounts where user_id = p_guide and status in ('active','pending'))
     or exists (select 1 from public.guide_assignments where user_id = p_guide) then
    raise exception 'guide_unavailable';
  end if;
  insert into public.talk_groups(cohort, name) values (p_cohort, btrim(p_name)) returning id into new_group;
  perform public.admin_manage_guide('approve', p_guide, array[new_group]);
end;
$$;
revoke all on function public.admin_create_guided_group(text,text,uuid) from public, anon;
grant execute on function public.admin_create_guided_group(text,text,uuid) to authenticated;
