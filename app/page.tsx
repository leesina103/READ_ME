import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, Sprout } from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";

const sessions = [
  { number: "01", title: "관계", description: "우리는 서로를 어떻게 이해하고 존중하는가?" },
  { number: "02", title: "나", description: "나는 어떤 사람이고, 무엇을 원하는가?" },
  { number: "03", title: "변화", description: "변하고 싶은 마음과 실제 변화 사이에서" },
  { number: "04", title: "마음", description: "감정을 이해하고 나를 돌보는 방법" }
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl items-center px-6 py-20">
        <div className="grid w-full gap-14 md:grid-cols-[1.15fr_.85fr] md:items-center">
          <div>
            <p className="mb-6 text-sm font-medium tracking-[0.25em] text-[var(--accent-dark)]">
              READ ME
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.12] tracking-[-0.04em] md:text-7xl">
              Read books.
              <br />
              <span className="text-[var(--accent-dark)]">Read yourself.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
              책을 읽는 것에서 끝나지 않습니다.
              <br />
              한 권의 책을 통해 나를 돌아보고, 서로의 생각을 나누는 독서모임입니다.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/meeting"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
              >
                모임 둘러보기 <ArrowRight size={16} />
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              >
                READ ME 알아보기
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-[40%] bg-[#e9efe6]">
            <div className="absolute inset-8 rounded-[40%] border border-white/80" />
            <div className="relative flex flex-col items-center">
              <div className="mb-5 flex h-36 w-36 items-center justify-center rounded-[38%] bg-white shadow-sm">
                <BookOpen size={64} strokeWidth={1.25} className="text-[var(--accent-dark)]" />
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Sprout size={17} className="text-[var(--accent-dark)]" />
                읽고, 생각하고, 이야기해요.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="WHY READ ME"
            title="책보다 중요한 것은,"
            description="책을 읽은 뒤 내 안에 남는 질문이라고 생각합니다."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["읽기", "좋은 책을 함께 읽고"],
              ["생각하기", "내 생각을 천천히 들여다보고"],
              ["이야기하기", "서로의 관점을 나눕니다"]
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-[var(--line)] p-7">
                <p className="text-sm text-[var(--accent-dark)]">{title}</p>
                <p className="mt-3 text-xl font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="READ ME CURRICULUM"
            title="한 기수, 네 번의 질문"
            description="기수마다 하나의 주제를 정하고 네 번의 모임을 통해 깊이 있게 이야기합니다."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {sessions.map((session) => (
              <div key={session.number} className="rounded-3xl bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,.04)]">
                <span className="text-xs text-[var(--muted)]">{session.number}</span>
                <h3 className="mt-8 text-2xl font-semibold">{session.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{session.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/meeting" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-dark)]">
              전체 모임 보기 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--foreground)] px-6 py-24 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <MessageCircle className="mx-auto mb-5 opacity-70" size={28} />
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            오늘, 어떤 질문을
            <br />
            나에게 던져볼까요?
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/60">
            READ ME에서 책과 사람, 그리고 나에 대해 이야기해요.
          </p>
          <Link
            href="/meeting"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-[var(--foreground)]"
          >
            다음 모임 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
