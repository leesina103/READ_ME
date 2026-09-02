import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CommunityPostForm } from "@/components/CommunityPostForm";
import { createClient } from "@/lib/supabase/server";

type EditCommunityPostPageProps = { params: Promise<{ postId: string }> };

export default async function EditCommunityPostPage({ params }: EditCommunityPostPageProps) {
  const postId = Number((await params).postId);
  if (!Number.isInteger(postId) || postId < 1) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: post } = await supabase.from("community_posts").select("id, user_id, category, title, content, book_title, book_author, external_url").eq("id", postId).eq("user_id", user.id).maybeSingle();
  if (!post || (post.category !== "books" && post.category !== "writing")) notFound();
  return <main className="mx-auto max-w-3xl px-6 py-16 md:py-24"><Link href={`/membership/community/${post.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={16} /> 게시물로</Link><section className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9 md:p-10"><p className="eyebrow">EDIT COMMUNITY POST</p><h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em]">글 수정</h1><CommunityPostForm mode="edit" initial={{ id: post.id, category: post.category, title: post.title, content: post.content, bookTitle: post.book_title ?? "", bookAuthor: post.book_author ?? "", externalUrl: post.external_url ?? "" }} /></section></main>;
}
