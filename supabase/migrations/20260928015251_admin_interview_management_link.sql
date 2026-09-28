-- 전용 링크는 예약 목록 전체에 노출하지 않고 운영자가 요청한 예약 한 건만 반환합니다.
create function public.admin_interview_management_token(p_application_id uuid)
returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare result uuid;
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;
  select a.management_token into result from public.interview_applications a where a.id = p_application_id;
  if not found then raise exception 'booking_not_found'; end if;
  return result;
end;
$$;
revoke all on function public.admin_interview_management_token(uuid) from public, anon;
grant execute on function public.admin_interview_management_token(uuid) to authenticated;
