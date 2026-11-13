-- 먼저 함수의 인증·시험 실행을 검증한 뒤 SQL Editor에서 실행합니다.
-- Vault에 readme_operations_url, readme_operations_token을 먼저 저장합니다.
-- URL: https://whkaobzprcyfyvnkkqgr.supabase.co/functions/v1/operations-worker
-- 토큰: Edge Function의 OPS_CRON_SECRET과 동일한 값. 저장소에 쓰지 않습니다.
-- readme_operations_jwt: 이 프로젝트의 유효한 서버 호출용 JWT. 기본 JWT 검증을 유지합니다.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists(select 1 from vault.decrypted_secrets where name='readme_operations_url')
     or not exists(select 1 from vault.decrypted_secrets where name='readme_operations_token')
     or not exists(select 1 from vault.decrypted_secrets where name='readme_operations_jwt') then
    raise exception '운영 자동화 Vault 설정이 필요합니다';
  end if;
  if exists(select 1 from cron.job where jobname='readme-operations-minute') then
    raise exception '기존 예약 작업을 확인하세요. 중복 생성하지 않습니다';
  end if;
end $$;

select cron.schedule('readme-operations-minute', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='readme_operations_url'),
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name='readme_operations_jwt'),
      'x-readme-token', (select decrypted_secret from vault.decrypted_secrets where name='readme_operations_token')),
    body := '{"dryRun":false}'::jsonb,
    timeout_milliseconds := 110000
  );
$job$);
-- 매분 확인하므로 정시 알림은 약 1분의 지연과 외부 서비스 처리 시간이 생길 수 있습니다.
