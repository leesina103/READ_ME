create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  bio text not null default '' check (char_length(bio) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;

drop policy if exists "회원은 자신의 프로필을 조회할 수 있음" on public.profiles;
create policy "회원은 자신의 프로필을 조회할 수 있음"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "회원은 자신의 프로필을 수정할 수 있음" on public.profiles;
create policy "회원은 자신의 프로필을 수정할 수 있음"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'READ ME 회원')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, display_name)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data ->> 'display_name'), ''), 'READ ME 회원')
from auth.users
on conflict (id) do nothing;
