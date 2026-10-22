import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
const FORM_ID = "pbQKJb";
const REVIEW_SHEET = "https://docs.google.com/spreadsheets/d/1DvNfmCCqZAO1itKGlxxTpT08df9q5os1-mkjb4rItHs/edit";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const secret = process.env.TALLY_REVIEW_SIGNING_SECRET?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.INTERVIEW_ADMIN_EMAIL?.trim();
  if (!secret || !apiKey || !recipient) return new Response("알림 설정 필요", { status: 503 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 256_000) return new Response(null, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  // Tally 공식 예제와 같은 JSON 직렬화 방식으로 서명을 검증합니다.
  const expected = Buffer.from(createHmac("sha256", secret).update(JSON.stringify(payload)).digest("base64"));
  const signature = Buffer.from(request.headers.get("tally-signature") ?? "");
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return new Response(null, { status: 401 });
  if (!record(payload) || payload.eventType !== "FORM_RESPONSE" || !record(payload.data)) return new Response(null, { status: 400 });
  const data = payload.data;
  if (data.formId !== FORM_ID) return new Response(null, { status: 403 });
  if (typeof data.submissionId !== "string" || !data.submissionId || typeof data.createdAt !== "string"
    || !Number.isFinite(Date.parse(data.createdAt)) || !Array.isArray(data.fields)) return new Response(null, { status: 400 });
  const fields = data.fields;
  const hidden = (label: string) => {
    const field = fields.find((item: unknown) => record(item) && item.type === "HIDDEN_FIELDS" && item.label === label);
    return record(field) && (typeof field.value === "string" || typeof field.value === "number") ? String(field.value) : "";
  };
  const cohort = hidden("cohort");
  const cohortLabel = /^[1-9]\d{0,3}$/.test(cohort) ? `${cohort}기` : "기수 미확인";
  const session = hidden("session");
  const event = hidden("event");
  const kind = event === "session" && /^[1-4]$/.test(session) ? `${session}회차`
    : event === "cohort" ? "기수 전체" : event === "party" ? "파티" : "종류 미확인";
  const submittedAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short"
  }).format(new Date(data.createdAt));
  const destination = cohort === "1" ? REVIEW_SHEET : `https://tally.so/forms/${FORM_ID}/submissions`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Resend의 동일 요청 중복 방지 보관 기간은 24시간입니다.
        "Idempotency-Key": `review-${createHash("sha256").update(`${FORM_ID}:${data.submissionId}`).digest("hex")}`
      },
      body: JSON.stringify({
        from: process.env.INTERVIEW_ADMIN_EMAIL_FROM?.trim() || "READ ME <onboarding@resend.dev>",
        to: [recipient], subject: `[READ ME] ${cohortLabel} · ${kind} 후기 접수`,
        text: ["새 후기가 제출됐습니다.", `기수: ${cohortLabel}`, `후기: ${kind}`,
          `제출 시각: ${submittedAt} (한국 시간)`, "", "후기 확인:", destination, "",
          "이 메일은 Tally 제출 알림입니다. 구글 시트에 반영되기까지 시간이 걸릴 수 있습니다."].join("\n")
      }), signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      console.error("후기 알림 메일 접수 실패", { status: response.status });
      return new Response(null, { status: 502 });
    }
    return Response.json({ accepted: true });
  } catch {
    console.error("후기 알림 메일 요청 실패");
    return new Response(null, { status: 502 });
  }
}
