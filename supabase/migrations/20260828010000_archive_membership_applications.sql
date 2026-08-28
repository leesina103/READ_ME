alter table public.membership_applications
  add column if not exists archived_at timestamptz;

create index if not exists membership_applications_active_idx
  on public.membership_applications (status, created_at desc)
  where archived_at is null;

create or replace function public.admin_list_membership_applications()
returns table (
  id bigint,
  name text,
  email text,
  cohort text,
  message text,
  status text,
  admin_note text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  return query
  select
    application.id,
    application.name,
    application.email,
    application.cohort,
    application.message,
    application.status,
    application.admin_note,
    application.created_at,
    application.reviewed_at
  from public.membership_applications as application
  where application.archived_at is null
  order by
    case application.status when 'pending' then 0 when 'approved' then 1 else 2 end,
    application.created_at desc;
end;
$$;

revoke all on function public.admin_list_membership_applications() from public, anon;
grant execute on function public.admin_list_membership_applications() to authenticated;

create or replace function public.archive_membership_application(
  p_application_id bigint
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  application public.membership_applications%rowtype;
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  select candidate.*
  into application
  from public.membership_applications as candidate
  where candidate.id = p_application_id
  for update;

  if not found then
    raise exception 'application_not_found';
  end if;

  if application.status = 'pending' then
    raise exception 'application_not_reviewed';
  end if;

  if application.archived_at is not null then
    return;
  end if;

  update public.membership_applications
  set archived_at = now(),
      updated_at = now()
  where id = application.id;
end;
$$;

revoke all on function public.archive_membership_application(bigint) from public, anon;
grant execute on function public.archive_membership_application(bigint) to authenticated;
