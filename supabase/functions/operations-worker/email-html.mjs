// 참여자 이름과 메시지 초안은 HTML로 해석하지 않고 문자 그대로 표시합니다.
export function emailHtml(text) {
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const headings = new Set(['① 자동 처리 결과', '② 직접 할 일', '③ 보낼 메시지 초안', '④ 다음 행동', '⑤ 다음 메시지 초안']);
  const lines = text.split('\n').map(line => {
    if (headings.has(line)) return `<h2 style="font-size:17px;line-height:1.5;font-weight:700;margin:24px 0 10px;"><strong>${escape(line)}</strong></h2>`;
    if (line === '────────') return '<hr style="margin:28px 0;">';
    if (!line) return '<div style="height:10px;"></div>';
    const content = line.split(/(https?:\/\/[^\s<>]+)/g).map(part => /^https?:\/\//.test(part)
      ? `<a href="${escape(part)}" style="overflow-wrap:anywhere;word-break:break-all;">${escape(part)}</a>` : escape(part)).join('');
    return `<div style="margin:0;overflow-wrap:anywhere;">${content}</div>`;
  }).join('\n');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;"><div style="max-width:680px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;">${lines}</div></body></html>`;
}
