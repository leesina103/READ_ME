"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { registerActivityAction, cancelRegistrationAction, submitProposalAction, saveActivityAction } from "@/app/membership/activity-actions";
import { FormField, inputClassName } from "@/components/FormField";
import { activityDefaultDetails, refundRules, seoulInput, type Activity, type ActivityActionState, type ActivitySecrets } from "@/lib/membership/activities";

export function RefreshActivityButton() {
  const router = useRouter();
  return <button type="button" className="button button--ghost" onClick={() => router.refresh()}>입금 확인 상태 새로고침</button>;
}

export function ActivityActionForm({ action, label, children, confirmation }: { action: (state: ActivityActionState, form: FormData) => Promise<ActivityActionState>; label: string; children?: ReactNode; confirmation?: string }) {
  const [state, formAction, pending] = useActionState<ActivityActionState, FormData>(action, { status: "idle", message: "" });
  return <form action={formAction} className="activity-form">
    {children}
    {confirmation && <label className="activity-check"><input type="checkbox" name="confirm" required /><span>{confirmation}</span></label>}
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="activity-message">{state.message}</p>}
    <button type="submit" className="button button--primary" disabled={pending}>{pending ? "처리 중…" : label}</button>
  </form>;
}
export function RegisterActivityForm({ activityId }: { activityId: string }) {
  return <ActivityActionForm action={registerActivityAction} label="신청하고 입금 안내 보기">
    <input type="hidden" name="activityId" value={activityId} />
    <FormField label="입금자명" hint="실제로 입금할 분의 이름을 적어 주세요. 신청 후 발급되는 입금 코드를 이름 앞에 붙여 입금합니다."><input className={inputClassName()} name="payerName" maxLength={80} required autoComplete="name" /></FormField>
    <label className="activity-check"><input type="checkbox" name="policyAccepted" required /><span>참가비·포함 내역·별도 비용과 취소·환불 기준을 확인했습니다.</span></label>
  </ActivityActionForm>;
}
export function CancelRegistrationForm({ registrationId, refundable }: { registrationId: string; refundable: boolean }) {
  return <ActivityActionForm action={cancelRegistrationAction} label="신청 취소" confirmation={refundable ? "신청을 취소합니다. 입금했다면 전액 환불 대상이며 운영자가 내역 확인 후 반환합니다." : "신청을 취소합니다. 전액 환불 기한이 지나 입금한 참가비는 환불되지 않습니다."}>
    <input type="hidden" name="registrationId" value={registrationId} />
  </ActivityActionForm>;
}
export function ActivityProposalForm() {
  return <ActivityActionForm action={submitProposalAction} label="가이드에게 제안 보내기">
    <FormField label="어떤 모임을 하고 싶나요?"><input className={inputClassName()} name="title" minLength={2} maxLength={120} required placeholder="함께 읽고 싶은 책이나 하고 싶은 활동" /></FormField>
    <FormField label="제안 내용" hint="제안 내용과 닉네임은 운영자에게만 보여요."><textarea className={inputClassName()} name="content" minLength={2} maxLength={3000} required rows={4} placeholder="활동 내용, 원하는 시기와 장소 등을 알려 주세요." /></FormField>
  </ActivityActionForm>;
}
export function ActivityEditor({ activity, secrets }: { activity?: Activity; secrets?: ActivitySecrets }) {
  const [kind, setKind] = useState(activity?.kind ?? "book-club");
  const fields: { name: keyof Activity | keyof ActivitySecrets; label: string; max: number; multiline?: boolean; required?: boolean; hint?: string }[] = [
    { name: "title", label: "모임 제목", max: 120 }, { name: "host_name", label: "진행 가이드 이름", max: 80 },
    { name: "description", label: "모임 소개", max: 5000, multiline: true }, { name: "location", label: "장소", max: 300 },
    ...(kind === "book-club" ? [{ name: "book_title" as const, label: "책 제목", max: 160 }, { name: "reading_scope" as const, label: "읽어올 범위", max: 1000 }] : []),
    { name: "bank_info", label: "운영 계좌 · 은행 / 계좌번호 / 예금주", max: 300 },
    { name: "chat_url", label: "오픈채팅 초대 링크 · 선택", max: 1000, required: false, hint: "비워 두고 모임을 먼저 열어도 됩니다. 나중에 링크나 입장 안내를 적어 주세요. 확정된 참여자에게만 공개됩니다." },
    { name: "chat_password", label: "오픈채팅 비밀번호", max: 100, required: false }
  ];
  const values = { ...activity, ...secrets };
  return <ActivityActionForm action={saveActivityAction} label={activity ? "변경 내용 저장" : "모임 저장"}>
    <input type="hidden" name="id" value={activity?.id ?? ""} />
    <div className="activity-fields">
      <FormField label="모임 유형"><select className={inputClassName()} name="kind" value={kind} onChange={(event) => setKind(event.target.value as Activity["kind"])}><option value="book-club">북토의</option><option value="gatherings">소모임</option></select></FormField>
      <FormField label="모집 상태"><select className={inputClassName()} name="status" defaultValue={activity?.status ?? "draft"}>{(!activity || activity.status === "draft") && <option value="draft">작성 중 · 회원에게 비공개</option>}<option value="open">모집 중</option><option value="closed">모집 마감</option></select></FormField>
      {fields.map((field) => <FormField key={field.name} label={field.label} hint={field.hint}>
        {field.multiline ? <textarea className={inputClassName()} name={field.name} defaultValue={String(values[field.name] ?? "")} maxLength={field.max} required rows={4} /> : <input className={inputClassName()} name={field.name} defaultValue={String(values[field.name] ?? "")} maxLength={field.max} required={field.required !== false} type="text" />}
      </FormField>)}
      {kind === "gatherings" && <><input type="hidden" name="book_title" value="" /><input type="hidden" name="reading_scope" value="" /></>}
      <FormField label="모임 시작 · 한국 시간"><input className={inputClassName()} type="datetime-local" name="starts_at" defaultValue={activity ? seoulInput(activity.starts_at) : ""} required /></FormField>
      <FormField label="신청 마감 · 한국 시간"><input className={inputClassName()} type="datetime-local" name="closes_at" defaultValue={activity ? seoulInput(activity.closes_at) : ""} required /></FormField>
      <FormField label="참여자 정원" hint="진행 가이드를 제외한 인원입니다. 입금 대기 신청도 자리를 확보합니다."><input className={inputClassName()} type="number" name="capacity" defaultValue={activity?.capacity ?? 8} min={activity?.reserved_count || 1} max={100} required /></FormField>
      <FormField label="참가비 · 원" hint={kind === "gatherings" ? "소모임은 3,000원 고정입니다. 진행 가이드는 면제됩니다." : "30,000~40,000원 사이에서 정합니다. 진행 가이드는 면제됩니다."}><input key={kind} className={inputClassName()} type="number" name="fee" defaultValue={kind === "gatherings" ? 3000 : activity?.kind === "book-club" ? activity.fee : 30000} min={kind === "gatherings" ? 3000 : 30000} max={kind === "gatherings" ? 3000 : 40000} readOnly={kind === "gatherings"} required /></FormField>
    </div>
    <div className="activity-notice"><strong>참가비 안내는 자동으로 표시됩니다.</strong><p>{activity && activity.kind === kind ? activity.included : activityDefaultDetails(kind).included} 포함 · {activity && activity.kind === kind ? activity.extra_cost : activityDefaultDetails(kind).extra_cost}</p><p>추가로 알릴 내용은 모임 소개에 적어 주세요.</p></div>
    <div className="activity-notice"><strong>공통 취소·환불 기준</strong>{refundRules.map((rule) => <p key={rule}>{rule}</p>)}<p>신청자가 생긴 뒤에는 일정·장소·가격·책·제공 내역·가이드를 바꿀 수 없습니다.</p></div>
  </ActivityActionForm>;
}
