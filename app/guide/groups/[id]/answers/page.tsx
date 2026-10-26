import { notFound } from "next/navigation";
import { guideSession } from "@/lib/guide/access";
import { GuideShell } from "@/components/GuideShell";
export const metadata = { title: "담당 모임 주차 답변", robots: { index: false, follow: false } };
export default async function AnswersPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await guideSession(); const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data, error } = await supabase.rpc("guide_group_answers", { p_group: id });
  if (error) notFound();
  const weeks = data as { week: number; answers: { nickname: string; content: string }[] }[];
  return <GuideShell title="공개된 주차 답변" back={`/guide/groups/${id}`} backLabel="담당 모임"><p>담당 참여자의 답변을 읽기 전용으로 보여줍니다. 아직 열리지 않은 주차는 표시하지 않습니다.</p>{weeks.map(w => <section className="guide-card" key={w.week}><h2>{w.week}주차</h2>{w.answers.map((a,i) => <article className="guide-divider" key={i}><h3>{a.nickname}</h3><p className="whitespace-pre-wrap">{a.content}</p></article>)}{!w.answers.length && <p>아직 작성된 답변이 없습니다.</p>}</section>)}{!weeks.length && <p>아직 공개된 주차가 없습니다.</p>}</GuideShell>;
}
