export type CalendarRow = { slot_id: number | string; starts_at: string; is_available?: boolean };

// 서버의 시간대와 무관하게 한국 시간 오늘 0시부터 달력에 표시합니다.
export function interviewCalendarStart(now = new Date()) {
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);
  return `${date}T00:00:00+09:00`;
}

export async function readInterviewCalendar(
  fetchPage: (start: string, offset: number, size: number) => Promise<{ data: CalendarRow[] | null; error: unknown }>,
  now = new Date()
) {
  const start = interviewCalendarStart(now);
  const rows: CalendarRow[] = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const result = await fetchPage(start, offset, size);
    if (result.error || !Array.isArray(result.data)) throw new Error("calendar_load_failed");
    for (const row of result.data) {
      if (!Number.isSafeInteger(Number(row.slot_id)) || Number(row.slot_id) <= 0 || !Number.isFinite(Date.parse(row.starts_at))) throw new Error("calendar_invalid_row");
    }
    rows.push(...result.data);
    if (result.data.length < size) break;
  }
  return rows.filter(row => Date.parse(row.starts_at) >= Date.parse(start)).map(row => ({
    id: Number(row.slot_id), startsAt: row.starts_at,
    available: row.is_available === true && Date.parse(row.starts_at) > now.getTime()
  }));
}
