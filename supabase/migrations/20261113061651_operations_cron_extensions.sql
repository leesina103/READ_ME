-- 예약 확인을 PC와 무관하게 실행합니다. 실제 작업 등록은 검증 후 별도로 수행합니다.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
