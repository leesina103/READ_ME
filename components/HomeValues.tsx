import { MultilineText } from "@/components/MultilineText";

const values = [
  { keyword: "책", title: "직접 살아보지 못한 삶을 배웁니다.", description: "다른 사람의 경험과 지혜에서 내 삶에 필요한 생각을 얻습니다." },
  { keyword: "사람", title: "같은 책에서 더 넓은 생각을 얻습니다.", description: "서로 다른 경험과 해석을 나누며 혼자서는 보지 못했던 관점을 발견합니다." },
  { keyword: "대화", title: "내 말 속에서 나를 발견합니다.", description: "이야기를 나누다 보면 잊고 있던 나를 마주하고, 막연했던 생각도 조금씩 선명해집니다.\n그 과정에서 내가 무엇을 느끼고 중요하게 여기는지 알아갑니다." }
];

export function HomeValues() {
  return (
    <section id="values" className="section home-values" aria-labelledby="home-values-title">
      <div className="section-shell">
        <div className="home-values__intro">
          <h2 id="home-values-title">책을 읽고, 함께 대화하며<br />단단한 나를 만드는 <strong>마음근력</strong>을 기릅니다.</h2>
          <p className="home-values__purpose">빠르게 변하고 불확실한 세상에서도<br />나에게 중요한 것을 알고, 내 삶의 방향을 스스로 찾아가기 위해.</p>
        </div>
        <div className="home-values__grid">
          {values.map(({ keyword, title, description }) => (
            <article className="home-values__item" key={keyword}>
              <h3>{keyword}<span>{title}</span></h3>
              <MultilineText lines={description.split("\n")} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
