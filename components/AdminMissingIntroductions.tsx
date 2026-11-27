export type MissingIntroduction = {
  cohort: string;
  member_id: string;
  name: string | null;
  display_name: string;
};

export function AdminMissingIntroductions({ members, failed }: { members: MissingIntroduction[]; failed: boolean }) {
  const panel = "rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm";
  if (failed) return <p role="alert" className={panel}>소개 미작성 명단을 불러오지 못했어요.</p>;
  if (!members.length) return <p className={panel}>소개 미작성 0명</p>;

  return (
    <details className={panel}>
      <summary className="cursor-pointer font-semibold">소개 미작성 {members.length}명</summary>
      <ul className="mt-3 space-y-1">
        {members.map(member => <li key={member.member_id}>{member.name || member.display_name}{member.name && member.display_name && member.display_name !== member.name && ` · ${member.display_name}`}</li>)}
      </ul>
    </details>
  );
}
