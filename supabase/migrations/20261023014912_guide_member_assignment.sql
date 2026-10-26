-- 배정한 모임의 회원 정보와 가이드 권한을 같은 트랜잭션에서 연결합니다.
create function private.connect_guide_membership(p_user uuid,p_group uuid) returns void
language plpgsql security definer set search_path='' as $$
declare member_name text; member_email text; target_cohort text; invitation public.member_invitations%rowtype;
begin
  select p.full_name,u.email into member_name,member_email from public.profiles p join auth.users u on u.id=p.id where p.id=p_user;
  select g.cohort into target_cohort from public.talk_groups g join public.cohorts c on c.name=g.cohort
    where g.id=p_group and (c.ends_at is null or c.ends_at>now()) for update of g;
  if not found then raise exception 'group_unavailable'; end if;
  select * into invitation from public.member_invitations
    where claimed_by=p_user or lower(trim(email))=lower(trim(member_email))
    order by (claimed_by=p_user) desc nulls last limit 1 for update;
  if found and invitation.claimed_by is not null and invitation.claimed_by<>p_user then
    raise exception 'invitation_claim_conflict';
  end if;
  -- 프로필 트리거가 참여 이력과 활성 회원 자격을 연결합니다.
  update public.profiles set cohort=target_cohort where id=p_user;
  if invitation.id is null then
    insert into public.member_invitations(name,email,cohort,group_id,claimed_by,claimed_at)
      values(member_name,member_email,target_cohort,p_group,p_user,now());
  else
    update public.member_invitations set name=member_name,email=member_email,cohort=target_cohort,
      group_id=p_group,claimed_by=p_user,claimed_at=coalesce(claimed_at,now()) where id=invitation.id;
  end if;
  -- 초대 연결 트리거가 정원을 확인하고 회원의 모임 배정을 저장합니다.
end;
$$;
revoke all on function private.connect_guide_membership(uuid,uuid) from public,anon,authenticated;

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
      if coalesce(cardinality(p_groups),0)<>1 or array_position(p_groups,null) is not null then raise exception 'group_required'; end if;
      if exists(select 1 from unnest(p_groups) x where not exists(select 1 from public.talk_groups t join public.cohorts c on c.name=t.cohort where t.id=x and (c.ends_at is null or c.ends_at>now()))) then raise exception 'group_unavailable'; end if;
      if exists(select 1 from public.guide_assignments where group_id=any(p_groups) and user_id<>p_user) then raise exception 'group_already_assigned'; end if;
      perform private.connect_guide_membership(p_user,p_groups[1]);
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
