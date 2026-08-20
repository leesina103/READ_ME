import { BookOpen, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { RemiGuide } from "@/components/RemiGuide";

const principles = [
  [BookOpen, "READ", "정해진 책을 읽고, 마음에 남은 한 문장을 표시합니다."],
  [MessageCircle, "QUESTION", "책의 내용을 확인하는 대신 내 삶과 연결된 질문을 만듭니다."],
  [Heart, "TOGETHER", "서로의 말을 고치지 않고, 다름이 생기는 지점을 함께 바라봅니다."]
] as const;

export default function AboutPage() {
  return <main>
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-28"><div><p className="eyebrow">ABOUT READ ME</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-[-0.04em] md:text-7xl">책을 읽고,<br /><span className="text-[var(--forest)]">나를 읽습니다.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">READ ME는 책을 매개로 자신의 생각과 삶을 돌아보고, 다른 사람의 관점을 만나며 조금 더 선명한 나를 발견하는 독서모임입니다.</p></div><RemiGuide compact /></section>
    <section className="bg-[var(--paper)] px-6 py-24"><div className="mx-auto max-w-6xl"><p className="eyebrow">OUR WAY</p><h2 className="mt-4 text-3xl font-semibold md:text-5xl">완독 경쟁 대신, 질문의 깊이</h2><div className="mt-12 grid gap-4 md:grid-cols-3">{principles.map(([Icon,title,text]) => <article key={title} className="rounded-[28px] border border-[var(--line)] bg-[var(--cream)] p-7"><Icon className="text-[var(--forest)]" size={25}/><h3 className="mt-10 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-[var(--muted)]">{text}</p></article>)}</div></div></section>
    <section className="px-6 py-24"><div className="mx-auto max-w-4xl rounded-[32px] border border-[var(--line)] p-8 md:p-12"><ShieldCheck className="text-[var(--forest)]"/><h2 className="mt-6 text-3xl font-semibold">안전한 대화를 위한 약속</h2><ul className="mt-7 grid gap-4 text-[var(--muted)] md:grid-cols-2"><li>말할 권리와 말하지 않을 권리를 존중해요.</li><li>개인의 이야기는 모임 밖으로 옮기지 않아요.</li><li>조언보다 질문으로 서로를 만나요.</li><li>정답보다 다양한 관점을 환영해요.</li></ul></div></section>
  </main>;
}
