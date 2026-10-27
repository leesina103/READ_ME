import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
// 한글 경로의 글꼴을 안정적으로 읽도록 작업 폴더에 캐시를 둡니다.
const runtime = path.join(root, 'tmp/intro-card-fonts');
await fs.mkdir(path.join(runtime, 'cache'), {recursive:true});
await fs.copyFile(path.join(dir,'assets/NanumPenScript-Regular.ttf'),path.join(runtime,'NanumPenScript-Regular.ttf'));
const runtimePath = runtime.replaceAll('\\','/');
await fs.writeFile(path.join(runtime,'fonts.conf'),`<?xml version="1.0"?><fontconfig><dir>${runtimePath}</dir><dir>C:/Windows/Fonts</dir><cachedir>${runtimePath}/cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = path.join(runtime,'fonts.conf');
if(process.env.README_CARD_FONT_READY!=='1'){
 const child=spawnSync(process.execPath,[fileURLToPath(import.meta.url)],{stdio:'inherit',env:{...process.env,README_CARD_FONT_READY:'1'}});
 process.exit(child.status??1);
}
const {default:sharp}=await import('sharp');
const css = await fs.readFile(path.join(root, 'app/globals.css'), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--(cream|sand|sage|forest|ink|paper|muted|line):\s*([^;]+);/g)].map(m => [m[1], m[2]]));
const fontfile = path.join(runtime, 'NanumPenScript-Regular.ttf');
const W = 1080, H = 1350;
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let layers = [];
let copy = [];


function shape(svg) {
  layers.push({input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`), left: 0, top: 0});
}
function line(y, x1=100, x2=980) { shape(`<path d="M${x1} ${y}H${x2}" stroke="${colors.sand}" stroke-width="2"/>`); }
async function text(s,y,size=54,{x=540,align='center',color='ink',serif=false}={}) {
  const modern=true;
  const family=modern?(serif?'Noto Serif KR Medium':'Noto Sans KR'):'Nanum Pen';
  const selectedFont=modern?`C:/Windows/Fonts/${serif?'NotoSerifKR':'NotoSansKR'}-VF.ttf`:fontfile;
  const buffer = await sharp({text:{text:`<span foreground="${colors[color]}">${esc(s)}</span>`,font:`${family} ${size}`,fontfile:selectedFont,rgba:true,dpi:72,spacing:10,align}}).png().toBuffer();
  const meta=await sharp(buffer).metadata();
  const left=align==='center'?Math.round(x-meta.width/2):x;
  if(left<45 || left+meta.width>1035 || y+meta.height>1290) throw Error(`글자 범위 확인: ${s}`);
  layers.push({input:buffer,left,top:y}); copy.push(s);
}
async function art(file,y,width=940) {
  const buffer=await sharp(path.join(root,'public',file)).resize({width}).png().toBuffer();
  layers.push({input:buffer,left:Math.round((W-width)/2),top:y});
}
async function base(n,title,titleSize=68) {

  layers=[]; copy=[];
  await text(title,165,titleSize,{color:'forest',serif:true});
  line(1240,390,690);
  await text('READ ME',1260,23,{color:'forest'});
  await text(`${n} / 7`,1262,22,{x:960,color:'muted'});
}
async function save(n){
  if(process.env.README_CARD_ONLY && !process.env.README_CARD_ONLY.split(',').map(Number).includes(n)) return;
  const name=String(n).padStart(2,'0');
  const image = await sharp({create:{width:W,height:H,channels:3,background:colors.cream}}).composite(layers).png().toBuffer();
  await fs.writeFile(path.join(dir,`${name}.png`),image);
  await fs.writeFile(path.join(dir,`${name}.txt`),copy.join('\n\n')+'\n');
}

await base(1,'READ ME 독서모임\n1기 모집');
await text('책을 읽고, 내 생각을 나누는 모임입니다.',390,36,{x:120,align:'left'});
await text('대화에서 얻은 생각을 일상에서 시도하고 기록해요.',454,32,{x:120,align:'left',color:'muted'});
await art('theme-remi-relationship.png',580,900);
line(1140,120,960);
await text('사당역 인근 예정 · 8주 · 그룹당 4~6명',1155,30,{color:'forest'});
await save(1);

await base(2,'이런 분께 권해요');
await text('혼자 읽은 책을 함께 이야기하고 싶다면.',305,35,{color:'muted'});
const people=[['책을 읽고 나면','떠오른 생각을 누군가와 나누고 싶은 분'],['다른 사람의 생각이 궁금해서','같은 책을 어떻게 읽었는지 듣고 싶은 분'],['읽는 데서 한 걸음 더','책에서 얻은 생각을 생활에서 시도해 보고 싶은 분']];
for(let i=0;i<people.length;i++){
 const y=465+i*240;
 await text(people[i][0],y,39,{x:120,align:'left',color:'forest',serif:true});
 await text(people[i][1],y+82,32,{x:120,align:'left'});
 if(i<2)line(y+175,120,960);
}
await save(2);

await base(3,'모임 진행 방식');
await text('책 읽기부터 대화, 실천과 기록까지.',305,35,{color:'muted'});
const steps=[['모임 전 · 사전 질문','책을 읽고 웹사이트 토크방의\n사전 질문에 내 생각을 남겨요.'],['함께 만나 · 오프라인 대화','같은 책을 읽은 사람들과 만나\n서로의 생각과 경험을 나눠요.'],['모임 후 · 실천과 기록','책과 대화에서 얻은 생각을 일상에서 시도하고,\n해본 일과 그때 느낀 점을 토크방에 남겨요.']];
for(let i=0;i<steps.length;i++){
 const y=440+i*250;
 await text(steps[i][0],y,39,{x:120,align:'left',color:'forest',serif:true});
 await text(steps[i][1],y+80,32,{x:120,align:'left'});
 if(i<2)line(y+205,120,960);
}
await save(3);

await base(4,'모임 전 · 질문에 내 생각 남기기',54);
await text('이렇게 생각을 남겨요',305,32,{color:'muted'});
// 실제 토크방을 165% 배율로 캡처한 질문·답변 영역을 원본 해상도로 사용합니다.
const discussionSource=path.join(dir,'assets/토의-실제화면.png');
const discussion=await sharp(discussionSource).resize({width:940}).png().toBuffer();
layers.push({input:discussion,left:70,top:450});
await text('실제 토크방 화면을 발췌했습니다.\n답변은 참여 방식을 보여주기 위해 작성한 예시입니다.',1110,25,{color:'muted'});
await save(4);

await base(5,'모임 후 · 실천한 경험 기록하기',54);
await text('이렇게 경험을 기록해요',305,32,{color:'muted'});
const practice=await sharp(path.join(dir,'assets/실천-실제화면.png')).resize({width:940}).png().toBuffer();
layers.push({input:practice,left:70,top:410});
await text('실제 토크방 화면 · 참여 방식을 보여주기 위해\n작성한 예시이며, 실제 참여자의 후기가 아닙니다.',1110,25,{color:'muted'});
await save(5);

await base(6,'1기 일정과 장소');
await text('사당역 인근에서 8주 동안 함께할 예정이에요.',305,32,{color:'muted'});
const facts=[['장소','사당역 인근 예정'],['시작','2026년 11월 말부터'],['기간','8주'],['구성','격주 오프라인 토의 4회\n사이 주에는 온라인 실천·기록 4회'],['인원과 시간','그룹당 4~6명 · 오프라인 회차당 3시간'],['회비','인터뷰 후 안내']];
for(let i=0;i<facts.length;i++){
 const y=450+i*100+(i>3?55:0);
 await text(facts[i][0],y,31,{x:120,align:'left',color:'forest',serif:true});
 await text(facts[i][1],y,29,{x:340,align:'left'});
 line(y+(i===3?125:73),120,960);
}
await text('사당역 인근 예정 · 상세 장소는 참여 확정 후 안내',1170,27,{color:'forest'});
await save(6);

await base(7,'신청 방법');
await text('프로필 링크에서 시작해 주세요.',305,35,{color:'muted'});
const applySteps=[['모임 소개 확인','일정과 진행 방식을 살펴봐 주세요.'],['인터뷰 예약','편한 시간을 골라 온라인으로 20~30분 이야기해요.'],['가입 신청','인터뷰 후 전달받은 안내에 따라 신청해 주세요.']];
for(let i=0;i<applySteps.length;i++){
 const y=440+i*210;
 await text(applySteps[i][0],y,39,{x:120,align:'left',color:'forest',serif:true});
 await text(applySteps[i][1],y+80,30,{x:120,align:'left'});
 if(i<2)line(y+160,120,960);
}
await text('궁금한 점은 인스타그램 DM으로 물어봐 주세요.',1105,27,{color:'muted'});
await text('@readmebook_kr',1165,32,{color:'forest'});
await save(7);

const thumbs=[];
for(let i=1;i<=7;i++) thumbs.push({input:await sharp(path.join(dir,`${String(i).padStart(2,'0')}.png`)).resize(540,675).toBuffer(),left:((i-1)%3)*560+20,top:Math.floor((i-1)/3)*695+20});
await sharp({create:{width:1700,height:2105,channels:3,background:colors.sand}}).composite(thumbs).png().toFile(path.join(dir,'한눈에보기.png'));
const tokens=Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';');
await fs.writeFile(path.join(dir,'미리보기.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>READ ME 모임 소개 시안</title><style>:root{${tokens}}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:"Noto Sans KR",sans-serif}main{max-width:1200px;margin:auto;padding:32px 24px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}img{display:block;width:100%;height:auto}a{color:var(--forest)}@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){main{padding:20px 12px}.grid{grid-template-columns:1fr}}</style><main><h1>READ ME 모임 소개 · 7장 시안</h1><p>1080 × 1350 PNG · 모임 소개와 참여 안내</p><p><a href="../../전체-미리보기.html#intro">전체 목록</a></p><div class="grid">${Array.from({length:7},(_,i)=>`<a href="${String(i+1).padStart(2,'0')}.png"><img src="${String(i+1).padStart(2,'0')}.png" alt="모임 소개 ${i+1}장"></a>`).join('')}</div></main></html>`);
await fs.writeFile(path.join(dir,'검토메모.txt'),"모임 소개 7장입니다.\n\n참여 정보 출처: data/currentMeeting.ts (2026-10-26 로컬 파일 확인)\n6장의 시작 시점과 장소는 현재 로컬 안내 기준이며 실제 운영 및 배포 상태는 별도 확인이 필요합니다.\n상세 장소와 요일·시간은 임의로 채우지 않았습니다.\n4장은 사전 질문과 본인 답변을 발췌했고, 5장은 실천 기록 화면을 담았습니다. 화면 속 답변은 홍보용 가상 예시입니다. test 이름이 표시된 다른 답변은 발췌에서 제외했습니다.\n리미: public/theme-remi-relationship.png 원화. 색과 밝기는 변경하지 않았습니다.\n서체: 전체 7장에 Noto Serif KR 제목과 Noto Sans KR 본문을 적용했습니다.\n수정 원본: 카드-생성.mjs.\n");
console.log('모임 소개 7장과 미리보기 갱신 완료');
const indexPath=path.join(dir,'../../전체-미리보기.html');
let index=await fs.readFile(indexPath,'utf8');
const introSection='<section id="intro" hidden><h2>모임 소개</h2><p>7장 · <a href="소개와질문/00-모임소개/미리보기.html">이 게시물 보기</a></p><div class="grid">'+Array.from({length:7},(_,i)=>`<a href="소개와질문/00-모임소개/${String(i+1).padStart(2,'0')}.png"><img src="소개와질문/00-모임소개/${String(i+1).padStart(2,'0')}.png" alt="모임 소개 ${i+1}장" loading="lazy"></a>`).join('')+'</div></section>';
index=index.replace(/<section id="intro"[\s\S]*?<\/section>/,introSection).replaceAll('모임 소개 시안 6장','모임 소개 7장');
await fs.writeFile(indexPath,index);
// 기존 경로에서 갱신한 이미지가 미리보기에도 바로 반영되게 합니다.
for(const file of [indexPath,path.join(dir,'미리보기.html')]){
 let html=await fs.readFile(file,'utf8');
 for(const n of ['01','02','03','04','05','06','07']){
  const hash=createHash('sha256').update(await fs.readFile(path.join(dir,`${n}.png`))).digest('hex').slice(0,10);
  const prefix=file===indexPath?'소개와질문/00-모임소개/':'';
  html=html.replaceAll(new RegExp(`${prefix}${n}\\.png(?:\\?v=[a-z0-9]+)?`, 'g'),`${prefix}${n}.png?v=${hash}`);
 }
 await fs.writeFile(file,html);
}
