import { createWorker } from './worker.mjs';
import { monitor } from './monitor.mjs';

// 인증 없는 요청과 설정 전 실행은 데이터를 읽거나 변경하지 않습니다.
const runtime = globalThis.Deno;
runtime.serve(async request => {
  const env = runtime.env.toObject();
  const key = request.headers.get('x-readme-token');
  const isWorker = env.OPS_CRON_SECRET && key === env.OPS_CRON_SECRET;
  const isMonitor = env.OPS_MONITOR_SECRET && key === env.OPS_MONITOR_SECRET;
  if (!isWorker && !isMonitor) return new Response('Unauthorized', { status: 401 });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const input = await request.json();
    if (isMonitor) return Response.json(await monitor(env, input));
    const dryRun = input.dryRun !== false || env.OPS_ENABLED !== 'true';
    const result = await createWorker(env)({ dryRun });
    return Response.json(result);
  } catch (error) {
    // 개인정보와 인증값이 포함될 수 있는 원본 예외는 출력하지 않습니다.
    const reason = /^[a-z0-9.-]+ HTTP [0-9]{3}$/.test(error.message) ? error.message : '운영 자동화 실행 확인 필요';
    return Response.json({ status: 'failed', reason }, { status: 500 });
  }
});
