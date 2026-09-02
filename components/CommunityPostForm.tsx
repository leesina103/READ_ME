"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createCommunityPostAction,
  updateCommunityPostAction,
  type CommunityCategory,
  type CommunityPostActionState
} from "@/app/membership/community-actions";

const initialState: CommunityPostActionState = { status: "idle", message: "" };

type CommunityPostFormProps = {
  mode: "create" | "edit";
  initial?: {
    id: number;
    category: CommunityCategory;
    title: string;
    content: string;
    bookTitle: string;
    bookAuthor: string;
    externalUrl: string;
  };
  initialCategory?: CommunityCategory;
};

export function CommunityPostForm({ mode, initial, initialCategory = "books" }: CommunityPostFormProps) {
  const [category, setCategory] = useState<CommunityCategory>(initial?.category ?? initialCategory);
  const action = mode === "create" ? createCommunityPostAction : updateCommunityPostAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-10 space-y-6">
      {initial && <input type="hidden" name="postId" value={initial.id} />}
      <label className="block text-sm font-medium">글 분류
        <select name="category" value={category} onChange={(event) => setCategory(event.target.value as CommunityCategory)} className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]">
          <option value="books">인생책 소개</option><option value="writing">글 공유</option>
        </select>
      </label>

      {category === "books" && <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">책 제목<input name="bookTitle" defaultValue={initial?.bookTitle} maxLength={160} required className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" placeholder="책 제목" /></label>
        <label className="block text-sm font-medium">저자<input name="bookAuthor" defaultValue={initial?.bookAuthor} maxLength={100} required className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" placeholder="저자 이름" /></label>
      </div>}

      <label className="block text-sm font-medium">제목<input name="title" defaultValue={initial?.title} minLength={2} maxLength={120} required className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" placeholder={category === "books" ? "이 책을 소개하고 싶은 이유" : "공유할 글의 제목"} /></label>
      <label className="block text-sm font-medium">본문<textarea name="content" defaultValue={initial?.content} minLength={2} maxLength={5000} required className="mt-2 min-h-64 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 leading-7 outline-none focus:border-[var(--forest)]" placeholder="멤버들과 나누고 싶은 이야기를 적어주세요." /></label>

      {category === "writing" && <label className="block text-sm font-medium">외부 글 링크 <span className="font-normal text-[var(--muted)]">(선택)</span><input type="url" name="externalUrl" defaultValue={initial?.externalUrl} maxLength={1000} className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" placeholder="https://" /></label>}

      {state.message && <p role="status" className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm leading-6">{state.message}</p>}
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={pending} className="button button--primary disabled:opacity-50">{pending ? "저장 중..." : mode === "create" ? "글 등록하기" : "수정 내용 저장"}</button><Link href={initial ? `/membership/community/${initial.id}` : `/membership/community?tab=${category}`} className="button button--ghost">취소</Link></div>
    </form>
  );
}
