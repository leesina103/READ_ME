create or replace function public.admin_list_interview_applications()
returns table (
  id uuid,
  name text,
  phone text,
  status text,
  starts_at timestamptz,
  created_at timestamptz,
  cancelled_at timestamptz
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
    application.phone,
    application.status,
    slot.starts_at,
    application.created_at,
    application.cancelled_at
  from public.interview_applications as application
  join public.interview_slots as slot on slot.id = application.slot_id
  order by slot.starts_at, application.created_at;
end;
$$;

revoke all on function public.admin_list_interview_applications() from public, anon;
grant execute on function public.admin_list_interview_applications() to authenticated;
