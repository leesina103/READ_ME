-- 모임 안내와 네 번의 일정을 하나의 트랜잭션으로 저장합니다.
create function public.admin_save_talk_group(
  p_group_id uuid, p_cohort text, p_host_name text, p_host_style text,
  p_venue text, p_duration_minutes integer, p_application_open boolean, p_meetings jsonb
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  cohort_row public.cohorts%rowtype;
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  select * into cohort_row from public.cohorts where name=p_cohort for share;
  if not found or cohort_row.ends_at<=now() then raise exception 'cohort_unavailable'; end if;
  perform 1 from public.talk_groups where id=p_group_id and cohort=p_cohort for update;
  if not found then raise exception 'group_not_found'; end if;
  if p_host_name is null or char_length(trim(p_host_name)) not between 1 and 80
    or p_host_style is null or char_length(trim(p_host_style)) not between 1 and 600
    or p_venue is null or char_length(trim(p_venue)) not between 1 and 200
    or p_duration_minutes is null or p_duration_minutes not between 30 and 480
    or p_application_open is null then raise exception 'invalid_group_details'; end if;
  if p_meetings is null or jsonb_typeof(p_meetings)<>'array' then raise exception 'invalid_group_schedule'; end if;
  if jsonb_array_length(p_meetings)<>4 then raise exception 'invalid_group_schedule'; end if;
  if (select array_agg(m.week_number order by m.week_number) from jsonb_to_recordset(p_meetings) as m(week_number integer,starts_at timestamptz)) is distinct from array[1,3,5,7]
    then raise exception 'invalid_group_schedule'; end if;
  if exists(select 1 from jsonb_to_recordset(p_meetings) as m(week_number integer,starts_at timestamptz)
    where m.starts_at is null or not isfinite(m.starts_at) or m.starts_at<cohort_row.starts_at
      or (cohort_row.ends_at is not null and m.starts_at>cohort_row.ends_at)
      or (m.starts_at<=now() and (p_application_open or not exists(
        select 1 from public.talk_meetings s where s.group_id=p_group_id and s.week_number=m.week_number and s.starts_at=m.starts_at))))
    then raise exception 'invalid_group_schedule'; end if;
  if exists(select 1 from (select starts_at,lag(starts_at) over(order by week_number) as previous
    from jsonb_to_recordset(p_meetings) as m(week_number integer,starts_at timestamptz)) s where starts_at<=previous)
    then raise exception 'invalid_group_schedule'; end if;
  update public.talk_groups set host_name=trim(p_host_name),host_style=trim(p_host_style),venue=trim(p_venue),
    duration_minutes=p_duration_minutes,application_open=p_application_open where id=p_group_id;
  insert into public.talk_meetings(group_id,week_number,starts_at)
    select p_group_id,m.week_number,m.starts_at from jsonb_to_recordset(p_meetings) as m(week_number smallint,starts_at timestamptz)
    on conflict(group_id,week_number) do update set starts_at=excluded.starts_at;
end;
$$;
revoke all on function public.admin_save_talk_group(uuid,text,text,text,text,integer,boolean,jsonb) from public,anon;
grant execute on function public.admin_save_talk_group(uuid,text,text,text,text,integer,boolean,jsonb) to authenticated;
