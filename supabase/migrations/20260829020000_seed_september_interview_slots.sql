-- 2026년 9월 인터뷰 예약 시간
-- 평일: 18:00부터 21:30까지, 30분 간격
-- 주말: 07:00부터 21:30까지, 30분 간격
-- 모든 시간은 한국 표준시(Asia/Seoul)를 기준으로 저장합니다.

with september_days as (
  select day::date as interview_date
  from generate_series(
    date '2026-09-01',
    date '2026-09-30',
    interval '1 day'
  ) as day
),
september_slots as (
  select
    slot.available_time at time zone 'Asia/Seoul' as starts_at
  from september_days
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
select starts_at, 1, true
from september_slots
on conflict (starts_at) do nothing;
