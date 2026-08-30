import "server-only";

export type InterviewNotificationStatus = "sent" | "not_configured" | "failed";

type SendInterviewConfirmationOptions = {
  name: string;
  phone: string;
  startsAt: string;
};

function siteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function formatInterviewTime(startsAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(startsAt));
}

export function buildInterviewConfirmationMessage({ name, startsAt }: Omit<SendInterviewConfirmationOptions, "phone">) {
  const baseUrl = siteUrl();
  const interviewUrl = `${baseUrl}/interview`;

  return [
    "[READ ME] 인터뷰 신청이 완료되었습니다.",
    "",
    `${name}님, 아래 일정으로 인터뷰를 신청했어요.`,
    `- 인터뷰 시간: ${formatInterviewTime(startsAt)}`,
    "",
    "인터뷰 준비와 READ ME에 관한 정보는 아래 페이지에서 확인해 주세요.",
    `- READ ME 인터뷰 안내: ${interviewUrl}`,
    `- READ ME 홈페이지: ${baseUrl}`,
    "",
    "일정 변경이 필요하면 READ ME 카카오톡 채널로 알려주세요."
  ].join("\n");
}

export async function sendInterviewConfirmation(
  options: SendInterviewConfirmationOptions
): Promise<InterviewNotificationStatus> {
  const webhookUrl = process.env.INTERVIEW_CONFIRMATION_WEBHOOK_URL;
  if (!webhookUrl) return "not_configured";

  const token = process.env.INTERVIEW_CONFIRMATION_WEBHOOK_TOKEN;
  const baseUrl = siteUrl();

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        type: "interview.confirmed",
        channel: "kakao_alimtalk",
        recipient: { name: options.name, phone: options.phone },
        interview: { startsAt: options.startsAt, timezone: "Asia/Seoul" },
        message: {
          text: buildInterviewConfirmationMessage(options),
          links: [
            { label: "READ ME 인터뷰 안내", url: `${baseUrl}/interview` },
            { label: "READ ME 홈페이지", url: baseUrl }
          ]
        }
      }),
      signal: AbortSignal.timeout(5000)
    });

    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
