// CommonJS로 실행하는 로컬 미리보기 생성 스크립트입니다.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
const root = __dirname;
const episodes = JSON.parse(fs.readFileSync(path.join(root, '연재-2-8편-제작데이터.json'), 'utf8'));
const oldHtml = fs.readFileSync(path.join(root, '..', '전체-미리보기.html'), 'utf8');
const oldData = JSON.parse(oldHtml.match(/const episodes=(.*?);const nav=/s)[1]);
episodes.unshift(oldData[0]);
const captions = Object.fromEntries(episodes.filter(e => e.n > 1).map(e => [e.n, fs.readFileSync(path.join(root, e.slug, '게시물-캡션.txt'), 'utf8')]));
let html = oldHtml.replace(/const episodes=.*?;const nav=/s, 'const episodes=' + JSON.stringify(episodes) + ';const nav=');
html = html.replace('1~8편 전체 미리보기</h1>', '1~8편 리뷰 반영본</h1><p>기존 순서와 설명형 구성을 유지했습니다. <a href="../전체-미리보기.html">수정 전 비교</a> · <a href="수정내역.txt">수정 내역</a></p>');
html = html.replace('<div class="grid" id="grid"></div>', '<div class="grid" id="grid"></div><section><h2>게시물 캡션</h2><p id="caption" style="white-space:pre-line"></p></section>');
html = html.replace('const nav=document', 'const captions=' + JSON.stringify(captions) + ';const nav=document');
html = html.replace("grid.replaceChildren();", "document.getElementById('caption').textContent=captions[e.n]||'1편은 기존 10장 버전입니다.';grid.replaceChildren();");
fs.writeFileSync(path.join(root, '전체-미리보기.html'), html);
for (const ep of episodes.filter(e=>e.n>1)) {
  fs.writeFileSync(path.join(root, ep.slug, '제작-원고.txt'), ep.title + '\n\n' + ep.slides.map(([copy,scene],i)=>`${i+1}장\n${copy}\n장면: ${scene}`).join('\n\n'));
  const single = '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + ep.title + '</title><style>body{max-width:720px;margin:24px auto;padding:0 16px;font:16px/1.7 sans-serif}img{width:100%;height:auto}pre{white-space:pre-wrap}</style><h1>' + ep.n + '편 · ' + ep.title + '</h1><a href="../전체-미리보기.html#' + ep.n + '">전체 미리보기</a>' + ep.slides.map((s,i)=>'<figure><img loading="lazy" src="'+String(i+1).padStart(2,'0')+'.png" alt="'+(i+1)+'장"><figcaption>'+(i+1)+' / '+ep.slides.length+'</figcaption></figure>').join('') + '<h2>게시물 캡션</h2><pre>'+captions[ep.n]+'</pre></html>';
  fs.writeFileSync(path.join(root, ep.slug, '미리보기.html'), single);
}
new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log('미리보기와 편별 원고 생성 및 스크립트 문법 확인 완료');
