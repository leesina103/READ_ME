// 기수별 파티 초대장 내용.
// 아직 운영자 화면이나 DB가 없어서 여기에 직접 적는다. 기본값을 두고 기수별로 필요한 항목만 덮어쓴다.
// 나중에 DB로 옮길 때는 PartyInvitation 모양만 유지하면 페이지는 그대로 쓸 수 있다.

export type PartyStatus = "draft" | "open" | "closed";

export type PartyStep = { title: string; description: string };
export type PartyPerk = { icon: "meal" | "record" | "gift"; title: string; description: string };
export type PartyTimelineItem = { time: string; title: string; description: string };
export type PartyFaq = { question: string; answer: string };

export type PartyInvitation = {
  // draft: 일정 확정 전. open: 참석 신청 받는 중. closed: 신청 마감.
  status: PartyStatus;
  // 표지 제목. 배열 한 칸이 한 줄.
  title: readonly string[];
  tagline: string;
  // ISO 문자열. 확정 전이면 null.
  startsAt: string | null;
  venue: { name: string; address: string; mapHref: string | null } | null;
  invitees: string;
  story: { title: readonly string[]; paragraphs: readonly string[] };
  program: { title: readonly string[]; lead: string; steps: readonly PartyStep[] };
  perks: readonly PartyPerk[];
  timeline: readonly PartyTimelineItem[];
  faqs: readonly PartyFaq[];
  fee: { amount: string; note: string };
  rsvp: { label: string; href: string | null; note: string };
};

const defaultInvitation: PartyInvitation = {
  status: "open",
  title: ["마지막 장을", "함께 넘기는 밤"],
  tagline: "여덟 주 동안 읽고, 쓰고, 나눈 이야기를 한자리에서 마무리해요.",
  startsAt: "2026-11-28T18:00:00+09:00",
  venue: { name: "성수동의 작은 서재", address: "서울 성동구 · 상세 주소는 참석 확정 후 안내", mapHref: null },
  invitees: "이번 기수 멤버 전원",
  story: {
    title: ["같은 책을 읽었지만,", "다른 문장을 남긴 사람들"],
    paragraphs: [
      "격주로 만나 책을 읽고, 질문에 답하고, 삶에 적용해 본 시간이 여덟 주를 채웠어요.",
      "같은 페이지를 넘겼지만 각자 밑줄을 그은 문장은 달랐고, 그 차이가 우리 대화를 깊게 만들었죠.",
      "마지막 장은 책이 아닌 서로에게 남기려 해요. 기수의 끝을 기념하는 이 밤에 함께해 주세요."
    ]
  },
  program: {
    title: ["그날 밤은", "이렇게 흘러가요"],
    lead: "발표도 준비물도 없어요. 편한 마음으로 오셔서 이야기를 나누면 충분합니다.",
    steps: [
      { title: "다시 꺼내는 질문", description: "네 번의 세션에서 가장 오래 남은 질문 하나를 각자 골라 와요. 그 질문이 첫 대화의 문을 열어요." },
      { title: "서로에게 남기는 한 문장", description: "함께 읽은 시간 동안 고마웠던 사람에게 짧은 문장을 남겨요. 그날 받은 문장은 기수 기록집에 담아드려요." },
      { title: "다음 장을 여는 이야기", description: "다음 기수의 주제와 앞으로 이어질 멤버 활동을 소개해요. 헤어지기 전, 다음에 만날 자리를 함께 그려요." }
    ]
  },
  perks: [
    { icon: "meal", title: "가벼운 식사와 음료", description: "저녁을 겸할 수 있는 식사와 음료를 준비해요. 술은 마실 사람만, 편하게." },
    { icon: "record", title: "기수 기록집", description: "여덟 주 동안 온라인 대화방에 남긴 글 가운데 몇 편을 골라 작은 책으로 엮어 드려요." },
    { icon: "gift", title: "다음 책 한 권", description: "이번 주제와 이어지는 책 한 권을 골라 선물로 준비했어요. 어떤 책인지는 그날 공개." }
  ],
  timeline: [
    { time: "18:00", title: "입장과 인사", description: "먼저 도착한 멤버들과 가볍게 인사하며 자리를 잡아요." },
    { time: "18:30 — 20:30", title: "본 파티", description: "질문을 다시 꺼내고, 한 문장을 나누고, 다음 장을 여는 두 시간." },
    { time: "20:30 — 22:00", title: "자유로운 대화", description: "자리에 얽매이지 않고 오가며 못 나눈 이야기를 이어가요." }
  ],
  faqs: [
    { question: "세션에 몇 번 빠졌는데 참석해도 되나요?", answer: "네. 이번 기수 멤버라면 누구든 환영이에요. 오랜만에 보는 얼굴이 오히려 더 반가울 거예요." },
    { question: "참석 신청은 어떻게 하나요?", answer: "아래 참석 신청 버튼으로 신청해 주세요. 안내에 따라 참여비를 보내주시면 참석이 확정돼요." },
    { question: "신청 후 취소하면 참여비는 어떻게 되나요?", answer: "파티 3일 전까지는 전액 돌려드려요. 그 이후에는 식사 준비가 끝나 환불이 어려우니 미리 알려주세요." }
  ],
  fee: { amount: "50,000원", note: "식사와 음료, 기수 기록집이 포함된 참여비예요." },
  rsvp: { label: "참석 신청하기", href: null, note: "신청 후 안내에 따라 참여비를 보내주시면 참석이 확정돼요." }
};

// 기수별로 다르게 쓸 항목만 적는다. 없는 기수는 기본값을 그대로 쓴다.
const cohortInvitations: Readonly<Record<number, Partial<PartyInvitation>>> = {
  1: {}
};

export function partyInvitationForCohort(cohortNumber: number): PartyInvitation {
  return { ...defaultInvitation, ...cohortInvitations[cohortNumber] };
}
