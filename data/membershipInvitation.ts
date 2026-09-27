type MembershipInvitation = {
  meeting: { cohort: string; schedule: { duration: string }; facts: { label: string; value: string }[] };
  theme: { name: string; coreQuestion: string; introduction: string; sessions: { title: string; question: string; book: string; author: string }[] };
  regularFee: string;
  fee: string;
  bank: string;
  account: string;
  accountHolder: string;
  paymentDeadline: string | null;
  refundPolicy: string;
  feeLabel: string;
  feeDescription: string;
};

// 현재 모집 정보가 바뀌어도 발송한 초대장은 유지합니다. 새 기수는 별도 항목으로 추가합니다.
export const membershipInvitations: Readonly<Record<string, MembershipInvitation>> = {
  "1": {
  meeting: {
    cohort: "1기",
    schedule: { duration: "8주" },
    facts: [
      { label: "진행 기간", value: "8주 · 2026년 10월부터" },
      { label: "진행 주기", value: "격주" },
      { label: "오프라인 토의", value: "4회" },
      { label: "온라인 실천·기록", value: "4회" },
      { label: "회차별 소요", value: "3시간" },
      { label: "장소", value: "서울 오프라인" },
      { label: "그룹당 인원", value: "4~6명" }
    ]
  },
  theme: {
    name: "관계",
    coreQuestion: "우리는 어떻게 관계 맺는가?",
    introduction: "타인과 나 사이의 거리와 경계, 서로를 듣는 방법, 가까워진다는 것의 의미를 차례로 이야기합니다.",
    sessions: [
      { title: "존중", question: "우리는 서로를 어떻게 존중하는가?", book: "관계의 언어", author: "문요한" },
      { title: "인정", question: "모두에게 좋은 사람이어야 할까?", book: "미움받을 용기", author: "기시미 이치로, 고가 후미타케" },
      { title: "대화", question: "왜 우리는 자꾸 오해하는가?", book: "비폭력대화", author: "마셜 B. 로젠버그" },
      { title: "사랑", question: "가까워진다는 것은 무엇인가?", book: "사랑의 기술", author: "에리히 프롬" }
    ]
  },
  feeLabel: "첫 기수 특별가",
  feeDescription: "READ ME의 첫 시작을 함께하는 1기에게 24만 원에서 8만 원 할인한 금액으로 안내드려요.",
  regularFee: "240,000원",
  fee: "160,000원",
  bank: "우리은행",
  account: "1002260010295",
  accountHolder: "이신아",
  paymentDeadline: null,
  refundPolicy: "기수 시작 8일 전까지: 전액 환불\n기수 시작 7일 전부터 1일 전까지: 참가비의 50% 환불\n기수 시작일부터: 환불 불가"
  }
};
