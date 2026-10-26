-- 초대 발급·취소 기록은 보관하지 않습니다. 배정 이력 비우기는 화면에서만 숨깁니다.
delete from public.guide_audit where action in ('invite','cancel_invite');
alter table public.guide_audit add column hidden_at timestamptz;

create function public.admin_clear_guide_audit() returns void
language plpgsql security definer set search_path='' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  update public.guide_audit set hidden_at=now() where hidden_at is null;
end;
$$;
revoke all on function public.admin_clear_guide_audit() from public,anon;
grant execute on function public.admin_clear_guide_audit() to authenticated;

create or replace function public.admin_guide_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  return jsonb_build_object(
    'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'nickname',p.display_name,
      'email',u.email,'member_id',(select i.id from public.member_invitations i where i.claimed_by=p.id limit 1),'ready',p.onboarding_completed_at is not null and u.email_confirmed_at is not null,
      'status',g.status,'groups',(select coalesce(jsonb_agg(a.group_id),'[]') from public.guide_assignments a where a.user_id=p.id)) order by g.created_at desc nulls last,p.full_name)
      from public.profiles p join auth.users u on u.id=p.id left join public.guide_accounts g on g.user_id=p.id
      where coalesce(u.raw_app_meta_data->>'role','')<>'admin'),'[]'),
    'groups',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'cohort',t.cohort,'guide_id',a.user_id,'ended',coalesce(c.ends_at<=now(),false),'first_meeting_at',(select min(m.starts_at) from public.talk_meetings m where m.group_id=t.id),'duration_minutes',t.duration_minutes) order by t.cohort,t.name)
      from public.talk_groups t join public.cohorts c on c.name=t.cohort left join public.guide_assignments a on a.group_id=t.id),'[]'),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'expires_at',expires_at,'claimed',claimed_by is not null,'revoked',revoked_at is not null,'created_at',created_at,'can_reveal',token_value is not null) order by created_at desc) from public.guide_invitations where claimed_by is null and revoked_at is null and expires_at>now()),'[]'),
    'audit',coalesce((select jsonb_agg(v) from (select a.action,a.target_id,a.created_at,p.full_name as actor,a.before_value,a.after_value,coalesce(a.context,private.guide_audit_context(a.action,a.target_id,a.before_value,a.after_value) || '{"historical_approx":true}'::jsonb) as context from public.guide_audit a left join public.profiles p on p.id=a.actor_id where a.hidden_at is null order by a.id desc limit 50) v),'[]'));
end;
$$;

create or replace function public.admin_manage_guide(p_action text,p_user uuid default null,p_groups uuid[] default '{}',p_invitation uuid default null,p_token text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid; old_value jsonb;
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if p_action='invite' then
    if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid_token'; end if;
    insert into public.guide_invitations(token_value,token_hash,created_by) values(p_token,encode(sha256(convert_to(p_token,'UTF8')),'hex'),auth.uid()) returning id into result_id;
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
  if p_action not in ('invite','cancel_invite') then
  insert into public.guide_audit(actor_id,action,target_id,before_value,after_value)
    values(auth.uid(),p_action,result_id,old_value,case when p_action='approve' then jsonb_build_object('groups',p_groups) else null end);
  end if;
  return result_id;
end;
$$;
