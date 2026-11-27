import { currentMeeting } from "@/data/currentMeeting";

type Props = {
  variant?: "question" | "output";
  cohortLabel?: string;
  caption?: string;
};

export function TalkRoomPreview({ variant = "question", cohortLabel = currentMeeting.cohort, caption = "READ ME 실제 토크방 화면" }: Props) {
  const isOutput = variant === "output";

  return (
    <figure className="season-cycle__figure season-cycle__figure--shot">
      <div className="season-cycle__frame">
        <svg viewBox="0 0 320 200" role="img" aria-label={isOutput ? "READ ME 토크방 실천 기록 화면" : "READ ME 토크방 사전 질문 화면"}>
          <rect width="320" height="200" fill="var(--paper)" />
          <text x="16" y="20" className="shot-eyebrow">READ ME {cohortLabel} · {isOutput ? "2주차 · 실천 & OUTPUT" : "1주차 · 토의"}</text>
          <text x="16" y="38" className="shot-title">{isOutput ? "존중 실천 기록" : "존중 토의"}</text>
          <text x="16" y="52" className="shot-meta">『관계의 언어』 문요한</text>
          <path d="M0 62h320" stroke="var(--line)" />
          <rect y="62" width="320" height="96" fill="var(--sage)" opacity=".38" />
          <circle cx="26" cy="82" r="10" fill="var(--forest)" />
          <text x="26" y="85" className="shot-avatar" textAnchor="middle">리미</text>
          {isOutput ? (
            <>
              <rect x="42" y="69" width="265" height="48" rx="8" fill="var(--paper)" />
              <text x="52" y="81" className="shot-body is-strong">
                <tspan x="52">지난 모임에서 나눈 이야기 중, 내 일상에서 더 생각해보고</tspan>
                <tspan x="52" dy="13">싶은 질문이나 직접 해보고 싶은 행동은 무엇인가요?</tspan>
                <tspan x="52" dy="13">자유롭게 이야기해 주세요.</tspan>
              </text>
              <rect x="105" y="128" width="199" height="20" rx="8" fill="var(--forest)" />
              <text x="115" y="141" className="shot-body is-mine">친구의 말을 끝까지 들어보고 싶어요.</text>
            </>
          ) : (
            <>
              <text x="42" y="76" className="shot-name">리미</text>
              <rect x="42" y="80" width="176" height="34" rx="8" fill="var(--paper)" />
              <text x="52" y="94" className="shot-body">이번 주 질문이에요.</text>
              <text x="52" y="107" className="shot-body is-strong">우리는 서로를 어떻게 존중하는가?</text>
              <text x="304" y="128" className="shot-name" textAnchor="end">나</text>
              <rect x="136" y="132" width="168" height="20" rx="8" fill="var(--forest)" />
              <text x="146" y="145" className="shot-body is-mine">말을 끊지 않고 끝까지 듣는 것부터요.</text>
            </>
          )}
          <rect x="14" y="168" width="230" height="22" rx="8" fill="var(--paper)" stroke="var(--line)" />
          <text x="26" y="182" className="shot-placeholder">{isOutput ? "답변을 수정할 수 있어요." : "나의 답변을 남겨보세요."}</text>
          <rect x="252" y="168" width="54" height="22" rx="11" fill="var(--forest)" />
          <text x="279" y="182" className="shot-btn" textAnchor="middle">{isOutput ? "수정하기" : "보내기"}</text>
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
