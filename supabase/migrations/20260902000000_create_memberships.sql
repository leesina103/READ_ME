create table if not exists public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'expired')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

alter table public.memberships enable row level security;
revoke all on table public.memberships from anon, authenticated;
grant select on table public.memberships to authenticated;

drop policy if exists "회원은 자신의 멤버십을 조회할 수 있음" on public.memberships;
create policy "회원은 자신의 멤버십을 조회할 수 있음"
on public.memberships for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.memberships (user_id, status, started_at)
select profile.id, 'active', profile.onboarding_completed_at
from public.profiles as profile
where profile.cohort is not null
  and profile.onboarding_completed_at is not null
on conflict (user_id) do nothing;

create or replace function public.sync_membership_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.cohort is not null and new.onboarding_completed_at is not null then
    insert into public.memberships (user_id, status, started_at, ended_at, updated_at)
    values (new.id, 'active', new.onboarding_completed_at, null, now())
    on conflict (user_id) do update set
      status = 'active',
      ended_at = null,
      updated_at = now();
  end if;

  return new;
end;
$$;

revoke all on function public.sync_membership_from_profile() from public, anon, authenticated;

drop trigger if exists sync_profile_membership on public.profiles;
create trigger sync_profile_membership
  after insert or update of cohort, onboarding_completed_at on public.profiles
  for each row execute procedure public.sync_membership_from_profile();

create or replace function public.has_active_membership()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.memberships as membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (membership.ended_at is null or membership.ended_at > now())
  );
$$;

revoke all on function public.has_active_membership() from public, anon;
grant execute on function public.has_active_membership() to authenticated;
