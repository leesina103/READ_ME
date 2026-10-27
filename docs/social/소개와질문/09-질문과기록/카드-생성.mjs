import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
const runtime = path.join(root, 'tmp/question-card-fonts');
await fs.mkdir(path.join(runtime, 'cache'), { recursive: true });
await fs.copyFile(path.join(dir, '../00-모임소개/assets/NanumPenScript-Regular.ttf'), path.join(runtime, 'NanumPenScript-Regular.ttf'));
await fs.writeFile(path.join(runtime, 'fonts.conf'), `<?xml version="1.0"?><fontconfig><dir>${runtime.replaceAll('\\', '/')}</dir><dir>C:/Windows/Fonts</dir><cachedir>${runtime.replaceAll('\\', '/')}/cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = path.join(runtime, 'fonts.conf');
if (process.env.README_QUESTION_FONT_READY !== '1') {
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { stdio: 'inherit', env: { ...process.env, README_QUESTION_FONT_READY: '1' } });
  process.exit(child.status ?? 1);
}
const { default: sharp } = await import('sharp');
const css = await fs.readFile(path.join(root, 'app/globals.css'), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--(cream|sand|sage|forest|ink|paper|muted|line):\s*([^;]+);/g)].map(m => [m[1], m[2]]));
const fontfile = path.join(runtime, 'NanumPenScript-Regular.ttf');
let layers = [], copy = [];
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
async function text(s, y, size = 54, { x = 100, align = 'left', color = 'ink', gothic = true, serif = false } = {}) {
  const buffer = await sharp({ text: { text: `<span foreground="${colors[color]}">${esc(s)}</span>`, font: serif ? `Noto Serif KR Medium ${size}` : gothic ? `Noto Sans KR ${size}` : `Nanum Pen ${size}`, fontfile: serif ? 'C:/Windows/Fonts/NotoSerifKR-VF.ttf' : gothic ? 'C:/Windows/Fonts/NotoSansKR-VF.ttf' : fontfile, rgba: true, dpi: 72, spacing: gothic ? 22 : 14, align } }).png().toBuffer();
  const meta = await sharp(buffer).metadata();
  const left = align === 'center' ? Math.round(x - meta.width / 2) : x;
  if (left < 45 || left + meta.width > 1035 || y + meta.height > 1300) throw Error(`글자 범위 확인: ${s}`);
  layers.push({ input: buffer, left, top: y }); copy.push(s);
}
async function base(n) {
  layers = []; copy = [];
  await text('READ ME', 1250, 26, { color: 'forest' });
  await text(`${n} / 5`, 1250, 26, { x: 920, color: 'muted' });
}
async function save(n) {
  const name = String(n).padStart(2, '0');
  await sharp({ create: { width: 1080, height: 1350, channels: 3, background: colors.cream } }).composite(layers).png().toFile(path.join(dir, `${name}.png`));
  await fs.writeFile(path.join(dir, `${name}.txt`), copy.slice(2).join('\n\n') + '\n');
}

await base(1);
await text('모두에게\n좋은 사람이어야 할까?', 150, 72, { color: 'forest', serif: true });
await text('내 일정도 빠듯한데 부탁을 받았어요.\n거절하면 서운해할 것 같고,\n들어주자니 내가 힘들 것 같아요.', 515, 43);
await text('여러분은 이럴 때\n어떻게 하나요?', 880, 48, { color: 'forest' });
await save(1);

await base(2);
await text('상대의 기대는\n어디까지 내 몫일까요?', 150, 72, { color: 'forest', serif: true });
await text('『미움받을 용기』', 425, 43, { color: 'forest' });
await text('기시미 이치로 · 고가 후미타케', 495, 29, { color: 'muted' });
await text('타인의 인정을 바라는 마음과\n나의 과제, 타인의 과제를\n구분하는 이야기를 다룹니다.', 600, 43);
await text('여기서 우리의 일상을 떠올려봅니다.', 880, 32, { color: 'muted' });
await text('좋은 사람이 되고 싶어서\n내키지 않는 부탁을 받아준 적이 있나요?', 955, 40, { color: 'forest' });
await text('책의 개념을 바탕으로 구성한 질문이며,\n직접 인용이 아닙니다.', 1135, 26, { color: 'muted' });
await save(2);

layers = []; copy = [];
await text('READ ME', 1250, 26, { x: 100, align: 'left', color: 'forest', gothic: true });
await text('3 / 5', 1250, 26, { x: 920, align: 'left', color: 'muted', gothic: true });
await text('거절하면 관계가\n멀어질 것 같았어요.', 150, 72, { x: 100, align: 'left', color: 'forest', gothic: true, serif: true });
await text('토의 전 내가 생각한 답', 415, 29, { x: 100, align: 'left', color: 'muted', gothic: true });
await text('내가 조금 무리하면 되는 일이니까\n웬만하면 들어주는 편이에요.', 515, 43, { x: 100, align: 'left', gothic: true });
await text('그런데 그러고 나면 가끔은\n상대가 내 사정도\n알아줬으면 싶어요.', 755, 43, { x: 100, align: 'left', gothic: true });
await text('운영자가 작성한 가상 답변 예시', 1165, 26, { x: 100, align: 'left', color: 'muted', gothic: true });
await save(3);

await base(4);
await text('내 사정을 말하는 것도\n관계에 필요한 일 아닐까요?', 150, 64, { color: 'forest', serif: true });
await text('오늘 새로 들은 관점', 415, 29, { color: 'muted' });
await text('“말하지 않으면 상대는\n내가 무리하고 있는지 모를 수도 있어요.”', 515, 40);
await text('이 말을 듣고 이런 생각이 들었어요.', 750, 32, { color: 'muted' });
await text('나는 거절하는 것과\n상대를 소중히 여기지 않는 것을\n같은 뜻으로 생각했나?', 835, 43, { color: 'forest' });
await text('운영자가 작성한 가상 대화·기록 예시', 1165, 26, { color: 'muted' });
await save(4);

await base(5);
await text('바로 “네”라고 하기 전에,\n내 일정을 한 번 살펴보기.', 150, 64, { color: 'forest', serif: true });
await text('다음 주에 살펴볼 행동이나 질문', 395, 29, { color: 'muted' });
await text('다음에 부탁을 받으면\n“일정 확인하고 답할게”라고 말해보려고요.', 475, 39);
await text('그때 어떤 마음이 드는지,\n상대는 어떻게 반응하는지 적어볼래요.', 645, 39);
await text('운영자가 작성한 가상 기록 예시', 805, 26, { color: 'muted' });
await text('여러분이라면 어떤 답을 적고 싶나요?', 925, 36, { color: 'forest' });
await text('READ ME에서는 책에서 시작한 질문을\n나의 일상으로 이어갑니다.', 1005, 33);
await text('모임 안내는 프로필 상단의\n소개 게시물에서 확인해 주세요.', 1135, 28, { color: 'muted' });
await save(5);

const thumbs = [];
for (let i = 1; i <= 5; i++) thumbs.push({ input: await sharp(path.join(dir, `${String(i).padStart(2, '0')}.png`)).resize(432, 540).toBuffer(), left: ((i - 1) % 3) * 448 + 16, top: Math.floor((i - 1) / 3) * 556 + 16 });
await sharp({ create: { width: 1360, height: 1128, channels: 3, background: colors.sand } }).composite(thumbs).png().toFile(path.join(dir, '한눈에보기.png'));
const caption = await fs.readFile(path.join(dir, '게시물-캡션.txt'), 'utf8');
const tokens = Object.entries(colors).map(([k, v]) => `--${k}:${v}`).join(';');
await fs.writeFile(path.join(dir, '미리보기.html'), `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>READ ME 질문과 기록 · 5장 시안</title><style>:root{${tokens}}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:sans-serif}main{max-width:1500px;margin:auto;padding:24px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}img{display:block;width:100%;height:auto}a{color:var(--forest)}@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){main{padding:16px}.grid{grid-template-columns:1fr}}</style><main><h1>질문과 기록 · 5장 시안</h1><p>1080 × 1350 · 운영자가 작성한 가상 예시</p><div class="grid">${Array.from({ length: 5 }, (_, i) => `<a href="0${i + 1}.png"><img src="0${i + 1}.png" alt="질문과 기록 ${i + 1}장"></a>`).join('')}</div><section id="caption"><h2>게시물 캡션</h2><p style="white-space:pre-wrap;line-height:1.8;max-width:720px">${esc(caption)}</p></section></main></html>`);
await fs.writeFile(path.join(dir, '출처.txt'), '운영 질문: data/themes.ts의 관계 → 인정 / 모두에게 좋은 사람이어야 할까?\n도서: 미움받을 용기 / 기시미 이치로, 고가 후미타케\n개념 참고: https://ebook-product.kyobobook.co.kr/dig/epd/ebook/E000005093676\n2장은 개념 요약이며 직접 인용이 아닙니다. 3~5장은 운영자가 작성한 가상 예시로 실제 후기나 발언이 아닙니다.\n');
console.log('질문과 기록 5장 생성 완료');
