import { BookOpen, Heart, MessageCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="text-sm tracking-[0.2em] text-[var(--accent-dark)]">ABOUT READ ME</p>
      <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">책을 읽고, 나를 읽습니다.</h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        READ ME는 책을 매개로 자신의 생각과 삶을 돌아보고,
        다른 사람의 관점을 만나며 조금 더 선명한 나를 발견하는 독서모임입니다.
      </p>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {[
          [BookOpen, "READ", "좋은 책을 함께 읽습니다."],
          [MessageCircle, "TALK", "질문을 중심으로 깊게 대화합니다."],
          [Heart, "ME", "읽은 내용을 나의 삶과 연결합니다."]
        ].map(([Icon, title, text]) => {
          const C = Icon as typeof BookOpen;
          return (
            <div key={String(title)} className="rounded-3xl border border-[var(--line)] bg-white p-7">
              <C size={25} className="text-[var(--accent-dark)]" />
              <h2 className="mt-8 text-xl font-semibold">{String(title)}</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">{String(text)}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
