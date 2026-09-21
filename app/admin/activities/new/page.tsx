import Link from "next/link";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { ActivityEditor } from "@/components/activities/ActivityForms";

export default async function NewActivityPage() {
  const db = await requireAdmin("/admin/activities/new");
  return <main className="activity-page"><Link href="/admin/activities">← 모임 관리</Link><h1>새 모임 등록</h1><p className="activity-lead">진행할 가이드의 운영자 계정으로 등록합니다. ‘작성 중’으로 저장하면 회원에게 보이지 않습니다.</p>{db ? <ActivityEditor /> : <p>{supabaseNotConfiguredMessage}</p>}</main>;
}
