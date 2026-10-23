import Link from "next/link";

export type AdminGuideRow = {
  user_id: string; name: string; nickname: string; cohort: string;
  current_cohort: string | null; group_id: string; group_name: string; linked: boolean;
};

export function AdminGuideRoster({ guides, standalone = false }: { guides: AdminGuideRow[]; standalone?: boolean }) {
  const guideCount = new Set(guides.map(guide => guide.user_id)).size;
  return <section aria-label={standalone ? "전체 가이드" : "기수 가이드"} className={standalone ? "overflow-hidden rounded-[28px] border border-[var(--forest)]/40 bg-[var(--paper)]" : "min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]"}>
    {standalone ? <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
      <h2 className="text-xl font-semibold">가이드</h2>
      <span className="text-sm text-[var(--muted)]">{guideCount}명</span>
    </header> : null}
    <div className={standalone ? "px-4 pt-3 pb-2" : "border-b border-[var(--line)] bg-[var(--sage)]/30 px-4 py-3"}>
    {!standalone && <h3 className="font-semibold text-[var(--forest)]">가이드 · {guideCount}명</h3>}
    <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{standalone ? "전체 기수의 활동 중인 가이드입니다. 아래 기수별 명단에서도 해당 기수의 가이드를 확인할 수 있습니다." : "회원 연결이 완료된 가이드는 아래 회원 명단에도 포함됩니다."}</p>
    </div>
    <div className="overflow-x-auto">
      <table className="admin-member-table w-full min-w-[640px] whitespace-nowrap text-left text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr>
            <th scope="col" className="px-3 py-2 pl-4 font-semibold">이름</th>
            <th scope="col" className="px-3 py-2 font-semibold">닉네임</th>
            <th scope="col" className="px-3 py-2 font-semibold">참여 기수</th>
            <th scope="col" className="px-3 py-2 font-semibold">담당 모임</th>
            <th scope="col" className="px-3 py-2 font-semibold">연결 상태</th>
            <th scope="col" className="px-3 py-2 font-semibold">관리</th>
          </tr>
        </thead>
        <tbody>{guides.map(guide => <tr key={`${guide.user_id}-${guide.group_id}`} className="border-t border-[var(--line)]">
          <td className="px-3 py-2 pl-4 font-semibold">{guide.name}</td>
          <td className="px-3 py-2">{guide.nickname || "—"}</td>
          <td className="px-3 py-2">{guide.current_cohort ?? "미연결"}</td>
          <td className="px-3 py-2">{guide.cohort} · {guide.group_name}</td>
          <td className="px-3 py-2"><span className={`rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold ${guide.linked ? "bg-[var(--sage)] text-[var(--forest)]" : "bg-[var(--sand)] text-[var(--ink)]"}`}>{guide.linked ? "회원 연결 완료" : "회원 연결 필요"}</span></td>
          <td className="px-3 py-2"><Link href="/admin/roles?tab=active" className="button button--ghost">배정·연결 관리</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
    {guides.some(guide => !guide.linked) && <p className="px-4 py-3 text-xs leading-6 text-[var(--muted)]">회원 연결이 필요한 가이드는 가이드 관리에서 담당 모임을 다시 저장해 주세요.</p>}
  </section>;
}
