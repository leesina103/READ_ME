-- 회원 자격과 독립된 가이드 권한. 역할 표에는 직접 접근하지 않습니다.
create table public.guide_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check(status in ('pending','active','rejected','revoked')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.guide_invitations (
  id uuid primary key default gen_random_uuid(), token_hash text not null unique,
  expires_at timestamptz not null default now()+interval '7 days',
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  claimed_by uuid references auth.users(id), revoked_at timestamptz
);
create table public.guide_assignments (
  group_id uuid primary key references public.talk_groups(id) on delete cascade,
  user_id uuid not null references public.guide_accounts(user_id) on delete cascade
);
create index guide_assignments_user_idx on public.guide_assignments(user_id);
create table public.guide_audit (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id),
  action text not null, target_id uuid, before_value jsonb, after_value jsonb,
  created_at timestamptz not null default now()
);
alter table public.guide_accounts enable row level security;
alter table public.guide_invitations enable row level security;
alter table public.guide_assignments enable row level security;
alter table public.guide_audit enable row level security;
revoke all on public.guide_accounts,public.guide_invitations,public.guide_assignments,public.guide_audit from anon,authenticated;

create function public.guide_invitation_valid(p_token text) returns boolean
language sql stable security definer set search_path='' as $$
  select length(p_token)=64 and exists(select 1 from public.guide_invitations
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
    and expires_at>now() and claimed_by is null and revoked_at is null);
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare invitation public.member_invitations%rowtype; signup_name text; guide_inv public.guide_invitations%rowtype;
begin
  signup_name := trim(new.raw_user_meta_data->>'display_name');
  if nullif(new.raw_user_meta_data->>'guide_token','') is not null then
    if signup_name is null or length(signup_name) not between 2 and 30 then raise exception 'invalid_name'; end if;
    select * into guide_inv from public.guide_invitations where
      token_hash=encode(sha256(convert_to(new.raw_user_meta_data->>'guide_token','UTF8')),'hex')
      and expires_at>now() and claimed_by is null and revoked_at is null for update;
    if not found then raise exception 'guide_invitation_unavailable'; end if;
    insert into public.profiles(id,full_name,display_name,cohort) values(new.id,signup_name,signup_name,null);
    insert into public.guide_accounts(user_id,status) values(new.id,'pending');
    update public.guide_invitations set claimed_by=new.id where id=guide_inv.id;
    return new;
  end if;
  select candidate.* into invitation from public.member_invitations candidate
    where lower(trim(candidate.email))=lower(trim(new.email)) and trim(candidate.name)=signup_name
    and candidate.claimed_at is null and candidate.claimed_by is null for update;
  if not found then raise exception 'signup_not_allowed'; end if;
  insert into public.profiles(id,full_name,display_name,cohort)
    values(new.id,invitation.name,invitation.name,invitation.cohort) on conflict(id) do nothing;
  update public.member_invitations set claimed_by=new.id,claimed_at=now() where id=invitation.id;
  return new;
end;
$$;

create function public.my_guide_status() returns text language sql stable security definer set search_path='' as $$
  select status from public.guide_accounts where user_id=auth.uid();
$$;
create function private.can_guide(p_group uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.guide_assignments a join public.guide_accounts g on g.user_id=a.user_id
    where a.group_id=p_group and a.user_id=auth.uid() and g.status='active');
$$;

create function public.admin_guide_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  return jsonb_build_object(
    'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'nickname',p.display_name,
      'email',u.email,'member_id',(select i.id from public.member_invitations i where i.claimed_by=p.id limit 1),'ready',p.onboarding_completed_at is not null and u.email_confirmed_at is not null,
      'status',g.status,'groups',(select coalesce(jsonb_agg(a.group_id),'[]') from public.guide_assignments a where a.user_id=p.id)) order by g.created_at desc nulls last,p.full_name)
      from public.profiles p join auth.users u on u.id=p.id left join public.guide_accounts g on g.user_id=p.id
      where coalesce(u.raw_app_meta_data->>'role','')<>'admin'),'[]'),
    'groups',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'cohort',t.cohort,'guide_id',a.user_id,'ended',coalesce(c.ends_at<=now(),false)) order by t.cohort,t.name)
      from public.talk_groups t join public.cohorts c on c.name=t.cohort left join public.guide_assignments a on a.group_id=t.id),'[]'),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'expires_at',expires_at,'claimed',claimed_by is not null,'revoked',revoked_at is not null) order by created_at desc) from public.guide_invitations),'[]'),
    'audit',coalesce((select jsonb_agg(v) from (select a.action,a.target_id,a.created_at,p.full_name as actor,a.before_value,a.after_value from public.guide_audit a left join public.profiles p on p.id=a.actor_id order by a.id desc limit 50) v),'[]'));
end;
$$;

create function public.admin_manage_guide(p_action text,p_user uuid default null,p_groups uuid[] default '{}',p_invitation uuid default null,p_token text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid; old_value jsonb;
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if p_action='invite' then
    if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid_token'; end if;
    insert into public.guide_invitations(token_hash,created_by) values(encode(sha256(convert_to(p_token,'UTF8')),'hex'),auth.uid()) returning id into result_id;
  elsif p_action='cancel_invite' then
    update public.guide_invitations set revoked_at=now() where id=p_invitation and claimed_by is null returning id into result_id;
    if not found then raise exception 'invitation_unavailable'; end if;
  elsif p_action in ('approve','reject','revoke') then
    -- 프로필 잠금으로 동일 인물에 대한 승인/해제를 직렬화합니다.
    perform 1 from public.profiles where id=p_user for update;
    if not found or exists(select 1 from auth.users where id=p_user and raw_app_meta_data->>'role'='admin') then raise exception 'invalid_guide'; end if;
    select jsonb_build_object('status',g.status,'groups',(select jsonb_agg(group_id) from public.guide_assignments where user_id=p_user)) into old_value from public.guide_accounts g where user_id=p_user;
    if p_action='approve' then
      if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=p_user and p.onboarding_completed_at is not null and u.email_confirmed_at is not null) then raise exception 'onboarding_required'; end if;
      if coalesce(cardinality(p_groups),0)=0 or array_position(p_groups,null) is not null then raise exception 'group_required'; end if;
      if exists(select 1 from unnest(p_groups) x where not exists(select 1 from public.talk_groups t join public.cohorts c on c.name=t.cohort where t.id=x and (c.ends_at is null or c.ends_at>now()))) then raise exception 'group_unavailable'; end if;
      if exists(select 1 from public.guide_assignments where group_id=any(p_groups) and user_id<>p_user) then raise exception 'group_already_assigned'; end if;
      insert into public.guide_accounts(user_id,status) values(p_user,'active') on conflict(user_id) do update set status='active',updated_at=now();
      delete from public.guide_assignments where user_id=p_user;
      insert into public.guide_assignments(group_id,user_id) select distinct unnest(p_groups),p_user;
    else
      update public.guide_accounts set status=case when p_action='reject' then 'rejected' else 'revoked' end,updated_at=now() where user_id=p_user;
      if not found then raise exception 'guide_not_found'; end if;
      delete from public.guide_assignments where user_id=p_user;
    end if;
    result_id:=p_user;
  else raise exception 'invalid_action'; end if;
  insert into public.guide_audit(actor_id,action,target_id,before_value,after_value)
    values(auth.uid(),p_action,result_id,old_value,case when p_action='approve' then jsonb_build_object('groups',p_groups) else null end);
  return result_id;
end;
$$;

create function public.guide_groups() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'cohort',g.cohort,'venue',g.venue,'ended',coalesce(c.ends_at<=now(),false)) order by g.cohort,g.name),'[]')
    from public.talk_groups g join public.cohorts c on c.name=g.cohort where private.can_guide(g.id);
$$;
create function public.guide_group_detail(p_group uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.can_guide(p_group) then raise exception 'guide_required' using errcode='42501'; end if;
  return (select jsonb_build_object('id',g.id,'name',g.name,'cohort',g.cohort,'host_name',g.host_name,'host_style',g.host_style,'venue',g.venue,'duration_minutes',g.duration_minutes,'ended',coalesce(c.ends_at<=now(),false),
    'meetings',coalesce((select jsonb_agg(jsonb_build_object('week_number',m.week_number,'starts_at',m.starts_at) order by m.week_number) from public.talk_meetings m where m.group_id=g.id),'[]'),
    'members',coalesce((select jsonb_agg(jsonb_build_object('name',p.full_name,'nickname',p.display_name) order by p.full_name) from public.talk_group_members tm join public.profiles p on p.id=tm.user_id where tm.group_id=g.id),'[]'),
    'pending',(select count(*) from public.member_invitations i where i.group_id=g.id and i.claimed_by is null),
    'audit',coalesce((select jsonb_agg(x) from (select a.created_at,p.full_name as actor,a.before_value,a.after_value from public.guide_audit a left join public.profiles p on p.id=a.actor_id where a.action='save_group' and a.target_id=g.id order by a.id desc limit 10) x),'[]'))
    from public.talk_groups g join public.cohorts c on c.name=g.cohort where g.id=p_group);
end;
$$;

create function public.guide_save_group(p_group uuid,p_details jsonb,p_before jsonb) returns void
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
  if coalesce(length(trim(p_details->>'host_name')),0) not between 1 and 80 or coalesce(length(trim(p_details->>'host_style')),0) not between 1 and 600 or coalesce(length(trim(p_details->>'venue')),0) not between 1 and 200 or duration is null or duration not between 30 and 480 then raise exception 'invalid_details'; end if;
  if jsonb_typeof(p_details->'meetings') is distinct from 'array' then raise exception 'invalid_schedule'; end if;
  if (select array_agg(m.week_number order by m.week_number) from jsonb_to_recordset(p_details->'meetings') as m(week_number integer,starts_at timestamptz)) is distinct from array[1,3,5,7] then raise exception 'invalid_schedule'; end if;
  if exists(select 1 from jsonb_to_recordset(p_details->'meetings') as m(week_number integer,starts_at timestamptz)
    left join public.talk_meetings old on old.group_id=p_group and old.week_number=m.week_number
    where m.starts_at is null or not isfinite(m.starts_at) or m.starts_at<c.starts_at or m.starts_at>c.ends_at
    or ((old.starts_at<=now() or m.starts_at<=now()) and m.starts_at is distinct from old.starts_at)) then raise exception 'invalid_schedule'; end if;
  if exists(select 1 from (select starts_at,lag(starts_at) over(order by week_number) prev from jsonb_to_recordset(p_details->'meetings') as m(week_number integer,starts_at timestamptz)) t where starts_at<=prev) then raise exception 'invalid_schedule'; end if;
  update public.talk_groups set host_name=trim(p_details->>'host_name'),host_style=trim(p_details->>'host_style'),venue=trim(p_details->>'venue'),duration_minutes=duration where id=p_group;
  insert into public.talk_meetings(group_id,week_number,starts_at) select p_group,m.week_number,m.starts_at from jsonb_to_recordset(p_details->'meetings') as m(week_number smallint,starts_at timestamptz) on conflict(group_id,week_number) do update set starts_at=excluded.starts_at;
  insert into public.guide_audit(actor_id,action,target_id,before_value,after_value) values(auth.uid(),'save_group',p_group,old_value,p_details);
end;
$$;

create function public.guide_group_answers(p_group uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.can_guide(p_group) then raise exception 'guide_required' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('week',w.week,'opens_at',w.opens_at,'answers',
    (select coalesce(jsonb_agg(jsonb_build_object('nickname',p.display_name,'content',a.content) order by a.created_at),'[]')
      from public.session_answers a join public.talk_group_members tm on tm.user_id=a.user_id and tm.cohort=a.cohort
      join public.profiles p on p.id=a.user_id where tm.group_id=p_group and a.week_number=w.week)) order by w.week),'[]')
    from (select week,case when week=1 then c.starts_at when week%2=1 then m.starts_at-interval '7 days'
      else ((m.starts_at at time zone 'Asia/Seoul')::date+1)::timestamp at time zone 'Asia/Seoul' end opens_at
      from public.talk_groups g join public.cohorts c on c.name=g.cohort cross join generate_series(1,8) week
      left join public.talk_meetings m on m.group_id=g.id and m.week_number=case when week%2=1 then week else week-1 end where g.id=p_group) w where w.opens_at<=now());
end;
$$;

revoke all on function public.guide_invitation_valid(text) from public;
grant execute on function public.guide_invitation_valid(text) to anon,authenticated;
revoke all on function private.can_guide(uuid) from public,anon,authenticated;
revoke all on function public.my_guide_status(),public.admin_guide_overview(),public.admin_manage_guide(text,uuid,uuid[],uuid,text),public.guide_groups(),public.guide_group_detail(uuid),public.guide_save_group(uuid,jsonb,jsonb),public.guide_group_answers(uuid) from public,anon;
grant execute on function public.my_guide_status(),public.admin_guide_overview(),public.admin_manage_guide(text,uuid,uuid[],uuid,text),public.guide_groups(),public.guide_group_detail(uuid),public.guide_save_group(uuid,jsonb,jsonb),public.guide_group_answers(uuid) to authenticated;
