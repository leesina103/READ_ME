"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CommunityCategory = "books" | "writing";
export type CommunityPostActionState = { status: "idle" | "error"; message: string };
type ValidatedPost = {
  category: CommunityCategory;
  title: string;
  content: string;
  bookTitle: string;
  bookAuthor: string;
  externalUrl: string;
};
type ValidationResult = { post: ValidatedPost } | { error: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseCategory(value: string): CommunityCategory | null {
  return value === "books" || value === "writing" ? value : null;
}

function validExternalUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validatePost(formData: FormData): ValidationResult {
  const category = parseCategory(textValue(formData, "category"));
  const title = textValue(formData, "title");
  const content = textValue(formData, "content");
  const bookTitle = textValue(formData, "bookTitle");
  const bookAuthor = textValue(formData, "bookAuthor");
  const externalUrl = textValue(formData, "externalUrl");

  if (!category) return { error: "글 분류를 선택해 주세요." };
  if (title.length < 2 || title.length > 120) return { error: "제목은 2자 이상 120자 이하로 입력해 주세요." };
  if (content.length < 2 || content.length > 5000) return { error: "본문은 2자 이상 5000자 이하로 입력해 주세요." };
  if (category === "books" && (!bookTitle || bookTitle.length > 160 || !bookAuthor || bookAuthor.length > 100)) {
    return { error: "인생책의 책 제목과 저자를 입력해 주세요." };
  }
  if (externalUrl.length > 1000 || !validExternalUrl(externalUrl)) return { error: "외부 링크는 http 또는 https 주소로 입력해 주세요." };

  return { post: { category, title, content, bookTitle, bookAuthor, externalUrl } };
}

function databaseErrorMessage(code?: string) {
  return code === "PGRST202" || code === "42P01"
    ? "커뮤니티 데이터베이스 마이그레이션 적용이 필요합니다."
    : "글을 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
}

export async function createCommunityPostAction(
  _previousState: CommunityPostActionState,
  formData: FormData
): Promise<CommunityPostActionState> {
  const validation = validatePost(formData);
  if ("error" in validation) return { status: "error", message: validation.error };
  const post = validation.post;
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { data: postId, error } = await supabase.rpc("create_community_post", {
    p_category: post.category,
    p_title: post.title,
    p_content: post.content,
    p_book_title: post.bookTitle,
    p_book_author: post.bookAuthor,
    p_external_url: post.externalUrl
  });

  if (error || typeof postId !== "number") return { status: "error", message: databaseErrorMessage(error?.code) };

  revalidatePath("/membership/community");
  redirect(`/membership/community/${postId}`);
}

export async function updateCommunityPostAction(
  _previousState: CommunityPostActionState,
  formData: FormData
): Promise<CommunityPostActionState> {
  const postId = Number(textValue(formData, "postId"));
  const validation = validatePost(formData);
  if (!Number.isInteger(postId) || postId < 1) return { status: "error", message: "잘못된 게시물입니다." };
  if ("error" in validation) return { status: "error", message: validation.error };
  const post = validation.post;
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { error } = await supabase.rpc("update_community_post", {
    p_post_id: postId,
    p_category: post.category,
    p_title: post.title,
    p_content: post.content,
    p_book_title: post.bookTitle,
    p_book_author: post.bookAuthor,
    p_external_url: post.externalUrl
  });

  if (error) return { status: "error", message: databaseErrorMessage(error.code) };

  revalidatePath("/membership/community");
  revalidatePath(`/membership/community/${postId}`);
  redirect(`/membership/community/${postId}`);
}

export async function deleteCommunityPostAction(
  _previousState: CommunityPostActionState,
  formData: FormData
): Promise<CommunityPostActionState> {
  const postId = Number(textValue(formData, "postId"));
  const category = parseCategory(textValue(formData, "category")) ?? "books";
  if (!Number.isInteger(postId) || postId < 1) return { status: "error", message: "잘못된 게시물입니다." };
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { error } = await supabase.rpc("delete_community_post", { p_post_id: postId });
  if (error) return { status: "error", message: "글을 삭제하지 못했습니다. 본인이 작성한 글인지 확인해 주세요." };

  revalidatePath("/membership/community");
  redirect(`/membership/community?tab=${category}`);
}
