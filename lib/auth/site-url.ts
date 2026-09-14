export function authCallbackUrl(next: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${siteUrl}/auth/callback?next=${next}`;
}
