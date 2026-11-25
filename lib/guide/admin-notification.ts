import "server-only";
import { sendAdminReviewEmail } from "@/lib/admin-review-email";
import type { SupabaseClient } from "@supabase/supabase-js";

type Notification = { id: string; lease_id: string; payload: { name: string; nickname: string; email: string } };

// 가입자 입력 대신 DB의 인증·온보딩 상태를 확인하고 서버 설정 수신자에게만 보냅니다.
export async function sendGuideApprovalNotification(supabase: SupabaseClient): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.INTERVIEW_ADMIN_EMAIL?.trim();
  if (!key || !recipient) return;
  try {
    const { data, error } = await supabase.rpc("claim_guide_approval_notification");
    if (error) throw new Error("claim_failed");
    if (!data) return;
    const notification = data as Notification;
    const { name, nickname, email } = notification.payload;
    await sendAdminReviewEmail({
      subject: `가이드 승인 요청 · ${name}`,
      message: "이메일 인증과 닉네임 설정을 마친 가이드가 승인을 기다리고 있습니다.",
      details: [`이름: ${name}`, `닉네임: ${nickname}`, `이메일: ${email}`],
      path: "/admin/roles",
      linkLabel: "가이드 승인하러 가기",
      idempotencyKey: `guide-approval-${notification.id}`
    });
    const saved = await supabase.rpc("finish_guide_approval_notification", { p_lease: notification.lease_id });
    if (saved.error) console.error("가이드 승인 알림 접수 기록 저장 실패");
  } catch {
    // 메일 실패가 가입 완료를 막지 않으며 개인정보와 인증 키는 로그에 남기지 않습니다.
    console.error("가이드 승인 알림 요청 실패: 네트워크 또는 설정 확인 필요");
  }
}
