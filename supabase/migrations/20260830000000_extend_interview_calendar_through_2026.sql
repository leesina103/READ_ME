-- 2026년 10월부터 12월까지 인터뷰 시간을 미리 생성합니다.
-- 일정은 달력에 표시하되 예약은 열지 않기 위해 is_open을 false로 저장합니다.

with remaining_days as (
  select day::date as interview_date
  from generate_series(
    date '2026-10-01',
    date '2026-12-31',
    interval '1 day'
  ) as day
),
remaining_slots as (
  select
    slot.available_time at time zone 'Asia/Seoul' as starts_at
  from remaining_days
  cross join lateral generate_series(
    interview_date
      + case
          when extract(isodow from interview_date) in (6, 7) then time '07:00'
          else time '18:00'
        end,
    interview_date + time '21:30',
    interval '30 minutes'
  ) as slot(available_time)
)
insert into public.interview_slots (starts_at, capacity, is_open)
select starts_at, 1, false
from remaining_slots
on conflict (starts_at) do nothing;

create or replace function public.list_interview_calendar_slots()
returns table (
  slot_id bigint,
  starts_at timestamptz,
  is_available boolean
)
language sql
stable
security definer set search_path = ''
as $$
  select
    slot.id,
    slot.starts_at,
    slot.starts_at > now()
      and slot.is_open
      and (
        select count(*)
        from public.interview_applications as application
        where application.slot_id = slot.id
          and application.status = 'booked'
      ) < slot.capacity as is_available
  from public.interview_slots as slot
  where slot.starts_at >= timestamptz '2026-09-01 00:00:00+09'
    and slot.starts_at < timestamptz '2027-01-01 00:00:00+09'
  order by slot.starts_at;
$$;

revoke all on function public.list_interview_calendar_slots() from public;
grant execute on function public.list_interview_calendar_slots() to anon, authenticated;
