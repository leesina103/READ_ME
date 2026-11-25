import "server-only";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export async function sendAdminReviewEmail(options: {
  subject: string;
  message: string;
  details: string[];
  path: "/admin/roles" | "/admin/applications";
  linkLabel: string;
  idempotencyKey?: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.INTERVIEW_ADMIN_EMAIL?.trim();
  if (!key || !recipient) throw new Error("missing_mail_config");
  const url = new URL(options.path, process.env.INTERVIEW_ADMIN_SITE_URL?.trim() || "https://read-me-two-black.vercel.app");
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("invalid_site_url");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.idempotencyKey && { "Idempotency-Key": options.idempotencyKey })
    },
    body: JSON.stringify({
      from: process.env.INTERVIEW_ADMIN_EMAIL_FROM?.trim() || "READ ME <onboarding@resend.dev>",
      to: [recipient],
      subject: `[READ ME] ${options.subject.replace(/[\r\n]/g, " ")}`,
      text: [options.message, ...options.details, "", options.linkLabel, url.href].join("\n"),
      html: `<p>${escapeHtml(options.message)}</p><p>${options.details.map(escapeHtml).join("<br>")}</p><p><a href="${escapeHtml(url.href)}">${escapeHtml(options.linkLabel)} →</a></p>`
    }),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`mail_http_${response.status}`);
}
