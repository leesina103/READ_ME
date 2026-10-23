import { guideSession } from "@/lib/guide/access";
import { GuideShell } from "@/components/GuideShell";
export const metadata = { title: "가이드 자료", robots: { index: false, follow: false } };
export default async function ResourcesPage() {
  await guideSession();
  return <GuideShell title="가이드 자료"><section className="guide-card"><h2>모임 준비와 진행</h2><ol><li>담당 모임 명단과 회차별 일정·장소를 확인합니다.</li><li>공개된 주차의 참여자 답변을 읽고 대화의 출발점을 준비합니다.</li><li>일정·장소를 바꿀 때는 변경 전후를 확인하고 저장합니다. 변경 사항은 참여자에게 직접 안내합니다.</li><li>토의 전 내가 생각한 답 → 오늘 새로 들은 관점 → 다음 주에 살펴볼 행동이나 질문 순서로 기록을 돕습니다.</li><li>승인·입금·정원 변경과 담당 모임 변경은 운영자에게 요청합니다.</li></ol></section><section className="guide-card"><h2>발제문·운영 자료</h2><p>별도 자료 파일은 아직 등록되지 않았습니다. 운영자가 전달한 최신 자료를 사용해 주세요.</p></section></GuideShell>;
}
