-- 운영 서버가 예약 변경·취소와 일정만 조회합니다. 공개 역할의 권한은 바꾸지 않습니다.
grant select on public.interview_applications, public.interview_slots to service_role;
