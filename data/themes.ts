export type ThemeSession = {
  title: string;
  question: string;
  description: string;
  book: string;
  author: string;
};

export type Theme = {
  slug: string;
  name: string;
  subtitle: string;
  coreQuestion: string;
  summary: string;
  introduction: string;
  keywords: readonly string[];
  sessions: readonly ThemeSession[];
};

export const themes = [
  {
    slug: "relationship",
    name: "관계",
    subtitle: "함께 살아가는 법",
    coreQuestion: "우리는 어떻게 관계 맺는가?",
    summary: "존중과 인정, 대화와 사랑을 따라 타인과 함께 살아가는 방식을 탐구합니다.",
    introduction: "타인과 나 사이의 거리와 경계, 서로를 듣는 방법, 가까워진다는 것의 의미를 차례로 이야기합니다.",
    keywords: ["존중", "인정", "대화", "사랑"],
    sessions: [
      { title: "존중", question: "우리는 서로를 어떻게 존중하는가?", description: "상대를 위한다는 마음이 때로는 간섭이 되기도 합니다. 배려와 간섭의 차이, 나와 타인 사이의 적당한 거리와 경계를 함께 살펴봅니다.", book: "관계의 언어", author: "문요한" },
      { title: "인정", question: "모두에게 좋은 사람이어야 할까?", description: "인정받고 싶은 마음이 관계 속 선택을 어떻게 바꾸는지 돌아봅니다. 좋은 관계를 위해 나를 어디까지 내어줄 수 있는지도 이야기합니다.", book: "미움받을 용기", author: "기시미 이치로, 고가 후미타케" },
      { title: "대화", question: "왜 우리는 자꾸 오해하는가?", description: "같은 말을 듣고도 서로 다르게 받아들이는 이유를 찾아갑니다. 잘 말하는 법보다 서로를 이해하게 만드는 대화의 조건을 생각합니다.", book: "비폭력대화", author: "마셜 B. 로젠버그" },
      { title: "사랑", question: "가까워진다는 것은 무엇인가?", description: "사랑과 소유, 친밀함과 독립은 함께할 수 있을까요. 감정에 머무르지 않고 관계를 지속하게 하는 노력과 태도를 이야기합니다.", book: "사랑의 기술", author: "에리히 프롬" }
    ]
  },
  {
    slug: "self",
    name: "나",
    subtitle: "나를 알아가는 법",
    coreQuestion: "나는 누구인가?",
    summary: "욕망과 정체성, 타인의 시선과 가치관을 지나 지금의 나를 이해합니다.",
    introduction: "남의 기준과 비교에서 잠시 벗어나, 나를 움직이는 욕망과 내가 선택하고 싶은 삶의 방향을 살펴봅니다.",
    keywords: ["욕망", "정체성", "타인의 시선", "가치관"],
    sessions: [
      { title: "욕망", question: "내가 원하는 것은 정말 내가 원하는 것인가?", description: "무엇이 나를 움직이는지, 그 바람은 어디에서 시작됐는지 살펴봅니다. 결핍과 욕구를 구분하며 내가 진짜 원하는 것에 가까이 갑니다.", book: "너 자신의 이유로 살라", author: "루크 버기스" },
      { title: "정체성", question: "나는 어떤 사람인가?", description: "성격과 흥미, 강점과 반복되는 선택 속에서 지금의 나를 읽어봅니다. 하나의 단어로 규정하기보다 여러 모습이 모인 나를 이해합니다.", book: "아들러 성격 상담소", author: "기시미 이치로" },
      { title: "타인의 시선", question: "나는 왜 남의 시선을 의식하는가?", description: "비교와 인정 욕구가 내 선택에 미치는 영향을 돌아봅니다. 타인의 기대와 나의 기준이 충돌할 때 무엇을 따를지 생각합니다.", book: "나는 나로 살기로 했다", author: "김수현" },
      { title: "가치관", question: "나는 어떤 삶을 원하는가?", description: "내가 오래 지키고 싶은 기준과 중요하게 여기는 것을 말해봅니다. 삶의 방향을 타인의 정답이 아닌 나의 언어로 그려봅니다.", book: "자기 결정", author: "페터 비에리" }
    ]
  },
  {
    slug: "change",
    name: "변화",
    subtitle: "더 나은 삶을 만드는 법",
    coreQuestion: "나는 어떻게 변화할 수 있는가?",
    summary: "성장과 환경, 습관과 도전을 살피며 변화가 실제 행동으로 이어지는 길을 찾습니다.",
    introduction: "나를 둘러싼 환경과 반복되는 습관을 살피고, 두려움 속에서도 실행할 수 있는 작은 다음 행동을 찾아갑니다.",
    keywords: ["성장", "환경", "습관", "도전"],
    sessions: [
      { title: "성장", question: "나는 어떻게 변하는가?", description: "달라지고 싶은 마음이 실제 변화로 이어지는 순간을 돌아봅니다. 이미 변하고 있다는 신호와 나에게 필요한 성장의 방향을 발견합니다.", book: "마인드셋", author: "캐럴 드웩" },
      { title: "환경", question: "환경이 나를 만든다면?", description: "공간과 사람, 매일 마주하는 조건이 나에게 미치는 영향을 살펴봅니다. 의지만이 아니라 변화를 돕는 환경을 만드는 법을 생각합니다.", book: "최고의 변화는 어디서 시작되는가", author: "벤저민 하디" },
      { title: "습관", question: "나는 나를 어떻게 만들어가는가?", description: "반복되는 작은 선택이 지금의 나를 어떻게 만들었는지 읽어봅니다. 오래 이어갈 수 있는 좋은 루틴과 습관의 조건을 찾아갑니다.", book: "아주 작은 습관의 힘", author: "제임스 클리어" },
      { title: "도전", question: "두려워도 해볼 수 있을까?", description: "두려움이 사라질 때까지 기다리지 않고도 움직일 수 있을까요. 최근의 도전과 망설임을 나누며 가장 작은 실행을 정합니다.", book: "회복탄력성", author: "김주환" }
    ]
  },
  {
    slug: "emotion",
    name: "마음·감정",
    subtitle: "마음을 다루는 법",
    coreQuestion: "내 마음과 어떻게 살아갈 것인가?",
    summary: "불안과 감정, 결핍과 행복을 읽으며 마음과 함께 살아가는 방법을 배웁니다.",
    introduction: "불안이 생기는 이유부터 채워지지 않는 욕망과 행복의 의미까지, 감정이 보내는 신호를 이해합니다.",
    keywords: ["불안", "감정", "결핍", "행복"],
    sessions: [
      { title: "불안", question: "나는 왜 불안한가?", description: "불안이 찾아오는 순간과 그 아래 놓인 두려움을 바라봅니다. 없애려 하기보다 불안이 내게 알려주는 것을 천천히 읽어봅니다.", book: "불안", author: "알랭 드 보통" },
      { title: "감정", question: "감정은 나의 적일까?", description: "좋고 나쁜 감정으로 나누기 전에 각각의 감정이 필요한 이유를 생각합니다. 마음에 이름을 붙이고 감정과 함께 살아가는 법을 연습합니다.", book: "감정은 어떻게 만들어지는가?", author: "리사 펠드먼 배럿" },
      { title: "결핍", question: "나는 왜 채워지지 않는가?", description: "계속 무언가를 원하게 되는 마음과 채워지지 않는 느낌을 들여다봅니다. 욕망이 나를 움직이는 순간과 지배하는 순간을 구분합니다.", book: "내면소통", author: "김주환" },
      { title: "행복", question: "행복은 무엇인가?", description: "즐거움과 만족, 평온함 사이에서 내가 말하는 행복의 모습을 찾아봅니다. 행복해야 한다는 압박 없이 지금의 좋은 감정을 발견합니다.", book: "행복의 기원", author: "서은국" }
    ]
  },
  {
    slug: "life",
    name: "삶",
    subtitle: "좋은 삶을 사는 법",
    coreQuestion: "나는 어떤 삶을 살아야 하는가?",
    summary: "휴식과 놀이, 삶의 균형과 죽음을 통해 내가 원하는 삶의 형태를 그려봅니다.",
    introduction: "잘 쉬는 법과 즐거움, 바쁘게 살아가는 이유와 유한한 시간까지 바라보며 내가 만들고 싶은 삶의 모양을 생각합니다.",
    keywords: ["휴식", "놀이", "균형", "삶의 방향"],
    sessions: [
      { title: "휴식", question: "우리는 왜 쉬어야 하는가?", description: "멈추는 시간을 낭비로 여기지는 않았는지 돌아봅니다. 나를 회복시키는 쉼과 쉬어도 쉬지 못하는 순간의 차이를 찾아갑니다.", book: "이토록 멋진 휴식", author: "존 피치, 맥스 프렌젤" },
      { title: "균형", question: "잘 산다는 것은 무엇인가?", description: "일과 휴식, 성취와 만족이 내 삶에서 어떤 비율을 이루는지 살펴봅니다. 바쁘게 사는 것과 잘 사는 것의 차이를 묻습니다.", book: "4000주", author: "올리버 버크먼" },
      { title: "놀이", question: "나는 무엇을 하며 즐거워하는가?", description: "목적이나 성과 없이도 마음이 움직이는 활동을 떠올립니다. 취미와 놀이가 삶을 넓히고 다시 살아갈 힘을 주는 순간을 나눕니다.", book: "플레이, 즐거움의 발견", author: "스튜어트 브라운" },
      { title: "삶의 방향", question: "지금 시대에 좋은 삶이란 무엇인가?", description: "많이 가지는 삶과 의미 있는 삶 사이에서 나의 기준을 세웁니다. 유한한 시간을 떠올리며 지금 선택하고 싶은 삶의 모습을 그립니다.", book: "죽음의 수용소에서", author: "빅터 프랭클" }
    ]
  },
  {
    slug: "work",
    name: "일·몰입",
    subtitle: "나의 일을 만드는 법",
    coreQuestion: "나는 무엇에 몰입하며 살아가는가?",
    summary: "일의 의미와 선택, 시대의 변화와 몰입을 지나 나에게 좋은 일이 무엇인지 묻습니다.",
    introduction: "좋아하는 일과 잘하는 일 사이의 선택부터 몰입과 매몰의 차이까지, 일과 나의 관계를 차례로 살펴봅니다.",
    keywords: ["일의 의미", "선택", "시대", "몰입"],
    sessions: [
      { title: "일의 의미", question: "나는 왜 일하는가?", description: "생존과 성취, 인정과 의미가 일 안에서 어떻게 얽혀 있는지 살펴봅니다. 직업이 나를 어디까지 설명해야 하는지도 함께 묻습니다.", book: "왜 일하는가", author: "이나모리 가즈오" },
      { title: "선택", question: "좋아하는 일을 해야 행복할까?", description: "좋아하는 일과 잘하는 일, 현실적인 선택 사이의 긴장을 이야기합니다. 일에서 행복을 찾아야 하는지 나에게 좋은 일은 무엇인지 생각합니다.", book: "열정의 배신", author: "칼 뉴포트" },
      { title: "시대", question: "시대가 바뀌면 일도 바뀌어야 할까?", description: "기술과 AI가 바꾸는 일의 모습을 바라보며 무엇을 준비할지 묻습니다. 시대를 따르는 일과 내가 원하는 일을 지키는 것 사이를 탐색합니다.", book: "일하는 마음", author: "제현주" },
      { title: "몰입", question: "우리는 왜 일에 몰입하는가?", description: "집중이 만들어내는 기쁨과 성취를 살피는 동시에 몰입과 매몰의 차이를 생각합니다. 일과 나를 건강하게 연결하고 분리하는 법을 찾습니다.", book: "딥 워크", author: "칼 뉴포트" }
    ]
  }
] as const satisfies readonly Theme[];

export const currentTheme = themes[0];

export function findTheme(slug: string) {
  return themes.find((theme) => theme.slug === slug);
}
