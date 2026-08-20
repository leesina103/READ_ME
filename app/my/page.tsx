import Link from "next/link";
import { BookMarked, LockKeyhole, MessageSquareText } from "lucide-react";

export default function MyPage() {
  return <main className="mx-auto max-w-5xl px-6 py-20 md:py-28"><p className="eyebrow">MEMBER AREA</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">나의 서재</h1><p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">참여 중인 기수, 이번 주 질문, 내가 남긴 문장을 한곳에서 이어보는 회원 전용 공간입니다.</p>
    <div className="mt-12 grid gap-4 md:grid-cols-2"><article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7"><BookMarked className="text-[var(--forest)]"/><h2 className="mt-8 text-xl font-semibold">나의 모임</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">참여 기수의 일정, 선정 도서와 공지사항을 확인해요.</p></article><article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7"><MessageSquareText className="text-[var(--forest)]"/><h2 className="mt-8 text-xl font-semibold">질문과 문장</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">모임 전 질문을 적고, 대화 뒤 남은 생각을 기록해요.</p></article></div>
    <div className="mt-5 rounded-[28px] bg-[var(--forest)] p-8 text-[var(--cream)]"><div className="flex items-start gap-4"><LockKeyhole className="mt-1 shrink-0"/><div><p className="font-semibold">로그인 후 나의 기록을 열어보세요.</p><p className="mt-2 text-sm text-white/70">현재 v1.0은 화면 구조 단계이며 실제 회원 데이터 연결은 다음 구현 범위입니다.</p></div></div><Link href="/login" className="mt-7 inline-flex rounded-full bg-[var(--cream)] px-5 py-3 text-sm font-semibold text-[var(--ink)]">로그인하기</Link></div>
  </main>;
}
