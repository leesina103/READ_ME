import "server-only";
import { formatInterviewTime } from "@/lib/interview/booking";

type AdminNotificationOptions = {
  applicationId: string;
  startsAt: string;
};

// 수신자는 서버 설정으로만 정합니다. 예약자의 입력으로 바꿀 수 없습니다.
export async function sendInterviewAdminNotification({ applicationId, startsAt }: AdminNotificationOptions): Promise<"accepted" | "not_configured" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.INTERVIEW_ADMIN_EMAIL?.trim();
  if (!apiKey || !recipient) return "not_configured";

  try {
    const baseUrl = process.env.INTERVIEW_ADMIN_SITE_URL?.trim() || "https://read-me-two-black.vercel.app";
    const adminUrl = new URL("/admin/interviews", baseUrl);
    if (adminUrl.protocol !== "https:" && adminUrl.protocol !== "http:") throw new Error("invalid_site_url");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `interview-admin-booked-${applicationId}`
      },
      body: JSON.stringify({
        from: process.env.INTERVIEW_ADMIN_EMAIL_FROM?.trim() || "READ ME <onboarding@resend.dev>",
        to: [recipient],
        subject: "[READ ME] 새 인터뷰 예약",
        text: [
          "새 인터뷰 예약이 접수됐습니다.",
          `인터뷰 일정: ${formatInterviewTime(startsAt)} (한국 시간)`,
          "",
          "예약자 정보는 관리자 페이지에서 확인해 주세요.",
          adminUrl.href
        ].join("\n")
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      // 키, 수신 주소, 예약자 정보와 응답 본문은 로그에 남기지 않습니다.
      console.error("인터뷰 운영자 메일 요청 실패", { status: response.status });
      return "failed";
    }
    // API 접수 성공이며, 실제 배달 여부는 Resend 발송 내역에서 확인합니다.
    return "accepted";
  } catch {
    console.error("인터뷰 운영자 메일 요청 실패: 네트워크 또는 설정 확인 필요");
    return "failed";
  }
}
