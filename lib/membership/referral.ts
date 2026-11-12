export const referralSources = ["인스타그램", "에브리타임", "지인 소개", "블로그", "기타"] as const;

export function validateReferral(sources: string[], other: string): string | null {
  if (sources.length === 0) return "READ ME를 알게 된 경로를 하나 이상 선택해 주세요.";
  if (sources.length > referralSources.length || sources.some((source) => !referralSources.some((option) => option === source))) {
    return "유입 경로를 다시 선택해 주세요.";
  }
  if (sources.includes("기타") && (other.trim().length === 0 || other.trim().length > 200)) {
    return "기타 경로를 1~200자로 작성해 주세요.";
  }
  return null;
}
