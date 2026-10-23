-- 승인 가능한 가이드마다 알림 한 건만 만들고 발송 중복을 막습니다.
create table public.guide_approval_notifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id uuid not null unique default gen_random_uuid(),
  payload jsonb not null,
  lease_id uuid,
  retry_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.guide_approval_notifications enable row level security;
revoke all on public.guide_approval_notifications from anon,authenticated;

create function public.claim_guide_approval_notification() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.guide_approval_notifications%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  insert into public.guide_approval_notifications(user_id,payload)
    select p.id,jsonb_build_object('name',p.full_name,'nickname',p.display_name,'email',u.email)
    from public.profiles p join auth.users u on u.id=p.id join public.guide_accounts g on g.user_id=p.id
    where p.id=auth.uid() and g.status='pending' and p.onboarding_completed_at is not null
      and u.email_confirmed_at is not null
    on conflict(user_id) do nothing;
  update public.guide_approval_notifications n set lease_id=gen_random_uuid(),retry_at=now()+interval '5 minutes'
    where n.user_id=auth.uid() and n.accepted_at is null and (n.retry_at is null or n.retry_at<=now())
      and exists(select 1 from public.guide_accounts g join public.profiles p on p.id=g.user_id
        join auth.users u on u.id=p.id where g.user_id=n.user_id and g.status='pending'
          and p.onboarding_completed_at is not null and u.email_confirmed_at is not null)
    returning * into result;
  if not found then return null; end if;
  return jsonb_build_object('id',result.id,'lease_id',result.lease_id,'payload',result.payload);
end;
$$;
create function public.finish_guide_approval_notification(p_lease uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  update public.guide_approval_notifications set accepted_at=now()
    where user_id=auth.uid() and lease_id=p_lease and accepted_at is null;
end;
$$;
revoke all on function public.claim_guide_approval_notification() from public,anon;
revoke all on function public.finish_guide_approval_notification(uuid) from public,anon;
grant execute on function public.claim_guide_approval_notification() to authenticated;
grant execute on function public.finish_guide_approval_notification(uuid) to authenticated;
