import Link from "next/link";
import { ArrowLeft, BookHeart, ExternalLink, PenLine } from "lucide-react";
import { notFound } from "next/navigation";
import { CommunityPostDeleteForm } from "@/components/CommunityPostDeleteForm";
import { createClient } from "@/lib/supabase/server";

type CommunityPostPageProps = { params: Promise<{ postId: string }> };
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

export default async function CommunityPostPage({ params }: CommunityPostPageProps) {
  const postId = Number((await params).postId);
  if (!Number.isInteger(postId) || postId < 1) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: post } = await supabase.from("community_posts").select("id, user_id, display_name, cohort, category, title, content, book_title, book_author, external_url, created_at").eq("id", postId).maybeSingle();
  if (!post) notFound();
  const category = post.category === "writing" ? "writing" : "books";
  const isOwner = user?.id === post.user_id;

  return <main className="mx-auto max-w-3xl px-6 py-16 md:py-24"><Link href={`/membership/community?tab=${category}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={16} /> {category === "books" ? "인생책 소개" : "글 공유"}</Link><article className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9 md:p-10"><p className="eyebrow">{category === "books" ? "LIFE-CHANGING BOOK" : "SHARED WRITING"}</p>{category === "books" && post.book_title && <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4"><BookHeart className="mt-0.5 shrink-0 text-[var(--forest)]" size={19} /><p className="m-0 font-semibold">《{post.book_title}》 <span className="font-normal text-[var(--muted)]">{post.book_author}</span></p></div>}<h1 className="mt-7 font-serif text-4xl font-medium leading-tight tracking-[-0.04em]">{post.title}</h1><p className="mt-4 text-sm text-[var(--muted)]">{post.display_name} · {post.cohort} · {formatDate(post.created_at)}</p><div className="mt-9 whitespace-pre-wrap border-t border-[var(--line)] pt-8 leading-8">{post.content}</div>{post.external_url && <a href={post.external_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[var(--cream)] px-5 py-4 text-sm font-semibold text-[var(--forest)]">공유한 글 열기 <ExternalLink size={15} /></a>}{isOwner && <div className="mt-10 flex flex-wrap gap-3 border-t border-[var(--line)] pt-6"><Link href={`/membership/community/${post.id}/edit`} className="button button--primary"><PenLine size={15} /> 수정</Link><CommunityPostDeleteForm postId={post.id} category={category} /></div>}</article></main>;
}
