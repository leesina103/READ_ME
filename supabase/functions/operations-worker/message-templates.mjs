export const MESSAGE_DOCUMENT_ID = '1oYHtiYVAsJxnB-B_7hBwCpM4WRLPZDKSc5fERCsEGLY';
export const MESSAGE_DOCUMENT_URL = `https://docs.google.com/document/d/${MESSAGE_DOCUMENT_ID}/edit?tab=t.0`;
export const needsConfirmation = reason => `확인 필요: ${reason}`;

// 본문은 실행할 때마다 읽습니다. 실패 시 과거 초안이나 로컬 사본으로 대체하지 않습니다.
export async function loadMessageTemplates(env, fetcher = fetch) {
  try {
    const request = async (url, options = {}) => {
      const response = await fetcher(url, { ...options, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
    if (!env.OPS_GOOGLE_CLIENT_ID || !env.OPS_GOOGLE_CLIENT_SECRET || !env.OPS_GOOGLE_REFRESH_TOKEN) throw new Error('Google 연결 없음');
    const token = await request('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.OPS_GOOGLE_CLIENT_ID, client_secret: env.OPS_GOOGLE_CLIENT_SECRET, refresh_token: env.OPS_GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }).toString()
    });
    if (!token.access_token) throw new Error('Google 연결 실패');
    const doc = await request(`https://docs.googleapis.com/v1/documents/${MESSAGE_DOCUMENT_ID}?includeTabsContent=true&suggestionsViewMode=PREVIEW_WITHOUT_SUGGESTIONS`, { headers: { Authorization: `Bearer ${token.access_token}` } });
    return parseMessageTemplates(doc);
  } catch {
    return { templates: {}, error: '기준 문서의 최신 수동 문자 메시지를 읽지 못했습니다. Google 문서 연결·권한을 확인하세요.' };
  }
}

export function parseMessageTemplates(doc) {
  const tabs = [];
  const visit = list => { for (const tab of list || []) { tabs.push(tab); visit(tab.childTabs); } };
  visit(doc.tabs);
  const tab = tabs.find(t => t.tabProperties?.tabId === 't.0');
  const content = tab?.documentTab?.body?.content;
  if (!content) throw new Error('기준 탭 없음');
  const templates = {};
  let active = false, key, lines = [], operatorNote = false;
  const flush = () => {
    if (key) {
      if (Object.hasOwn(templates, key)) throw new Error('문자 단계 중복');
      templates[key] = lines.join('').replace(/^\n+|\n+$/g, '');
    }
    key = undefined; lines = []; operatorNote = false;
  };
  for (const element of content) {
    const p = element.paragraph;
    if (!p) { if (key && element.table) throw new Error('문자 본문 표 확인 필요'); continue; }
    const raw = (p.elements || []).map(e => e.textRun?.content || '').join('').replaceAll('\u000b', '\n');
    const label = raw.trim();
    const heading = p.paragraphStyle?.namedStyleType?.startsWith('HEADING_');
    if (label === '수동 문자 메시지' && heading) { active = true; continue; }
    if (!active) continue;
    if (label.includes('이전 설계 문구')) { flush(); break; }
    if (heading) {
      flush();
      const match = label.match(/^(\d+(?:-\d+)?)\.\s/);
      if (match) key = match[1];
      continue;
    }
    if (!key || /^발송\s*:/.test(label)) continue;
    // 운영자 참고는 빈 문단으로 구분된 설명·링크 묶음 전체를 제외합니다.
    if (/^운영자 참고(?:\s|[·:：]|$)/.test(label)) { operatorNote = true; continue; }
    if (operatorNote) {
      if (!label) operatorNote = false;
      continue;
    }
    lines.push(raw);
  }
  flush();
  if (!active || !templates['1'] || !templates['2'] || !templates['3']) throw new Error('기준 문서 구조 확인 필요');
  return { templates, revisionId: doc.revisionId, source: MESSAGE_DOCUMENT_URL };
}

export function renderMessage(source, key, values = {}) {
  if (source?.error) return needsConfirmation(source.error);
  const template = source?.templates?.[key];
  if (!template) return needsConfirmation('기준 문서에 해당 단계의 수동 문자 메시지가 없습니다.');
  return template.replace(/\[([^\]\n]+)\]/g, (_, variable) => {
    const value = values[variable];
    return value !== undefined && value !== null && String(value).trim() ? String(value) : `[확인 필요: ${variable}]`;
  });
}

export function bookingMessages(source, booking, site, now = Date.now()) {
  const start = Date.parse(booking.interview_slots.starts_at);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }).formatToParts(start);
  const read = type => Number(parts.find(p => p.type === type)?.value);
  const hour = read('hour'), year = read('year'), month = read('month'), day = read('day');
  const time = `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(read('minute')).padStart(2, '0')}`;
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const values = {
    '이름': booking.name,
    '날짜·요일·시간': `${year}년 ${month}월 ${day}일 (${weekday}) ${time}`,
    '시간': time,
    '홈페이지 주소': site.replace(/\/$/, ''),
    '예약자별 전용 링크': booking.management_token ? `${site}/interview/apply/manage/${booking.management_token}` : undefined,
    '인터뷰 참여 링크 - 구글 미트': booking.meetUrl || undefined
  };
  let reservation = renderMessage(source, '1', values);
  let reminder = renderMessage(source, '2', values);
  const soon = start > now && start - now < 1800000;
  if (soon && !source?.error) {
    // 30분 미만 예약의 병합은 문서의 발송 조건에 따른 최소 변경입니다.
    reminder = reminder.replace('30분 후 ', '오늘 ');
    const promise = '인터뷰는 구글 미트로 진행하며, 접속 링크는 인터뷰 시작 30분 전에 문자로 보내드릴게요.';
    reservation = reservation.includes(promise)
      ? reservation.replace(promise, reminder)
      : needsConfirmation('30분 미만 예약입니다. 문서의 1번과 2번을 합쳐 접속 링크를 즉시 안내하세요.');
  }
  return { reservation, reminder, thanks: renderMessage(source, '3', values), values };
}

const stages = {
  '예약 안내': ['1', '2'], '인터뷰 예약 확정': ['1', '2'], '전날 확인': [null, '2'],
  '30분 전 안내': ['2', '3'], '인터뷰 30분 전': ['2', '3'], '인터뷰 기록': ['3', null], '인터뷰 직후': ['3', null],
  '인터뷰 통과·초대장 전달 + 입금 안내': ['4', '4-2'], '입금 마감 24시간 전 알림': ['4-1', '4-2'],
  '입금 확인·가입 신청서 안내': ['4-2', null], '이번 기수에 함께하지 못하는 경우': ['5', null],
  '신청서 승인·회원가입 안내': ['6', '7'], '재참여 승인·로그인 안내': ['6-1', '7'], '첫 만남 준비 안내': ['7', '8'],
  '오프라인 토의 전·사전 질문 안내 (D-2까지 완료)': ['8', '8-1'], '사전 질문 마감 당일 알림': ['8-1', '8-2'],
  '모임 전날 안내': ['8-2', '9'], '실천과 기록 안내': ['9', '9-1'], '실천·기록 마감 당일 알림': ['9-1', '10'],
  '토의 후·후기 요청': ['10', null], '파티 초대장 전달': ['11', null], '기수 마무리·전체 후기': ['12', null], '파티 후·후기 요청': ['13', null]
};
export function stageMessages(source, stage, values) {
  const keys = stages[stage] || [];
  return { draft: renderMessage(source, keys[0], values), nextDraft: keys[1] ? renderMessage(source, keys[1], values) : needsConfirmation('실제 진행 여부·결과와 다음 단계를 확인한 뒤 기준 문서에서 해당 문구를 선택하세요.') };
}
