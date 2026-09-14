const timeZone = "Asia/Seoul";

function seoulClock(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(value));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return { hour: Number(read("hour")) % 24, minute: read("minute") };
}

export function formatSeoulTime(value: string) {
  const { hour, minute } = seoulClock(value);
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${minute}`;
}

export function formatSeoulDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone, dateStyle: "medium" }).format(new Date(value));
}

export function formatSeoulDateTime(value: string) {
  return `${formatSeoulDate(value)} ${formatSeoulTime(value)}`;
}

export function formatSeoulDayHeading(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone, month: "long", day: "numeric", weekday: "short" }).format(new Date(value));
}

export function seoulDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
}
