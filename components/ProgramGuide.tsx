import Image from "next/image";
import { TalkRoomPreview } from "@/components/TalkRoomPreview";

export function ProgramGuide() {
  return (
    <section className="section season-section">
      <div className="section-shell">
        <div className="season-guide">
          <p className="eyebrow">PROGRAM GUIDE</p>
          <h2>한 회차는<br />이렇게 진행됩니다.</h2>
          <p>한 기수는 하나의 주제로 8주 동안 이어집니다.<br />격주 오프라인 토의에서 책과 질문으로 대화하고, 사이의 휴식 세션에서는 배운 것을 삶에 적용해봅니다.</p>
          <small>* 기수마다 주제가 바뀝니다.</small>
        </div>
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
