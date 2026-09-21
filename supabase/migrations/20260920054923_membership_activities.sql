-- 모임 정보와 채팅방 비밀을 분리하고, 상태 변경은 잠금을 잡는 함수로만 처리한다.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.activity_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from auth.users where id = auth.uid() and raw_app_meta_data->>'role' = 'admin'
  );
$$;
revoke all on function private.activity_admin() from public, anon;
grant execute on function private.activity_admin() to authenticated;

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id),
  host_name text not null check (length(btrim(host_name)) between 1 and 80),
  kind text not null check (kind in ('book-club', 'gatherings')),
  title text not null check (length(btrim(title)) between 2 and 120),
  description text not null check (length(btrim(description)) between 2 and 5000),
  starts_at timestamptz not null,
  closes_at timestamptz not null check (closes_at <= starts_at),
  location text not null check (length(btrim(location)) between 1 and 300),
  capacity integer not null check (capacity between 1 and 100),
  reserved_count integer not null default 0 check (reserved_count >= 0 and reserved_count <= capacity),
  fee integer not null,
  book_title text not null default '',
  reading_scope text not null default '',
  included text not null check (length(btrim(included)) between 1 and 1000),
  extra_cost text not null check (length(btrim(extra_cost)) between 1 and 1000),
  contact text not null check (length(btrim(contact)) between 1 and 300),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'gatherings' and fee = 3000) or (kind = 'book-club' and fee between 30000 and 40000)),
  check (kind <> 'book-club' or (length(btrim(book_title)) between 1 and 160 and length(btrim(reading_scope)) between 1 and 1000))
);
create index activities_schedule_idx on public.activities(kind, status, starts_at);
create index activities_host_idx on public.activities(host_id);

create table public.activity_payment_details (
  activity_id uuid primary key references public.activities(id) on delete cascade,
  bank_info text not null check (length(btrim(bank_info)) between 2 and 300)
);
create table public.activity_chat_details (
  activity_id uuid primary key references public.activities(id) on delete cascade,
  chat_url text not null check (chat_url ~ '^https://open[.]kakao[.]com/o/[A-Za-z0-9]+/?$'),
  chat_password text not null default '' check (length(chat_password) <= 100)
);
create table public.activity_registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id),
  user_id uuid not null references auth.users(id),
  member_name text not null,
  payer_name text not null check (length(btrim(payer_name)) between 1 and 80),
  payment_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  amount integer not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  refund_status text not null default 'none' check (refund_status in ('none', 'check_payment', 'pending', 'completed', 'not_due')),
  refund_eligible boolean not null default false,
  refund_amount integer not null default 0 check (refund_amount >= 0 and refund_amount <= amount),
  paid_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  reviewed_by uuid references auth.users(id),
  policy_version text not null default 'seven-days-v1',
  created_at timestamptz not null default now()
);
create unique index activity_one_active_registration on public.activity_registrations(activity_id, user_id) where status <> 'cancelled';
create index activity_registrations_user_idx on public.activity_registrations(user_id, created_at desc);
create index activity_registrations_review_idx on public.activity_registrations(reviewed_by);
create table public.activity_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  member_name text not null,
  title text not null check (length(btrim(title)) between 2 and 120),
  content text not null check (length(btrim(content)) between 2 and 3000),
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  created_at timestamptz not null default now()
);
create index activity_proposals_user_idx on public.activity_proposals(user_id);

alter table public.activities enable row level security;
alter table public.activity_payment_details enable row level security;
alter table public.activity_chat_details enable row level security;
alter table public.activity_registrations enable row level security;
alter table public.activity_proposals enable row level security;
revoke all on public.activities, public.activity_payment_details, public.activity_chat_details, public.activity_registrations, public.activity_proposals from anon, authenticated;
grant select on public.activities, public.activity_payment_details, public.activity_chat_details, public.activity_registrations, public.activity_proposals to authenticated;

create policy activities_read on public.activities for select to authenticated using (
  (select private.activity_admin()) or (status <> 'draft' and (select public.has_active_membership()))
);
create policy registrations_read on public.activity_registrations for select to authenticated using (
  user_id = (select auth.uid()) or (select private.activity_admin())
);
create policy payment_details_read on public.activity_payment_details for select to authenticated using (
  (select private.activity_admin()) or ((select public.has_active_membership()) and exists (
    select 1 from public.activity_registrations r where r.activity_id = activity_payment_details.activity_id and r.user_id = (select auth.uid()) and r.status = 'pending'
  ))
);
create policy chat_details_read on public.activity_chat_details for select to authenticated using (
  (select private.activity_admin()) or ((select public.has_active_membership()) and exists (
    select 1 from public.activity_registrations r join public.activities a on a.id = r.activity_id
    where r.activity_id = activity_chat_details.activity_id and r.user_id = (select auth.uid()) and r.status = 'confirmed' and a.status <> 'cancelled'
  ))
);
create policy proposals_read on public.activity_proposals for select to authenticated using (
  user_id = (select auth.uid()) or (select private.activity_admin())
);

create function private.save_activity(p_id uuid, p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_old public.activities; v_new public.activities;
begin
  if not private.activity_admin() then raise exception 'admin_required'; end if;
  select * into v_new from jsonb_populate_record(null::public.activities, p_data);
  if v_new.status not in ('draft', 'open', 'closed') or v_new.status is null then raise exception 'invalid_activity'; end if;
  if p_id is not null then
    select * into v_old from public.activities where id = p_id for update;
    if not found or v_old.status = 'cancelled' then raise exception 'activity_unavailable'; end if;
    if exists (select 1 from public.activity_registrations where activity_id = p_id) and
      (v_old.kind, v_old.starts_at, v_old.location, v_old.fee, v_old.book_title, v_old.reading_scope, v_old.included, v_old.extra_cost, v_old.host_name)
      is distinct from (v_new.kind, v_new.starts_at, v_new.location, v_new.fee, v_new.book_title, v_new.reading_scope, v_new.included, v_new.extra_cost, v_new.host_name)
    then raise exception 'registered_details_locked'; end if;
    if v_old.status <> 'draft' and v_new.status = 'draft' then raise exception 'cannot_unpublish'; end if;
    update public.activities set host_name=v_new.host_name, kind=v_new.kind, title=v_new.title, description=v_new.description,
      starts_at=v_new.starts_at, closes_at=v_new.closes_at, location=v_new.location, capacity=v_new.capacity,
      fee=v_new.fee, book_title=v_new.book_title, reading_scope=v_new.reading_scope, included=v_new.included,
      extra_cost=v_new.extra_cost, contact=v_new.contact, status=v_new.status, updated_at=now()
    where id=p_id returning id into v_id;
  else
    if v_new.starts_at <= now() or v_new.closes_at <= now() then raise exception 'invalid_schedule'; end if;
    insert into public.activities(host_id,host_name,kind,title,description,starts_at,closes_at,location,capacity,fee,book_title,reading_scope,included,extra_cost,contact,status)
    values(auth.uid(),v_new.host_name,v_new.kind,v_new.title,v_new.description,v_new.starts_at,v_new.closes_at,v_new.location,v_new.capacity,v_new.fee,v_new.book_title,v_new.reading_scope,v_new.included,v_new.extra_cost,v_new.contact,v_new.status)
    returning id into v_id;
  end if;
  insert into public.activity_payment_details values(v_id, p_data->>'bank_info')
    on conflict(activity_id) do update set bank_info=excluded.bank_info;
  insert into public.activity_chat_details values(v_id, p_data->>'chat_url', coalesce(p_data->>'chat_password',''))
    on conflict(activity_id) do update set chat_url=excluded.chat_url, chat_password=excluded.chat_password;
  return v_id;
end;
$$;

create function private.register_activity(p_activity_id uuid, p_payer_name text, p_policy_accepted boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a public.activities; v_id uuid; v_name text;
begin
  if auth.uid() is null or not public.has_active_membership() then raise exception 'membership_required'; end if;
  if p_policy_accepted is distinct from true then raise exception 'policy_required'; end if;
  select * into a from public.activities where id=p_activity_id for update;
  if not found or a.status <> 'open' or a.closes_at <= now() or a.starts_at <= now() then raise exception 'activity_closed'; end if;
  if a.host_id = auth.uid() then raise exception 'host_exempt'; end if;
  if exists(select 1 from public.activity_registrations where activity_id=a.id and user_id=auth.uid() and (status <> 'cancelled' or refund_status in ('check_payment','pending'))) then raise exception 'already_registered'; end if;
  if a.reserved_count >= a.capacity then raise exception 'activity_full'; end if;
  select display_name into v_name from public.profiles where id=auth.uid() and onboarding_completed_at is not null;
  if v_name is null then raise exception 'membership_required'; end if;
  insert into public.activity_registrations(activity_id,user_id,member_name,payer_name,amount)
    values(a.id,auth.uid(),v_name,btrim(p_payer_name),a.fee) returning id into v_id;
  update public.activities set reserved_count=reserved_count+1 where id=a.id;
  return v_id;
end;
$$;

create function private.cancel_activity_registration(p_registration_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.activities; r public.activity_registrations; v_activity_id uuid; v_eligible boolean;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  select activity_id into v_activity_id from public.activity_registrations where id=p_registration_id and user_id=auth.uid();
  if not found then raise exception 'registration_missing'; end if;
  select * into a from public.activities where id=v_activity_id for update;
  select * into r from public.activity_registrations where id=p_registration_id for update;
  if r.status='cancelled' then return; end if;
  if a.starts_at <= now() then raise exception 'activity_started'; end if;
  v_eligible := now() <= a.starts_at - interval '7 days' or a.status='cancelled';
  update public.activity_registrations set status='cancelled',cancelled_at=now(),refund_eligible=v_eligible,
    refund_status=case when paid_at is null then 'check_payment' when v_eligible then 'pending' else 'not_due' end,
    refund_amount=case when paid_at is not null and v_eligible then amount else 0 end
    where id=r.id;
  update public.activities set reserved_count=reserved_count-1 where id=a.id;
end;
$$;

create function private.review_activity_registration(p_registration_id uuid, p_operation text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.activities; r public.activity_registrations; v_activity_id uuid;
begin
  if not private.activity_admin() then raise exception 'admin_required'; end if;
  select activity_id into v_activity_id from public.activity_registrations where id=p_registration_id;
  if not found then raise exception 'registration_missing'; end if;
  select * into a from public.activities where id=v_activity_id for update;
  select * into r from public.activity_registrations where id=p_registration_id for update;
  if p_operation='confirm_payment' then
    if r.paid_at is not null then return; end if;
    if r.status='cancelled' then
      update public.activity_registrations set paid_at=now(),reviewed_by=auth.uid(),
        refund_status=case when refund_eligible then 'pending' else 'not_due' end,
        refund_amount=case when refund_eligible then amount else 0 end where id=r.id;
    elsif r.status='pending' and a.status <> 'cancelled' and a.starts_at > now() then
      update public.activity_registrations set status='confirmed',paid_at=now(),reviewed_by=auth.uid() where id=r.id;
    else raise exception 'invalid_transition'; end if;
  elsif p_operation='refund' then
    if r.refund_status='completed' then return; end if;
    if r.refund_status <> 'pending' or r.paid_at is null then raise exception 'invalid_transition'; end if;
    update public.activity_registrations set refund_status='completed',refunded_at=now(),reviewed_by=auth.uid() where id=r.id;
  elsif p_operation='unpaid' then
    if r.paid_at is not null then raise exception 'invalid_transition'; end if;
    if r.status <> 'cancelled' then
      update public.activities set reserved_count=reserved_count-1 where id=a.id;
    end if;
    update public.activity_registrations set status='cancelled',cancelled_at=coalesce(cancelled_at,now()),
      refund_status='none',refund_eligible=case when r.status='cancelled' then r.refund_eligible else (a.status='cancelled' or now() <= a.starts_at-interval '7 days') end,reviewed_by=auth.uid() where id=r.id;
  else raise exception 'invalid_transition'; end if;
end;
$$;

create function private.cancel_activity(p_activity_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.activity_admin() then raise exception 'admin_required'; end if;
  perform 1 from public.activities where id=p_activity_id for update;
  if not found then raise exception 'activity_unavailable'; end if;
  update public.activities set status='cancelled',reserved_count=0,updated_at=now() where id=p_activity_id;
  -- 운영 취소는 먼저 취소했던 회원도 전액 환불 대상으로 올린다.
  update public.activity_registrations set status='cancelled',cancelled_at=coalesce(cancelled_at,now()),refund_eligible=true,
    refund_status=case when refund_status='completed' then 'completed' when paid_at is null then 'check_payment' else 'pending' end,
    refund_amount=case when paid_at is null then 0 else amount end,reviewed_by=auth.uid()
    where activity_id=p_activity_id;
end;
$$;

create function private.submit_activity_proposal(p_title text, p_content text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if auth.uid() is null or not public.has_active_membership() then raise exception 'membership_required'; end if;
  select display_name into v_name from public.profiles where id=auth.uid() and onboarding_completed_at is not null;
  if v_name is null then raise exception 'membership_required'; end if;
  insert into public.activity_proposals(user_id,member_name,title,content) values(auth.uid(),v_name,btrim(p_title),btrim(p_content));
end;
$$;
create function private.review_activity_proposal(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.activity_admin() then raise exception 'admin_required'; end if;
  update public.activity_proposals set status='reviewed' where id=p_id;
  if not found then raise exception 'proposal_missing'; end if;
end;
$$;

-- 공개 함수는 권한 상승 없이 비공개 구현을 호출한다. 구현에도 호출자 검증을 둔다.
create function public.save_activity(p_id uuid, p_data jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.save_activity(p_id,p_data); $$;
create function public.register_activity(p_activity_id uuid,p_payer_name text,p_policy_accepted boolean) returns uuid language sql security invoker set search_path='' as $$ select private.register_activity(p_activity_id,p_payer_name,p_policy_accepted); $$;
create function public.cancel_activity_registration(p_registration_id uuid) returns void language sql security invoker set search_path='' as $$ select private.cancel_activity_registration(p_registration_id); $$;
create function public.review_activity_registration(p_registration_id uuid,p_operation text) returns void language sql security invoker set search_path='' as $$ select private.review_activity_registration(p_registration_id,p_operation); $$;
create function public.cancel_activity(p_activity_id uuid) returns void language sql security invoker set search_path='' as $$ select private.cancel_activity(p_activity_id); $$;
create function public.submit_activity_proposal(p_title text,p_content text) returns void language sql security invoker set search_path='' as $$ select private.submit_activity_proposal(p_title,p_content); $$;
create function public.review_activity_proposal(p_id uuid) returns void language sql security invoker set search_path='' as $$ select private.review_activity_proposal(p_id); $$;

revoke all on function private.save_activity(uuid,jsonb), private.register_activity(uuid,text,boolean), private.cancel_activity_registration(uuid), private.review_activity_registration(uuid,text), private.cancel_activity(uuid), private.submit_activity_proposal(text,text), private.review_activity_proposal(uuid) from public,anon;
grant execute on function private.save_activity(uuid,jsonb), private.register_activity(uuid,text,boolean), private.cancel_activity_registration(uuid), private.review_activity_registration(uuid,text), private.cancel_activity(uuid), private.submit_activity_proposal(text,text), private.review_activity_proposal(uuid) to authenticated;
revoke all on function public.save_activity(uuid,jsonb), public.register_activity(uuid,text,boolean), public.cancel_activity_registration(uuid), public.review_activity_registration(uuid,text), public.cancel_activity(uuid), public.submit_activity_proposal(text,text), public.review_activity_proposal(uuid) from public,anon;
grant execute on function public.save_activity(uuid,jsonb), public.register_activity(uuid,text,boolean), public.cancel_activity_registration(uuid), public.review_activity_registration(uuid,text), public.cancel_activity(uuid), public.submit_activity_proposal(text,text), public.review_activity_proposal(uuid) to authenticated;
