-- 운영 자동화 전용 기록입니다. 일반 회원과 비로그인 요청에는 공개하지 않습니다.
create table public.operations_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.operations_state enable row level security;
revoke all on public.operations_state from public, anon, authenticated;
grant all on public.operations_state to service_role;

create table public.operations_worker_lock (
  id boolean primary key default true check (id),
  owner uuid not null,
  expires_at timestamptz not null
);
alter table public.operations_worker_lock enable row level security;
revoke all on public.operations_worker_lock from public, anon, authenticated;
grant all on public.operations_worker_lock to service_role;

create function public.claim_operations_worker(worker uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare acquired boolean;
begin
  insert into public.operations_worker_lock(id, owner, expires_at)
  values(true, worker, now() + interval '5 minutes')
  on conflict(id) do update set owner = excluded.owner, expires_at = excluded.expires_at
  where public.operations_worker_lock.expires_at < now()
  returning true into acquired;
  return coalesce(acquired, false);
end;
$$;
revoke all on function public.claim_operations_worker(uuid) from public, anon, authenticated;
grant execute on function public.claim_operations_worker(uuid) to service_role;
