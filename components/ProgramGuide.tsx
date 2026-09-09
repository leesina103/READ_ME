import Image from "next/image";
import { TalkRoomPreview } from "@/components/TalkRoomPreview";

export function ProgramGuide() {
  return (
    <section id="program-guide" className="section season-section">
      <div className="section-shell">
        <div className="season-guide">
          <p className="eyebrow">PROGRAM GUIDE</p>
          <h2>왜 2주에 한 번<br />만날까요?</h2>
          <strong className="season-guide__lead">읽고 이야기한 것을 삶으로 가져가는 시간</strong>
          <p>READ ME가 격주로 만나는 이유는 단순히 쉬어가기 위해서가 아닙니다. 책을 읽고 대화한 생각을 일상에 적용하고 기록할 시간을 남겨두기 위해 2주의 리듬으로 운영합니다.<br />매주 한 권을 빠르게 읽기보다, 2주에 한 권을 깊게 읽습니다.</p>
        </div>
        <h3 className="season-cycle__title">한 회차는 이렇게 진행됩니다.</h3>
        <ol className="season-cycle">
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head"><span>토의 전 · 사색</span><h3>독서 <em className="is-input">INPUT</em></h3></div>
              <div className="season-cycle__body"><p>다양한 사람의 경험을 가장 값싸게 배우는 방법, 책을 읽습니다.</p></div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-self.png" alt="혼자 책을 읽으며 기록하는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head"><span>토의 전 · 온라인</span><h3>사전 질문</h3></div>
              <div className="season-cycle__body"><p>책을 읽고 떠오른 생각을 사전 질문에 미리 적어둡니다.</p></div>
            </div>
            <TalkRoomPreview />
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head"><span>1주차 · 오프라인</span><h3>토의</h3></div>
              <div className="season-cycle__body"><p>발제문의 질문으로 대화하며, 서로 다른 관점에서 식견을 넓힙니다.</p></div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-relationship.png" alt="마주 앉아 대화하는 두 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head"><span>2주차 · 온라인</span><h3>실천 <em className="is-output">OUTPUT</em></h3></div>
              <div className="season-cycle__body"><p>토의에서 나눈 이야기로 생각을 다시 정리해 적습니다. 써봐야 생각이 정리되고, 서로의 답을 보며 시야가 넓어집니다.</p><p>정리한 생각을 일상에 접목해 실천하고, 어떤 행동을 했는지 조원들과 공유합니다.</p></div>
            </div>
            <TalkRoomPreview variant="output" />
          </li>
        </ol>
        <p className="season-cycle__note">이 흐름이 2주마다 반복되며 8주의 여정이 완성됩니다.<br />온라인 세션은 READ ME 웹 안의 토크방에서 이뤄지고, 답변은 같은 기수끼리 공유됩니다.</p>
      </div>
    </section>
  );
}
