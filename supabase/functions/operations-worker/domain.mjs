import { bookingMessages, needsConfirmation } from './message-templates.mjs';

export const TASKS = '09d2add2-4718-4b06-9c8e-29a3f0a85b7a';
export const LEDGER = '401a0af7-5fb6-4731-8df8-be933ef50ff2';
export const MEMBERS = '1c730ca8-2d4a-45ff-bc4e-5f332bd86ff7';
export const SITE = 'https://read-me-two-black.vercel.app';
export const koreanDay = value => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(value));
export const when = value => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export const text = value => ({ rich_text: [{ text: { content: String(value).slice(0, 1900) } }] });
export const title = value => ({ title: [{ text: { content: String(value).slice(0, 1900) } }] });
export const readText = prop => (prop?.rich_text || prop?.title || []).map(x => x.plain_text ?? x.text?.content ?? '').join('');
export const done = page => page.in_trash || page.archived || ['완료', '취소'].includes(page.properties?.['상태']?.status?.name);
export const stepDone = (page, stage) => done(page) || page.properties?.[stage === '인터뷰 기록' ? '인터뷰 기록 완료' : stage]?.checkbox === true;

export function plan(booking, now, meet = '', templates) {
  const start = Date.parse(booking.interview_slots.starts_at);
  const created = Date.parse(booking.updated_at);
  const dayBefore = Date.parse(`${koreanDay(start - 86400000)}T09:00:00+09:00`);
  const { reservation, reminder, thanks } = bookingMessages(templates, { ...booking, meetUrl: meet }, SITE, now);
  const dayBeforeDraft = needsConfirmation('기준 문서에 인터뷰 전날 문자 본문이 없습니다.');
  const nextIsDayBefore = created <= dayBefore && now < start - 3600000;
  const entries = [
    ['예약 안내', created, start, reservation, nextIsDayBefore ? '전날 안내 발송 여부 확인' : '시작 30분 전 Meet 안내 발송', nextIsDayBefore ? dayBeforeDraft : reminder],
    ['전날 확인', dayBefore, start - 3600000, dayBeforeDraft, '시작 30분 전 Meet 안내 발송', reminder],
    ['30분 전 안내', start - 3600000, start, reminder, '인터뷰 진행 여부 확인 후 기록 작성', thanks],
    ['인터뷰 기록', start + 1800000, start + 86400000, thanks, '실제 진행 여부와 운영진 논의 결과 확인 후 1~2일 내 안내', needsConfirmation('운영진 논의 결과에 따라 문서 4번(초대) 또는 5번(함께하지 못하는 경우)을 선택하세요.')]
  ];
  return entries.filter(([stage, due, end]) => (stage !== '전날 확인' || created <= due) && end > created).map(([stage, due, end, draft, next, nextDraft]) => ({
    key: `booking:${booking.id}:${booking.updated_at}:${stage}`, stage, due, end, draft, next, nextDraft,
    actionable: booking.status === 'booked' && now >= due && now < end,
    action: stage === '30분 전 안내' ? `${when(start - 1800000)}에 안내 문자를 보내세요.` : stage === '인터뷰 기록' ? '종료 예정 시각입니다. 실제 진행 여부를 확인하고 기록을 작성하세요. 30분 소요를 기준으로 계산했습니다.' : `${stage} 메시지 발송 여부를 확인하세요.`
  }));
}

export function payment(member) {
  const p = member.properties;
  if (p['회비 납부']?.select?.name !== '납부') return null;
  const payer = readText(p['입금자명']).trim();
  const amount = p['실제 입금액']?.number;
  const date = p['입금일']?.date?.start;
  if (!payer || !Number.isSafeInteger(amount) || amount <= 0 || !date) return { missing: true };
  return { key: `member:${member.id}:cohort:1:payment`, payer, amount, date, name: readText(p['이름']), memberId: member.id };
}

export const statusLabel = value => ({ passed: '정상', failed: '실패', waiting: '확인 대기', skipped_recent_success: '최근 성공으로 생략' }[value] || value);

export function emailBody(action, draft, next, nextDraft, url, automated = '아래 업무의 확인 결과를 정리했습니다.') {
  return [
    `① 자동 처리 결과\n${automated}`,
    `② 직접 할 일\n${action}`,
    `③ 보낼 메시지 초안\n${draft}`,
    `④ 다음 행동\n${next}`,
    `⑤ 다음 메시지 초안\n${nextDraft}`,
    `확인 링크\n${url}`
  ].join('\n\n');
}
