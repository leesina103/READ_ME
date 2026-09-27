// 멤버십 초대장(/invitation, /invitation/[기수]) 경로인지 판단한다.
// 초대장은 독립 문서처럼 보여야 해서 Header와 Footer가 이 판정으로 내비게이션을 숨긴다.
export function isInvitationPath(pathname: string) {
  return pathname === "/invitation" || pathname.startsWith("/invitation/");
}
