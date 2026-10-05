import Link from "next/link";
import { cohortNumberFromName } from "@/data/seasonWeeks";

type MyCohortHistoryProps = {
  cohorts: string[];
  currentCohort: string | null;
  currentCohortEnded: boolean;
  hasError: boolean;
};

export function MyCohortHistory({ cohorts, currentCohort, currentCohortEnded, hasError }: MyCohortHistoryProps) {
  const history = [...new Set([...cohorts, ...(currentCohort ? [currentCohort] : [])])]
    .sort((a, b) => (cohortNumberFromName(b) ?? 0) - (cohortNumberFromName(a) ?? 0));

  return (
    <section className="my-library-section" aria-labelledby="my-cohort-history">
      <h2 id="my-cohort-history">나의 참여 기수</h2>
      <p>함께했던 기수와 대화 기록을 다시 만나보세요. 지난 기수 대화방은 읽기만 가능해요.</p>
      {hasError && <p role="alert">참여 이력을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.</p>}
      {history.length > 0 ? <ul className="my-cohort-history">
        {history.map((name) => {
          const number = cohortNumberFromName(name);
          const current = name === currentCohort;
          return (
            <li key={name}>
              <div><strong>{name}</strong><span>{current ? currentCohortEnded ? "현재 기수 · 종료" : "현재 기수" : "지난 참여"}</span></div>
              {number !== null && <Link className="text-link" href={`/membership/talk#cohort-${number}`}>{name} 대화방 보기</Link>}
            </li>
          );
        })}
      </ul> : !hasError && <p>아직 참여한 기수가 없어요.</p>}
    </section>
  );
}
