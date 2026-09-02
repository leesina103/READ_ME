"use client";

import { useActionState } from "react";
import { deleteCommunityPostAction, type CommunityCategory, type CommunityPostActionState } from "@/app/membership/community-actions";

const initialState: CommunityPostActionState = { status: "idle", message: "" };

export function CommunityPostDeleteForm({ postId, category }: { postId: number; category: CommunityCategory }) {
  const [state, action, pending] = useActionState(deleteCommunityPostAction, initialState);
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm("이 글을 삭제할까요? 삭제한 글은 복구할 수 없습니다.")) event.preventDefault(); }}>
      <input type="hidden" name="postId" value={postId} /><input type="hidden" name="category" value={category} />
      <button type="submit" disabled={pending} className="button button--ghost disabled:opacity-50">{pending ? "삭제 중..." : "삭제"}</button>
      {state.message && <p role="status" className="mt-2 text-sm text-[var(--muted)]">{state.message}</p>}
    </form>
  );
}
