import Link from "next/link";
import { ArrowRight, BookHeart, NotebookPen, PenLine } from "lucide-react";
import { CommunityDataError } from "@/components/CommunityDataError";
import { createClient } from "@/lib/supabase/server";

const communityTabs = {
  books: { icon: BookHeart, label: "인생책 소개", description: "내 삶에 오래 남은 책과 그 이유를 멤버들에게 소개하는 공간입니다.", empty: "아직 소개된 인생책이 없어요." },
  writing: { icon: NotebookPen, label: "글 공유", description: "직접 쓴 글이나 함께 읽고 싶은 외부 글을 편하게 나누는 공간입니다.", empty: "아직 공유된 글이 없어요." }
} as const;

type CommunityPageProps = { searchParams: Promise<{ tab?: string; page?: string }> };

const pageSize = 20;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const query = await searchParams;
  const requestedTab = query.tab;
  const activeTab = requestedTab === "writing" ? "writing" : "books";
  const parsedPage = Number(query.page);
  const currentPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 100_000 ? parsedPage : 1;
  const firstPostIndex = (currentPage - 1) * pageSize;
  const active = communityTabs[activeTab];
  const ActiveIcon = active.icon;
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("community_posts")
    .select("id, display_name, cohort, title, content, book_title, book_author, created_at")
    .eq("category", activeTab)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(firstPostIndex, firstPostIndex + pageSize);
  const visiblePosts = posts?.slice(0, pageSize) ?? [];
  const hasNextPage = (posts?.length ?? 0) > pageSize;
  const pageHref = (page: number) => `/membership/community?tab=${activeTab}&page=${page}`;
  const migrationMissing = error?.code === "42P01" || error?.code === "PGRST205";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div><p className="eyebrow">MEMBERSHIP COMMUNITY</p><h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">읽고 쓴 것을 나누는 곳</h1><p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">기수를 넘어 서로의 책과 글을 발견하는 멤버십 커뮤니티입니다.</p></div>
        <Link href={`/membership/community/new?category=${activeTab}`} className="button button--primary"><PenLine size={16} /> 글쓰기</Link>
      </div>
      <nav className="mt-9 flex flex-wrap gap-2" aria-label="커뮤니티 분류">
        {Object.entries(communityTabs).map(([key, tab]) => <Link key={key} href={`/membership/community?tab=${key}`} aria-current={activeTab === key ? "page" : undefined} className={`rounded-full border px-5 py-3 text-sm font-semibold ${activeTab === key ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--cream)]" : "border-[var(--line)] bg-[var(--paper)]"}`}>{tab.label}</Link>)}
      </nav>
      <section className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <ActiveIcon className="text-[var(--forest)]" size={26} /><h2 className="mt-6 text-2xl font-semibold">{active.label}</h2><p className="mt-3 leading-7 text-[var(--muted)]">{active.description}</p>
        {error ? (
          <CommunityDataError
            className="mt-8"
            message={migrationMissing ? "커뮤니티 데이터베이스 마이그레이션 적용이 필요합니다." : "게시물을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요."}
          />
        ) : visiblePosts.length > 0 ? (
          <>
            <ol className="mt-8 border-t border-[var(--line)]">{visiblePosts.map((post) => <li key={post.id} className="border-b border-[var(--line)]"><Link href={`/membership/community/${post.id}`} className="group flex items-center justify-between gap-5 py-6"><div className="min-w-0">{activeTab === "books" && post.book_title && <p className="mb-2 text-xs font-bold tracking-[.08em] text-[var(--forest)]">『{post.book_title}』 {post.book_author}</p>}<h3 className="truncate text-lg font-semibold">{post.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{post.content}</p><p className="mt-3 text-xs text-[var(--muted)]">{post.display_name} · {post.cohort} · {formatDate(post.created_at)}</p></div><ArrowRight className="shrink-0 text-[var(--forest)]" size={17} /></Link></li>)}</ol>
            {(currentPage > 1 || hasNextPage) && <nav className="mt-6 flex items-center justify-between gap-4" aria-label="커뮤니티 페이지 이동"><div>{currentPage > 1 && <Link href={pageHref(currentPage - 1)} className="button button--ghost">이전</Link>}</div><p className="text-sm text-[var(--muted)]">{currentPage}페이지</p><div>{hasNextPage && <Link href={pageHref(currentPage + 1)} className="button button--ghost">다음</Link>}</div></nav>}
          </>
        ) : <div className="mt-8 border-t border-[var(--line)] pt-6"><p className="text-sm text-[var(--muted)]">{currentPage > 1 ? "이 페이지에 표시할 글이 없어요." : active.empty}</p>{currentPage > 1 ? <Link href={pageHref(currentPage - 1)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest)]">이전 페이지로 <ArrowRight size={15} /></Link> : <Link href={`/membership/community/new?category=${activeTab}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest)]">첫 글 작성하기 <ArrowRight size={15} /></Link>}</div>}
      </section>
    </main>
  );
}
