import { MEMBERS, SITE, emailBody, koreanDay, readText, text, title, when } from './domain.mjs';
import { MESSAGE_DOCUMENT_URL, MIDPOINT_REVIEW_PATH, renderMessage } from './message-templates.mjs';

export const COHORT_TASKS = '41caf476-cad5-819f-8cc7-000b2e2a4583';
const SCHEDULE = 'f0ecf5eb-e1d2-4ee3-9307-cf054eb988b6';
const COHORT = '1기';
const PREFIX = 'cohort:1:';
const DAY = 86400000;
// 1기 초대장에 안내한 회차 순서입니다.
const BOOKS = ['관계의 언어', '미움받을 용기', '말센스', '사랑의 기술'];
const KEY = '중복 방지 키';
const PARTY_KEY = PREFIX + 'party';
const DUE = ['사전 질문 안내', '사전 질문 마감 알림', '모임 전날 안내', '회차 후기 요청', '실천과 기록 안내', '실천·기록 마감 알림', '파티 초대', '전체 후기 요청', '파티 후기 요청'];
const MIDPOINT_REVIEW = 3;
const SELECT = value => ({ select: { name: value } });
const DATE = value => ({ date: Number.isFinite(value) ? { start: new Date(value).toISOString() } : null });
const select = (p, key) => p[key]?.select?.name;
const written = (p, key) => ({ 작성: true, 미작성: false })[select(p, key)];
const dayAt = (day, time) => Date.parse(`${day}T${time}:00+09:00`);
const addDays = (day, days) => koreanDay(dayAt(day, '12:00') + days * DAY);
const at = (timestamp, days, time = '19:00') => dayAt(addDays(koreanDay(timestamp), days), time);
const dateLabel = value => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short' }).format(value);
const timeLabel = value => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', timeStyle: 'short' }).format(value);
const meetingLabel = value => `${dateLabel(value)} ${timeLabel(value)}`;
const team = label => (label || '').match(/(금요일|토요일)/)?.[1];

export function sessionSchedule(page, round) {
  const p = page.properties;
  const day = p[`${round}회차`]?.date?.start?.slice(0, 10);
  const time = readText(p['시간']).match(/(\d{1,2}:\d{2})\s*[–~—-]\s*(\d{1,2}:\d{2})/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || !time) return null;
  const [start, end] = time.slice(1).map(t => dayAt(day, t.padStart(5, '0')));
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return null;
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const recordDue = at(start, 7 + (7 - weekday) % 7, '23:59');
  const midpointDue = round === 2 ? at(recordDue, 1) : NaN;
  const monday = (8 - weekday) % 7 || 7;
  return { start, end, recordDue, place: readText(p['장소']).trim(), supplies: readText(p['준비물']).trim(), stages: [
    [0, round === 1 ? NaN : at(start, -7), at(start, -2)],
    [1, at(start, -2), at(start, -2, '23:59') + 60000],
    [2, at(start, -1), start],
    [MIDPOINT_REVIEW, midpointDue, midpointDue + 7 * DAY],
    [4, at(start, monday), at(recordDue, 0)],
    [5, at(recordDue, 0), recordDue + 60000]
  ] };
}

function trackedProperties(member, round, schedule, note) {
  const p = member.properties;
  const name = readText(p['이름']);
  const group = select(p, '모임') || '미정';
  const properties = {
    '멤버·회차': title(`${name} · ${round ? `${round}회차` : '마무리'}`),
    '회원': { relation: [{ id: member.id }] },
    '구분': SELECT(round ? '회차' : '마무리'),
    '모임': text(group),
    '운영 메모': text(note || '')
  };
  if (round) properties['회차'] = { number: round };
  if (round) properties['모임 날짜'] = DATE(schedule?.start);
  const stages = schedule?.stages || (round ? DUE.slice(0, 6).map((_, i) => [i, NaN]) : []);
  for (const [index, due] of stages) properties[DUE[index] + ' 예정'] = DATE(due);
  return properties;
}

function different(page, properties) {
  return Object.fromEntries(Object.entries(properties).filter(([key, expected]) => {
    const current = page.properties[key];
    if ('rich_text' in expected || 'title' in expected) return readText(current) !== readText(expected);
    if ('date' in expected) return (Date.parse(current?.date?.start) || null) !== (Date.parse(expected.date?.start) || null);
    if ('relation' in expected) return current?.relation?.length !== 1 || current.relation[0].id !== expected.relation[0].id;
    if ('select' in expected) return current?.select?.name !== expected.select.name;
    return current?.number !== expected.number;
  }));
}

async function readWebsite(db, members, cases) {
  const cohort = encodeURIComponent(COHORT);
  const [cohorts, groups, memberships, profiles, answers] = await Promise.all([
    db(`cohorts?select=starts_at&name=eq.${cohort}`),
    db(`talk_groups?select=id,name,talk_meetings(week_number,starts_at)&cohort=eq.${cohort}`),
    db(`talk_group_members?select=user_id,group_id&cohort=eq.${cohort}`),
    db(`profiles?select=id,full_name,introduction_word,bio&cohort=eq.${cohort}&onboarding_completed_at=not.is.null`),
    db(`completed_talk_weeks?select=user_id,week_number&cohort=eq.${cohort}`)
  ]);
  const active = new Set(memberships.map(m => m.user_id));
  const matches = new Map();
  const normalized = value => value?.normalize('NFC').replace(/\s+/g, '');
  for (const { member, schedule, round, group } of cases) {
    if (!schedule || matches.has(`${member.id}:${round}`)) continue;
    const week = 2 * round - 1;
    const matchingGroups = groups.filter(g => team(g.name) === group && g.talk_meetings.some(m => m.week_number === week && Date.parse(m.starts_at) === schedule.start));
    const name = normalized(readText(member.properties['이름']));
    const profilesWithName = profiles.filter(p => normalized(p.full_name) === name && active.has(p.id));
    const uniqueMember = members.filter(m => normalized(readText(m.properties['이름'])) === name).length === 1;
    const candidate = name && uniqueMember && profilesWithName.length === 1 ? profilesWithName[0] : null;
    const profile = matchingGroups.length === 1 && memberships.some(m => m.user_id === candidate?.id && m.group_id === matchingGroups[0].id) ? candidate : null;
    matches.set(`${member.id}:${round}`, {
      questionOpens: matchingGroups.length === 1 ? (round === 1 ? Date.parse(cohorts[0]?.starts_at) : schedule.start - 7 * DAY) : NaN,
      recordOpens: matchingGroups.length === 1 ? at(schedule.start, 1, '00:00') : NaN,
      question: profile ? answers.some(a => a.user_id === profile.id && a.week_number === week) : undefined,
      record: profile ? answers.some(a => a.user_id === profile.id && a.week_number === week + 1) : undefined,
      introduction: profile ? Boolean(profile.introduction_word?.trim() && profile.bio?.trim()) : undefined
    });
  }
  return matches;
}

function draftFor(entry, templates, now, website, party) {
  const { index, member, round, schedule, page } = entry;
  const p = page.properties;
  const name = readText(member.properties['이름']);
  const web = website.get(`${member.id}:${round}`) || {};
  const week = 2 * round - 1;
  const talk = w => `${SITE}/membership/talk/1/${w}`;
  const midpointLink = SITE + MIDPOINT_REVIEW_PATH;
  const values = { '이름': name, '기수': COHORT, '책 제목': BOOKS[round - 1], '중간 후기 링크': midpointLink, '회차 후기 링크': midpointLink,
    '전체 기수 후기 링크': `${SITE}/membership/review?event=cohort`, '파티 후기 링크': `${SITE}/membership/review?event=party` };
  let reason;
  let followUp;
  if (schedule) Object.assign(values, {
    '날짜·요일·시간': meetingLabel(schedule.start), '장소': schedule.place, '장소·주소': schedule.place,
    '책 제목·준비물': `${BOOKS[round - 1]}${schedule.supplies === '없음' ? '' : ` · ${schedule.supplies || '[확인 필요: 준비물]'}`}`,
    '날짜': dateLabel(at(schedule.start, -2)), '날짜·일요일': dateLabel(schedule.recordDue),
    '이번 회차 사전 질문 링크': talk(week), '해당 주차 링크': talk(week + 1)
  });
  if (index === 0 || index === 1 || index === 4 || index === 5) {
    const opens = index < 2 ? web.questionOpens : web.recordOpens;
    if (!Number.isFinite(opens) || opens > now) reason = '웹 모임 날짜와 대화방 공개 상태를 확인하세요.';
  }
  if (index === 1 || index === 5) {
    const checked = written(p, index === 1 ? '사전 질문 작성 확인' : '실천·기록 작성 확인');
    const observed = index === 1 ? web.question : web.record;
    const complete = observed === true || checked === true ? true : (observed ?? checked);
    const introDone = member.properties['멤버 소개 작성 완료']?.checkbox === true || web.introduction === true;
    const needsIntro = round === 1 && index === 1 && web.introduction === false && !introDone;
    if (complete === true && !needsIntro) return null;
    if (complete === true && needsIntro) return { draft: `${name}님, 첫 만남 전에 동료들에게 보여줄 자기소개를 오늘 밤 11시 59분까지 남겨 주세요. 자기소개는 현재 기수 동료들에게만 보여요.\n${talk(0)}`, reason };
    if (complete === undefined) reason = '작성 여부를 확인한 뒤 미작성인 경우에만 보내세요.';
    if (round === 1 && index === 1 && !introDone && web.introduction === undefined) followUp = '자기소개도 미작성인지 확인하세요.';
    const intro = templates.templates?.['8-1']?.match(/\[(첫 모임이며[^\]]+)\]/)?.[1];
    if (intro) values[intro] = needsIntro ? `자기소개도 함께 부탁드려요. 자기소개는 현재 기수 동료들에게만 보여요.\n${talk(0)}` : '\u200B';
  }
  if (index === 6) {
    if (select(p, '파티 초대 대상') === '제외') return null;
    if (!party.ready || !Number.isFinite(party.deadline) || party.deadline <= now) reason = '파티 일정·장소·신청 기한을 확정하세요. 미확정이면 참석 의향을 먼저 확인하세요.';
    else if (select(p, '파티 초대 대상') !== '대상') reason = '파티 초대 대상 여부를 확인하세요.';
    Object.assign(values, { '일시': party.ready ? meetingLabel(party.start) : undefined, '날짜·요일·시간': party.ready ? meetingLabel(party.start) : undefined,
      '장소': party.place, '파티 초대장 링크': party.ready ? `${SITE}/membership/party/1` : undefined,
      '신청 기한': Number.isFinite(party.deadline) ? when(party.deadline) : undefined });
  }
  if (index === 8) {
    const attendance = select(p, '파티 출석');
    if (attendance === '결석' || (attendance !== '참석' && select(p, '파티 초대 대상') === '제외')) return null;
    if (attendance !== '참석') reason = '파티 출석을 기록하고 실제 참석자에게만 보내세요.';
  }
  const draft = renderMessage(templates, ['8', '8-1', '8-2', '10', '9', '9-1', '11', '12', '13'][index], values).replaceAll('\u200B', '').trim();
  if (index === 6 && reason) return { reason, draft: '파티 정보와 대상이 확인되면 초대 문자 초안을 보내드립니다.' };
  if (!reason && /확인 필요:/.test(draft)) reason = '문자 초안에 표시된 빈 정보와 기준 문서를 확인하세요.';
  return { draft, reason, followUp };
}

export async function runCohortOperations({ now, dryRun, query, db, ensurePage, notion, state, save, send, templates, checkTime }) {
  const [members, schedules, rows] = await Promise.all([
    query(MEMBERS, { property: '참여 상태', select: { equals: '확정' } }), query(SCHEDULE), query(COHORT_TASKS)
  ]);
  const byKey = new Map();
  for (const row of rows) {
    const key = readText(row.properties[KEY]);
    if (!key.startsWith(PREFIX)) continue;
    if (byKey.has(key)) throw new Error('기수 운영 체크표 중복 행 확인 필요');
    byKey.set(key, row);
  }
  let partyPage = byKey.get(PARTY_KEY);
  if (!partyPage && !dryRun && members.length) partyPage = await ensurePage(COHORT_TASKS, KEY, PARTY_KEY, { '멤버·회차': title('파티 일정 입력'), '구분': SELECT('파티 일정'), '운영 메모': text('파티 날짜·시각, 장소와 신청 기한을 입력하고 실제 초대장과 일치하면 일정 확정을 체크하세요.') });
  const partyProps = partyPage?.properties || {};
  const partyStart = Date.parse(partyProps['모임 날짜']?.date?.start);
  const partyPlace = readText(partyProps['파티 장소']).trim();
  const partyDeadline = Date.parse(partyProps['파티 신청 기한']?.date?.start);
  const party = { start: partyStart, place: partyPlace, deadline: partyDeadline, ready: partyProps['파티 일정 확정']?.checkbox === true && Number.isFinite(partyStart) && partyProps['모임 날짜'].date.start.includes('T') && Boolean(partyPlace) };
  const teams = new Map(['금요일', '토요일'].map(group => {
    const matching = schedules.filter(s => team(readText(s.properties['날짜'])) === group);
    return [group, matching.length === 1 ? [1, 2, 3, 4].map(round => sessionSchedule(matching[0], round)) : []];
  }));
  const sessionSets = [...teams.values()];
  const firstFifthWeek = Math.min(...sessionSets.map(s => s[2] ? at(s[2].start, -7) : Infinity));
  const lastRecordDue = Math.max(...sessionSets.map(s => s[3]?.recordDue ?? NaN));
  const expected = new Set([PARTY_KEY]);
  const cases = [];
  const dueEntries = [];
  let changes = 0;
  let missing = 0;
  let waiting = 0;
  for (const member of members) {
    const group = team(select(member.properties, '모임'));
    const sessions = teams.get(group) || [];
    if (!sessions.length || sessions.some(s => !s)) waiting++;
    for (const round of [1, 2, 3, 4, 0]) {
      const key = PREFIX + member.id + ':' + round;
      expected.add(key);
      const schedule = sessions[round - 1];
      const note = !group ? '1기 회원 표의 모임 확정 및 일정 연결 확인 필요' : (round && !schedule ? '1기 모임 구성의 회차 날짜와 시간 확인 필요' : '');
      const properties = trackedProperties(member, round, schedule, note || (round === 1 ? '첫 회 사전 질문 안내는 첫 만남 안내로 진행' : ''));
      let stages = schedule?.stages || [];
      if (!round) {
        const invite = Number.isFinite(firstFifthWeek) ? firstFifthWeek : NaN;
        const close = Number.isFinite(lastRecordDue) ? at(lastRecordDue, 1) : NaN;
        const followUp = party.ready ? at(party.start, 1) : NaN;
        stages = [[6, invite, party.ready && party.start > invite ? party.start : invite + 56 * DAY], [7, close, close + 7 * DAY], [8, followUp, followUp + 7 * DAY]];
        for (const [index, due] of stages) properties[DUE[index] + ' 예정'] = DATE(due);
      }
      let page = byKey.get(key);
      if (!page) {
        missing++;
        if (!dryRun && changes < 6) {
          page = await ensurePage(COHORT_TASKS, KEY, key, properties);
          changes++;
        }
      } else {
        const patch = different(page, properties);
        if (!dryRun && changes < 6 && Object.keys(patch).length) {
          page = await notion('pages/' + page.id, 'PATCH', { properties: patch });
          changes++;
        }
      }
      if (!page) continue;
      const entry = { member, round, schedule, page, group: round ? group : '' };
      cases.push(entry);
      for (const [index, due, end] of stages) {
        if (now >= due && now < end && page.properties[DUE[index]]?.checkbox !== true) dueEntries.push({ ...entry, index, due });
      }
      checkTime();
    }
  }
  for (const [key, page] of byKey) {
    if (expected.has(key) || readText(page.properties['운영 메모']) === '확정 명단에서 제외됨') continue;
    if (!dryRun && changes < 6) {
      await notion('pages/' + page.id, 'PATCH', { properties: { '운영 메모': text('확정 명단에서 제외됨') } });
      changes++;
    }
  }
  const result = { confirmed: members.length, waiting, rows: byKey.size, missing, changes, due: dueEntries.length, mails: 0 };
  if (dryRun || !dueEntries.length) return result;
  let website = new Map();
  if (dueEntries.some(e => [0, 1, 4, 5].includes(e.index))) {
    try { website = await readWebsite(db, members, cases); } catch { result.website = '확인 필요'; }
  }
  const batches = new Map();
  for (const entry of dueEntries) {
    const output = draftFor(entry, templates, now, website, party);
    if (!output) continue;
    const key = `${PREFIX}${entry.group}:${entry.round}:${entry.index}:${entry.due}:${entry.schedule?.start ?? ''}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push({ ...entry, ...output });
  }
  for (const [key, batch] of batches) {
    const marker = 'cohort-alert:' + key;
    const current = await state(marker) || { sent: {}, sequence: 0 };
    const entries = batch.filter(e => current.sent[e.member.id] !== 'ready' && (!e.reason || !current.sent[e.member.id]));
    const pending = current.pending;
    if (pending) {
      await send(pending.key, pending.subject, pending.body);
      await save(marker, { sequence: current.sequence, sent: { ...current.sent, ...pending.targets } });
      result.mails++;
      continue;
    }
    if (!entries.length) continue;
    const [{ index, due, round, group }] = entries;
    const stageLabel = index === MIDPOINT_REVIEW ? '중간 후기 요청' : DUE[index];
    const timingLabel = index === MIDPOINT_REVIEW ? '4주차' : round ? `${round}회차` : '';
    const subject = ['[READ ME] 1기', group, timingLabel, stageLabel].filter(Boolean).join(' ');
    const body = entries.map(e => emailBody(
      e.reason ? `확인 필요 · ${e.reason}${e.followUp ? ` ${e.followUp}` : ''}` : `아래 문자를 직접 보내고 노션의 ‘${DUE[index]}’에 체크하세요.${e.followUp ? ` ${e.followUp}` : ''}`,
      e.draft, `보낸 뒤 ‘${DUE[index]}’에 체크하세요.`, `문자 원문\n${MESSAGE_DOCUMENT_URL}`, e.page.url,
      `${readText(e.member.properties['이름'])} · ${stageLabel}\n발송 예정 ${when(due)}${e.schedule ? `\n모임 ${when(e.schedule.start)}` : ''}`
    )).join('\n\n────────\n\n');
    const targets = Object.fromEntries(entries.map(e => [e.member.id, e.reason ? 'review' : 'ready']));
    const sequence = current.sequence + 1;
    const mailKey = key + ':' + sequence;
    await save(marker, { ...current, sequence, pending: { key: mailKey, subject, body, targets } });
    await send(mailKey, subject, body);
    await save(marker, { sequence, sent: { ...current.sent, ...targets } });
    result.mails++;
    checkTime();
  }
  return result;
}
