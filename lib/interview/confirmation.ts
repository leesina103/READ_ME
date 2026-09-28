import "server-only";
import { bookingManagementPath, formatInterviewTime } from "@/lib/interview/booking";

export type InterviewNotificationStatus = "sent" | "not_configured" | "failed";

type SendInterviewConfirmationOptions = {
  name: string;
  phone: string;
  startsAt: string;
  managementToken: string;
  applicationId: string;
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

export function buildInterviewConfirmationMessage({ name, startsAt, managementToken }: Omit<SendInterviewConfirmationOptions, "phone">) {
  const baseUrl = siteUrl();
  const interviewUrl = `${baseUrl}/interview`;

  return [
    "[READ ME] 인터뷰 예약이 완료되었습니다.",
    "",
    `${name}님, 아래 일정으로 인터뷰를 예약했어요.`,
    `- 인터뷰 시간: ${formatInterviewTime(startsAt)}`,
    "",
    "인터뷰 준비와 READ ME에 관한 정보는 아래 페이지에서 확인해 주세요.",
    `- READ ME 인터뷰 안내: ${interviewUrl}`,
    `- READ ME 홈페이지: ${baseUrl}`,
    "",
    "인터뷰 시작 전까지 아래 링크에서 일정을 변경하거나 취소할 수 있어요.",
    `- 예약 변경·취소: ${baseUrl}${bookingManagementPath(managementToken)}`
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
        interview: { applicationId: options.applicationId, startsAt: options.startsAt, timezone: "Asia/Seoul", status: "booked" },
        message: {
          text: buildInterviewConfirmationMessage(options),
          links: [
            { label: "READ ME 인터뷰 안내", url: `${baseUrl}/interview` },
            { label: "예약 변경·취소", url: `${baseUrl}${bookingManagementPath(options.managementToken)}` },
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

export async function sendInterviewUpdate(options: SendInterviewConfirmationOptions & {
  event: "rescheduled" | "cancelled";
  updatedAt: string;
}): Promise<InterviewNotificationStatus> {
  const webhookUrl = process.env.INTERVIEW_CONFIRMATION_WEBHOOK_URL;
  if (!webhookUrl) return "not_configured";
  const token = process.env.INTERVIEW_CONFIRMATION_WEBHOOK_TOKEN;
  const cancelled = options.event === "cancelled";
  const managementUrl = `${siteUrl()}${bookingManagementPath(options.managementToken)}`;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        type: `interview.${options.event}`, channel: "kakao_alimtalk",
        recipient: { name: options.name, phone: options.phone },
        interview: { applicationId: options.applicationId, startsAt: options.startsAt, updatedAt: options.updatedAt, timezone: "Asia/Seoul", status: cancelled ? "cancelled" : "booked" },
        // 발송 서비스는 같은 예약의 이전 리마인드를 제거하고 최신 상태를 기준으로 처리합니다.
        reminder: { operation: cancelled ? "cancel" : "replace", bookingId: options.applicationId, startsAt: cancelled ? null : options.startsAt },
        message: {
          text: `${options.name}님, 인터뷰 예약을 ${cancelled ? "취소" : "변경"}했어요.\n${cancelled ? "취소한 일정" : "변경된 일정"}: ${formatInterviewTime(options.startsAt)}\n\n예약 확인: ${managementUrl}`,
          links: [{ label: "예약 확인", url: managementUrl }]
        }
      }),
      signal: AbortSignal.timeout(5000)
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
