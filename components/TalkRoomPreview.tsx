type Props = {
  variant?: "question" | "output";
};

export function TalkRoomPreview({ variant = "question" }: Props) {
  const isOutput = variant === "output";

  return (
    <figure className="season-cycle__figure season-cycle__figure--shot">
      <div className="season-cycle__frame">
        <svg viewBox="0 0 320 200" role="img" aria-label={isOutput ? "READ ME 토크방 실천 기록 화면" : "READ ME 토크방 사전 질문 화면"}>
          <rect width="320" height="200" fill="var(--paper)" />
          <text x="16" y="20" className="shot-eyebrow">READ ME 1기 · {isOutput ? "2주차 · 실천 & OUTPUT" : "1주차 · 토의"}</text>
          <text x="16" y="38" className="shot-title">{isOutput ? "존중 실천 기록" : "존중 토의"}</text>
          <text x="16" y="52" className="shot-meta">《관계의 언어》 문요한</text>
          <path d="M0 62h320" stroke="var(--line)" />
          <rect y="62" width="320" height="96" fill="var(--sage)" opacity=".38" />
          <circle cx="26" cy="82" r="10" fill="var(--forest)" />
          <text x="26" y="85" className="shot-avatar" textAnchor="middle">리미</text>
          {isOutput ? (
            <>
              <rect x="42" y="72" width="186" height="20" rx="8" fill="var(--paper)" />
              <text x="52" y="85" className="shot-body is-strong">실천한 행동을 기록해 공유해 주세요.</text>
              <circle cx="26" cy="108" r="10" fill="var(--sand)" />
              <text x="26" y="111" className="shot-avatar is-dark" textAnchor="middle">주</text>
              <rect x="42" y="98" width="152" height="20" rx="8" fill="var(--paper)" />
              <text x="52" y="111" className="shot-body">저는 하루 10분 통화를 해봤어요.</text>
              <rect x="120" y="128" width="184" height="20" rx="8" fill="var(--forest)" />
              <text x="130" y="141" className="shot-body is-mine">다섯 번 참았고, 두 번은 놀랐어요.</text>
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
      <figcaption>READ ME 실제 토크방 화면</figcaption>
    </figure>
  );
}
