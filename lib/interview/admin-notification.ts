import "server-only";
import { formatInterviewTime } from "@/lib/interview/booking";
import { emailHtml } from "@/supabase/functions/operations-worker/email-html.mjs";

type AdminNotificationOptions = {
  applicationId: string;
  startsAt: string;
  name: string;
  phone: string;
} & ({ event?: "booked" } | { event: "rescheduled" | "cancelled"; updatedAt: string });

// 수신자는 서버 설정으로만 정합니다. 예약자의 입력으로 바꿀 수 없습니다.
export async function sendInterviewAdminNotification(options: AdminNotificationOptions): Promise<"accepted" | "not_configured" | "failed"> {
  const { applicationId, startsAt } = options;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.INTERVIEW_ADMIN_EMAIL?.trim();
  if (!apiKey || !recipient) return "not_configured";

  try {
    const event = options.event ?? "booked";
    const name = options.name.trim().replace(/\s+/g, " ");
    const phone = options.phone.replace(/[^0-9]/g, "").replace(/^(01\d)(\d{3,4})(\d{4})$/, "$1-$2-$3");
    const content = {
      booked: { subject: "새 인터뷰 예약", message: "새 인터뷰 예약이 접수됐습니다.", label: "인터뷰 일정" },
      rescheduled: { subject: "인터뷰 일정 변경", message: "인터뷰 예약 일정이 변경됐습니다.", label: "변경된 일정" },
      cancelled: { subject: "인터뷰 예약 취소", message: "인터뷰 예약이 취소됐습니다.", label: "취소된 일정" }
    }[event];
    // 반복 변경도 알리되 동일 변경의 재요청은 중복 발송하지 않습니다.
    const eventVersion = "updatedAt" in options ? `-${options.updatedAt}` : "";
    const baseUrl = process.env.INTERVIEW_ADMIN_SITE_URL?.trim() || "https://read-me-two-black.vercel.app";
    const adminUrl = new URL("/admin/interviews", baseUrl);
    if (adminUrl.protocol !== "https:" && adminUrl.protocol !== "http:") throw new Error("invalid_site_url");
    const draft = event === "cancelled"
      ? `${name}님, 인터뷰 예약 취소를 확인했어요. 다시 신청하실 때 인터뷰 예약 페이지를 이용해 주세요.`
      : `${name}님, READ ME 인터뷰가 ${formatInterviewTime(startsAt)}으로 ${event === "rescheduled" ? "변경" : "예약"}됐어요. Meet 링크는 시작 30분 전에 보내드릴게요.`;
    const mailText = [
          "① 자동 처리 결과",
          content.message,
          `예약자 이름: ${name}`,
          `연락처: ${phone}`,
          `${content.label}: ${formatInterviewTime(startsAt)} (한국 시간)`,
          "",
          "Google 일정·Meet·노션의 반영 결과는 별도 자동화 알림이나 노션에서 확인해 주세요.",
          "", "② 직접 할 일",
          event === "cancelled" ? "취소된 일정의 안내와 할 일을 확인해 주세요." : "예약 안내 발송 여부와 Meet 준비 상태를 확인해 주세요.",
          "실제 안내 후 노션에 완료 체크하세요. 참여자에게 문자가 자동 발송되지는 않습니다.",
          "", "③ 보낼 메시지 초안", draft,
          "", "④ 다음 행동",
          event === "cancelled" ? "재예약이 들어오면 새 일정으로 안내합니다." : "전날 안내 여부를 확인하고, 시작 30분 전에 Meet 링크를 보내세요.",
          "", "⑤ 다음 메시지 초안",
          event === "cancelled" ? "[이름]님, 새로 신청해 주신 [일시]에 인터뷰가 예약됐어요. 접속 링크는 시작 30분 전에 보내드릴게요." : `${name}님, 30분 후 인터뷰가 시작돼요. [Meet 링크]로 들어와 주세요. 접속이 어렵거나 늦어지면 알려주세요.`,
          "", "예약 관리 링크", adminUrl.href
        ].join("\n");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `interview-admin-${event}-${applicationId}${eventVersion}`
      },
      body: JSON.stringify({
        from: process.env.INTERVIEW_ADMIN_EMAIL_FROM?.trim() || "READ ME <onboarding@resend.dev>",
        to: [recipient],
        subject: `[READ ME] ${content.subject}`,
        text: mailText,
        html: emailHtml(mailText)
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
