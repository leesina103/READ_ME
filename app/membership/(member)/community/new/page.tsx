import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommunityPostForm } from "@/components/CommunityPostForm";
import type { CommunityCategory } from "@/app/membership/community-actions";

type NewCommunityPostPageProps = { searchParams: Promise<{ category?: string }> };

export default async function NewCommunityPostPage({ searchParams }: NewCommunityPostPageProps) {
  const requestedCategory = (await searchParams).category;
  const category: CommunityCategory = requestedCategory === "writing" ? "writing" : "books";
  return <main className="mx-auto max-w-3xl px-6 py-16 md:py-24"><Link href={`/membership/community?tab=${category}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={16} /> 커뮤니티로</Link><section className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9 md:p-10"><p className="eyebrow">NEW COMMUNITY POST</p><h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em]">새 글 작성</h1><p className="mt-4 leading-7 text-[var(--muted)]">읽고 쓴 이야기를 멤버들과 편하게 나눠주세요.</p><CommunityPostForm mode="create" initialCategory={category} /></section></main>;
}
