// 공개 화면과 실제 Supabase 조회를 점검하고 개인정보 없이 결과를 보관합니다.
import nextEnv from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

nextEnv.loadEnvConfig(process.cwd());
if (existsSync('.env.monitor.local')) process.loadEnvFile('.env.monitor.local');
const { checkServiceHealth } = await import('../supabase/functions/operations-worker/health.mjs');
const report = await checkServiceHealth({ site: process.env.MONITOR_SITE_URL || 'https://read-me-two-black.vercel.app', api: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY });
const directory = resolve(process.env.MONITOR_OUTPUT_DIR || '.codex-tmp/service-monitor');
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'health-latest.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(resolve(directory, `health-${Date.now()}.json`), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'passed' ? 0 : 1;
