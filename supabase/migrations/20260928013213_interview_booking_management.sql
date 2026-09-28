-- 회원가입 전 예약자는 추측하기 어려운 전용 링크로 본인 예약만 관리합니다.
-- 기존 테이블의 비공개 권한은 유지하며 이름·전화번호로 예약을 조회하지 않습니다.
alter table public.interview_applications
  add column management_token uuid not null default gen_random_uuid();
create unique index interview_applications_management_token_key
  on public.interview_applications(management_token);

create function public.book_interview_with_management(p_slot_id bigint, p_name text, p_phone text)
returns table(application_id uuid, starts_at timestamptz, management_token uuid)
language plpgsql security definer set search_path = '' as $$
declare booked record;
begin
  select * into booked from public.submit_interview_application(p_slot_id, p_name, p_phone);
  return query select a.id, booked.starts_at, a.management_token
    from public.interview_applications a where a.id = booked.application_id;
end;
$$;

create function public.get_interview_booking(p_token uuid)
returns table(name text, starts_at timestamptz, status text, can_manage boolean)
language sql stable security definer set search_path = '' as $$
  select a.name, s.starts_at, a.status, a.status = 'booked' and s.starts_at > now()
  from public.interview_applications a join public.interview_slots s on s.id = a.slot_id
  where a.management_token = p_token;
$$;

create function public.manage_interview_booking(p_token uuid, p_action text, p_slot_id bigint default null)
returns table(application_id uuid, name text, phone text, starts_at timestamptz, status text, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  booking public.interview_applications%rowtype;
  target public.interview_slots%rowtype;
  original_time timestamptz;
begin
  if p_action is null or p_action not in ('reschedule', 'cancel') then
    raise exception 'invalid_booking_action';
  end if;
  select a.* into booking from public.interview_applications a
    where a.management_token = p_token for update;
  if not found then raise exception 'booking_not_found'; end if;
  if booking.status <> 'booked' then raise exception 'booking_cancelled'; end if;

  -- 서로 다른 예약도 같은 순서로 시간을 잠가 교착 상태를 피합니다.
  perform s.id from public.interview_slots s
    where s.id = booking.slot_id or (p_action = 'reschedule' and s.id = p_slot_id)
    order by s.id for update;
  select s.starts_at into original_time from public.interview_slots s where s.id = booking.slot_id;
  if original_time <= clock_timestamp() then raise exception 'booking_started'; end if;

  if p_action = 'cancel' then
    update public.interview_applications a set status = 'cancelled', cancelled_at = clock_timestamp(), updated_at = clock_timestamp()
      where a.id = booking.id;
  else
    select s.* into target from public.interview_slots s where s.id = p_slot_id;
    if not found or not target.is_open or target.starts_at <= clock_timestamp() then
      raise exception 'slot_unavailable';
    end if;
    if target.id = booking.slot_id then raise exception 'same_slot'; end if;
    if (select count(*) from public.interview_applications a where a.slot_id = target.id and a.status = 'booked') >= target.capacity then
      raise exception 'slot_unavailable';
    end if;
    -- 새 시간을 확보한 뒤 같은 트랜잭션에서 옮기므로 실패하면 기존 예약이 유지됩니다.
    update public.interview_applications a set slot_id = target.id, updated_at = clock_timestamp()
      where a.id = booking.id;
  end if;
  return query select a.id, a.name, a.phone, s.starts_at, a.status, a.updated_at
    from public.interview_applications a join public.interview_slots s on s.id = a.slot_id where a.id = booking.id;
end;
$$;

revoke all on function public.book_interview_with_management(bigint,text,text) from public;
revoke all on function public.get_interview_booking(uuid) from public;
revoke all on function public.manage_interview_booking(uuid,text,bigint) from public;
grant execute on function public.book_interview_with_management(bigint,text,text) to anon, authenticated;
grant execute on function public.get_interview_booking(uuid) to anon, authenticated;
grant execute on function public.manage_interview_booking(uuid,text,bigint) to anon, authenticated;
