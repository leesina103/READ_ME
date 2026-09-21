"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { activityDefaultDetails, type Activity, type ActivityActionState } from "@/lib/membership/activities";
import { parseSeoulInput } from "@/lib/membership/talkDeadlines";

function text(form: FormData, key: string) { const value = form.get(key); return typeof value === "string" ? value.trim() : ""; }
function fail(message: string): ActivityActionState { return { status: "error", message }; }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function errorMessage(message: string) {
  const messages: Record<string, string> = {
    activity_full: "방금 정원이 마감됐어요. 다른 모임을 확인해 주세요.",
    activity_closed: "신청이 마감되었거나 취소된 모임입니다.",
    already_registered: "이미 신청했거나 이전 신청의 입금·환불 확인이 진행 중입니다.",
    host_exempt: "진행 가이드는 참가비가 면제되며 별도로 신청하지 않습니다.",
    membership_required: "활성 멤버십 회원만 신청하거나 제안할 수 있어요.",
    admin_required: "운영자 권한이 필요합니다.",
    activity_started: "이미 시작된 모임입니다. 운영자에게 연락해 주세요.",
    registered_details_locked: "신청자가 생긴 모임의 일정·장소·가격·책·제공 내역·가이드는 변경할 수 없습니다. 변경이 필요하면 모임을 취소하고 새로 등록해 주세요.",
    cannot_unpublish: "공개한 모임을 작성 중으로 되돌릴 수 없습니다. 모집 마감을 이용해 주세요.",
    invalid_transition: "현재 신청 상태에서는 처리할 수 없습니다. 화면을 새로고침해 주세요.",
    invalid_schedule: "새 모임의 시작 시각과 신청 마감은 현재 시각 이후로 정해 주세요.",
    activity_unavailable: "모임을 찾을 수 없거나 이미 취소된 모임입니다."
  };
  return Object.entries(messages).find(([key]) => message.includes(key))?.[1] ?? "처리하지 못했습니다. 입력값과 현재 상태를 확인한 뒤 다시 시도해 주세요.";
}
async function run(name: string, args: Record<string, unknown>, admin = false): Promise<ActivityActionState> {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return fail("로그인이 만료되었습니다. 다시 로그인해 주세요.");
  if (admin && user.app_metadata?.role !== "admin") return fail("운영자 권한이 필요합니다.");
  const { error } = await db.rpc(name, args);
  if (error) return fail(errorMessage(error.message));
  revalidatePath("/membership/activities", "layout");
  revalidatePath("/admin/activities", "layout");
  return { status: "success", message: "처리했습니다." };
}
export async function registerActivityAction(_: ActivityActionState, form: FormData) {
  const id = text(form, "activityId"), payer = text(form, "payerName");
  if (!uuid.test(id) || !payer || payer.length > 80) return fail("입금자명을 80자 이내로 입력해 주세요.");
  if (form.get("policyAccepted") !== "on") return fail("참가비와 취소·환불 기준을 확인해 주세요.");
  const result = await run("register_activity", { p_activity_id: id, p_payer_name: payer, p_policy_accepted: true });
  return result.status === "success" ? { ...result, message: "신청했습니다. 아래 운영 계좌와 입금자명을 확인해 입금해 주세요." } : result;
}
export async function cancelRegistrationAction(_: ActivityActionState, form: FormData) {
  const id = text(form, "registrationId");
  if (!uuid.test(id) || form.get("confirm") !== "on") return fail("취소 안내를 확인하고 체크해 주세요.");
  return run("cancel_activity_registration", { p_registration_id: id });
}
export async function reviewRegistrationAction(_: ActivityActionState, form: FormData) {
  const id = text(form, "registrationId"), operation = text(form, "operation");
  if (!uuid.test(id) || !["confirm_payment", "refund", "unpaid"].includes(operation) || form.get("confirm") !== "on") return fail("실제 입금·환불 내역을 확인하고 체크해 주세요.");
  return run("review_activity_registration", { p_registration_id: id, p_operation: operation }, true);
}
export async function cancelActivityAction(_: ActivityActionState, form: FormData) {
  const id = text(form, "activityId");
  if (!uuid.test(id) || form.get("confirm") !== "on") return fail("모임 취소와 전액 환불 안내를 확인해 주세요.");
  return run("cancel_activity", { p_activity_id: id }, true);
}
export async function submitProposalAction(_: ActivityActionState, form: FormData) {
  const title = text(form, "title"), content = text(form, "content");
  if (title.length < 2 || title.length > 120 || content.length < 2 || content.length > 3000) return fail("제목은 2~120자, 내용은 2~3,000자로 적어 주세요.");
  const result = await run("submit_activity_proposal", { p_title: title, p_content: content });
  return result.status === "success" ? { ...result, message: "제안을 보냈어요." } : result;
}
export async function saveActivityAction(_: ActivityActionState, form: FormData): Promise<ActivityActionState> {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (user?.app_metadata?.role !== "admin") return fail("운영자 권한이 필요합니다.");
  const id = text(form, "id");
  if (id && !uuid.test(id)) return fail("잘못된 모임 주소입니다.");
  const kind = text(form, "kind");
  const starts = text(form, "starts_at"), closes = text(form, "closes_at");
  const parsedStarts = parseSeoulInput(starts), parsedCloses = parseSeoulInput(closes);
  if (!parsedStarts || !parsedCloses) return fail("모임 일시와 신청 마감을 올바르게 입력해 주세요.");
  const startsAt = new Date(parsedStarts), closesAt = new Date(parsedCloses);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(closesAt.getTime()) || closesAt > startsAt) return fail("신청 마감은 모임 시작 시각보다 늦을 수 없습니다.");
  const fee = kind === "gatherings" ? 3000 : Number(text(form, "fee"));
  const capacity = Number(text(form, "capacity"));
  if (!["book-club", "gatherings"].includes(kind) || !Number.isInteger(fee) || (kind === "book-club" && (fee < 30000 || fee > 40000)) || !Number.isInteger(capacity) || capacity < 1 || capacity > 100) return fail("북토의 참가비는 30,000~40,000원, 정원은 1~100명으로 입력해 주세요.");
  const details = activityDefaultDetails(kind as Activity["kind"]);
  let previousSchedule: { starts_at: string; closes_at: string } | null = null;
  // 기존 모임의 안내는 서버에서 읽어 보존한다. 신청 후 제공 조건 잠금도 유지한다.
  if (id) {
    const { data: existing, error } = await db.from("activities").select("kind,included,extra_cost,contact,starts_at,closes_at").eq("id", id).maybeSingle();
    if (error || !existing) return fail("기존 모임 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
    previousSchedule = existing;
    if (existing.kind === kind) Object.assign(details, { included: existing.included, extra_cost: existing.extra_cost, contact: existing.contact });
  }
  const now = Date.now();
  // 이미 지난 일정은 그대로 보존할 수 있지만 과거 시각으로 새로 변경할 수 없다.
  if ((startsAt.getTime() <= now && startsAt.getTime() !== Date.parse(previousSchedule?.starts_at ?? ""))
    || (closesAt.getTime() <= now && closesAt.getTime() !== Date.parse(previousSchedule?.closes_at ?? ""))) return fail("새로 입력하거나 변경하는 모임 시작 시각과 신청 마감은 현재 시각 이후로 정해 주세요.");
  const data: Record<string, string | number> = { kind, fee, capacity, starts_at: startsAt.toISOString(), closes_at: closesAt.toISOString(), ...details };
  const limits: Record<string, [number, number]> = { host_name: [1, 80], title: [2, 120], description: [2, 5000], location: [1, 300], bank_info: [2, 300], chat_url: [0, 1000], chat_password: [0, 100], book_title: [kind === "book-club" ? 1 : 0, 160], reading_scope: [kind === "book-club" ? 1 : 0, 1000] };
  for (const [key, [min, max]] of Object.entries(limits)) {
    const value = text(form, key);
    if (value.length < min || value.length > max) return fail("필수 항목과 글자 수를 확인해 주세요.");
    data[key] = value;
  }
  data.status = text(form, "status");
  if (!["draft", "open", "closed"].includes(String(data.status))) return fail("모집 상태를 선택해 주세요.");
  const { data: savedId, error } = await db.rpc("save_activity", { p_id: id || null, p_data: data });
  if (error || typeof savedId !== "string") return fail(errorMessage(error?.message ?? ""));
  revalidatePath("/membership/activities", "layout");
  revalidatePath("/admin/activities", "layout");
  redirect(`/admin/activities/${savedId}?saved=1`);
}
