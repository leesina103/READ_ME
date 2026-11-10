import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../../..');
const recruit=path.join(dir,'../기수 모집(1기-관계)');
const runtime=path.join(root,'tmp/intro-card-fonts');
await fs.mkdir(path.join(runtime,'cache'),{recursive:true});
await fs.mkdir(recruit,{recursive:true});
await fs.copyFile(path.join(dir,'assets/NanumBaReunHiPi.ttf'),path.join(runtime,'NanumBaReunHiPi.ttf'));
const rp=runtime.replaceAll('\\','/');
await fs.writeFile(path.join(runtime,'fonts.conf'),'<?xml version="1.0"?><fontconfig><dir>'+rp+'</dir><dir>C:/Windows/Fonts</dir><cachedir>'+rp+'/cache</cachedir></fontconfig>');
process.env.FONTCONFIG_FILE=path.join(runtime,'fonts.conf');
// 글꼴 설정은 렌더러를 불러오기 전에 새 프로세스에 적용합니다.
if(process.env.README_CARD_FONT_READY!=='1'){
 const child=spawnSync(process.execPath,[fileURLToPath(import.meta.url)],{stdio:'inherit',env:{...process.env,README_CARD_FONT_READY:'1'}});
 process.exit(child.status??1);
}
const {default:sharp}=await import('sharp');
const css=await fs.readFile(path.join(root,'app/globals.css'),'utf8');
const rootCss=css.slice(css.indexOf(':root'),css.indexOf('}',css.indexOf(':root')));
const colors=Object.fromEntries([...rootCss.matchAll(/--(cream|sand|sage|forest|ink|paper|muted|line):\s*([^;]+);/g)].map(m=>[m[1],m[2]]));
const W=1080,H=1350;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const fontfile=path.join(runtime,'NanumBaReunHiPi.ttf');
let layers=[],copy=[],boxes=[];
let cardBackground="cream";
const bounds=[];
async function text(s,y,size=51,{x=95,color='ink',maxWidth=890}={}){
 const buffer=await sharp({text:{text:'<span foreground="'+colors[color]+'">'+esc(s)+'</span>',font:'Nanum BaReunHiPi '+size,fontfile,rgba:true,dpi:72,spacing:14,align:'left'}}).png().toBuffer();
 const m=await sharp(buffer).metadata();
 if(m.width>maxWidth||x<60||x+m.width>1020||y+m.height>1300)throw Error('글자 범위 초과: '+s+' '+m.width+'×'+m.height);
 const b={text:s,x,y,width:m.width,height:m.height};
 if(boxes.some(a=>b.x<a.x+a.width&&b.x+b.width>a.x&&b.y<a.y+a.height&&b.y+b.height>a.y))throw Error('글자 겹침: '+s);
 boxes.push(b);layers.push({input:buffer,left:x,top:y});copy.push(s);
}
async function picture(file,x,y,width,height){
 const buffer=await sharp(file).resize({width,height,fit:'inside'}).png().toBuffer();
 const m=await sharp(buffer).metadata();
 layers.push({input:buffer,left:x+Math.round((width-m.width)/2),top:y});
}
async function save(out,n){
 const name=String(n).padStart(2,'0');
 const rendered=await sharp({create:{width:W,height:H,channels:3,background:colors[cardBackground]}}).composite(layers).png().toBuffer();
 // 미리보기에서 이미지를 읽는 동안 생기는 일시적인 Windows 파일 잠금을 기다립니다.
 for(let attempt=0;attempt<5;attempt++){
  try{await fs.writeFile(path.join(out,name+'.png'),rendered);break;}
  catch(error){if(!['UNKNOWN','EBUSY','EPERM'].includes(error.code)||attempt===4)throw error;await new Promise(resolve=>setTimeout(resolve,200));}
 }
 await fs.writeFile(path.join(out,name+'.txt'),copy.join('\n\n')+'\n');
 bounds.push({file:path.relative(root,path.join(out,name+'.png')),boxes});
}
// 모임 소개: B안 명조 제목과 고딕 본문을 유지하고 기록 예시만 손글씨로 씁니다.
async function type(s,y,size=46,{bold=false,color='ink',x=92,spacing=22}={}){
 const serif=bold&&size>=55;
 // 작은 안내 문구는 유지하고 제목과 본문만 약 8% 줄입니다.
 if(size>=38)size=Math.round(size*0.92);
 const input=await sharp({text:{text:'<span foreground="'+colors[color]+'">'+esc(s)+'</span>',font:serif?'Noto Serif KR Medium '+size:'Malgun Gothic '+(bold?'Bold ':'')+size,fontfile:serif?'C:/Windows/Fonts/NotoSerifKR-VF.ttf':bold?'C:/Windows/Fonts/malgunbd.ttf':'C:/Windows/Fonts/malgun.ttf',rgba:true,dpi:72,spacing}}).png().toBuffer();
 const m=await sharp(input).metadata();
 const b={text:s,x,y,width:m.width,height:m.height};
 if(x+m.width>988||y+m.height>1205)throw Error('소개 글자 범위 초과: '+s+' '+m.width+'x'+m.height);
 if(boxes.some(a=>b.x<a.x+a.width&&b.x+b.width>a.x&&b.y<a.y+a.height&&b.y+b.height>a.y))throw Error('소개 글자 겹침: '+s);
 boxes.push(b);layers.push({input,left:x,top:y});copy.push(s);
}
async function card(n,dark=false){
 layers=[];copy=[];boxes=[];cardBackground=dark?'forest':'cream';
 const color=dark?'cream':'forest';
 await type('READ ME',1158,25,{bold:true,color});
 await type(n+' / 8',1158,25,{x:890,color});
}
await card(1);
await type('다른 사람의 마음은\n신경 쓰면서,\n내 마음은 얼마나 알까?',140,66,{bold:true,color:'forest'});
await picture(path.join(dir,'assets/리미-기다림.png'),660,745,290,320);
await type('Read Books.',940,34,{bold:true,color:'forest'});
await type('Read Yourself.',1000,34,{bold:true,color:'forest'});
await type('독서모임 READ ME',1060,34,{bold:true,color:'forest'});
await save(dir,1);

await card(2);
await type('최근에 ‘이게 나답다’고\n느낀 순간이 있었나요?',145,67,{bold:true,color:'forest'});
await type('다들 좋다는 선택인데 마음이 불편했던 적.\n별일 아닌 순간에 유난히 기분이 좋았던 적.',425,41);
await type('책 속 이야기에 내 경험을 비춰보고,\n다른 사람의 생각도 들어봐요.\n내가 중요하게 여기는 것이 보일 수 있어요.',680,41);
await picture(path.join(dir,'assets/리미-경청.png'),760,915,190,200);
await save(dir,2);

await card(3);
await type('만나기 전, 질문에 답하며\n내 생각을 적어봐요.',125,65,{bold:true,color:'forest'});
await type('책에서 나온 질문에\n내 경험을 떠올려 봐요.',350,35);
await picture(path.join(dir,'assets/토의-실제화면.png'),92,530,896,505);
await type('READ ME 웹 대화방 · 질문과 답변 예시',1080,25,{color:'muted'});
await save(dir,3);

await card(4);
await type('모임 날, 서로의 생각을 나누고\n다른 관점을 들어봐요.',145,60,{bold:true,color:'forest'});
await picture(path.join(dir,'assets/리미-대화.png'),550,390,420,260);
await type('생각이 달라도, 먼저 끝까지 들어요.',710,41);
await type('“어떤 점에서 그렇게 느끼셨어요?”\n판단하기 전에 궁금한 점을 물어봐요.',840,38);
await type('말하기 어려운 이야기는 넘겨도 돼요.',1040,30,{color:'muted'});
await save(dir,4);

await card(5);
await type('대화를 나눈 뒤,\n나에 대해 알게 된 것을 남겨요.',110,60,{bold:true,color:'forest'});
layers.push({input:Buffer.from('<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><rect x="75" y="340" width="930" height="680" rx="12" fill="'+colors.paper+'" stroke="'+colors.sand+'" stroke-width="2"/><path d="M115 565H965 M115 790H965" stroke="'+colors.sand+'" stroke-width="2"/></svg>'),left:0,top:0});
await type('토의 전 내 생각',375,32,{bold:true,color:'forest',x:120});
await text('친구가 고민을 말하면 해결책을\n찾아주는 게 도움이라고 생각했다.',440,43,{x:120,maxWidth:820});
await type('오늘 새로 들은 관점',600,32,{bold:true,color:'forest',x:120});
await text('어떤 사람은 조언보다 자기 생각을\n물어봐 줬을 때 좋았다고 했다.',665,43,{x:120,maxWidth:820});
await type('다음 주에 살펴볼 행동이나 질문',825,32,{bold:true,color:'forest',x:120});
await text('조언하기 전에\n“넌 어떻게 하고 싶어?” 하고 물어보기.',890,42,{x:120,maxWidth:820});
await picture(path.join(dir,'assets/리미-기록.png'),805,1010,165,135);
await type('해본 뒤의 느낌이나, 아직 남은 질문도 좋아요.',1050,27,{color:'muted'});
await type('참여 방식을 보여주기 위한 예시입니다.',1100,24,{color:'muted'});
await save(dir,5);

await card(6);
await type('대화에서 떠오른 작은 시도를\n일상으로 가져가요.',110,60,{bold:true,color:'forest'});
await type('해본 뒤 어떤 마음이 들었는지,\n아직 남은 질문은 무엇인지\n온라인 대화방에 남겨요.',335,35);
await picture(path.join(dir,'assets/실천-실제화면.png'),92,550,896,525);
await type('READ ME 웹 대화방 · 실천과 기록 예시',1110,25,{color:'muted'});
await save(dir,6);

await card(7);
await type('잘된 이야기만\n가져오지 않아도 돼요.',145,65,{bold:true,color:'forest'});
await type('생각이 덜 정리돼 있어도,\n해본 일이 생각처럼 안 됐어도 괜찮아요.',415,41);
await type('다음 만남에서 그 이야기를 이어가요.',640,40);
await picture(path.join(dir,'assets/리미-실천.png'),745,865,205,230);
await type('읽고 적기 → 만나서 대화\n→ 일상에서 시도 → 다시 나누기',980,29,{color:'forest'});
await save(dir,7);

await card(8);
await type('이런 마음이라면,\nREAD ME에서 만나요.',150,68,{bold:true,color:'forest'});
await type('나를 조금 더 알아가고 싶은 사람.\n함께 고민하며 나아갈 사람이 필요한 사람.\n서로 존중하며 대화하고 싶은 사람.',510,43,{color:'forest'});
await type('현재 모집 중인 기수와 참여 방법은\n프로필 링크에서 확인해 주세요.',1020,33,{color:'forest'});
await save(dir,8);
cardBackground='cream';
// 모집·질문 카드는 ../카드-생성.mjs에서 같은 B 스타일로 생성합니다.
const tokens=Object.entries(colors).map(([k,v])=>'--'+k+':'+v).join(';');
const previewStyle=':root{'+tokens+'}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:16px/1.7 sans-serif}main{max-width:1200px;margin:auto;padding:32px 24px}a{color:var(--forest)}nav{display:flex;flex-wrap:wrap;gap:20px;margin-bottom:28px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0}img{display:block;width:100%;height:auto}figcaption{padding:8px 0}h1{word-break:keep-all}@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){main{padding:20px 12px}.grid{grid-template-columns:1fr}}';
const sets=[{out:dir,id:'intro',name:'모임 소개',count:8,folder:path.basename(dir)},{out:recruit,id:'recruit-1',name:'1기 모집',count:7,folder:path.basename(recruit)}];
const indexPath=path.join(dir,'../../전체-미리보기.html');
let index=await fs.readFile(indexPath,'utf8');
for(const set of sets.filter(item=>item.id==='intro')){
 const thumbs=[],cards=[],indexCards=[];
 for(let n=1;n<=set.count;n++){
  const file=String(n).padStart(2,'0')+'.png';
  const image=await fs.readFile(path.join(set.out,file));
  const hash=createHash('sha256').update(image).digest('hex').slice(0,10);
  thumbs.push({input:await sharp(image).resize(432,540).toBuffer(),left:((n-1)%3)*452+20,top:Math.floor((n-1)/3)*560+20});
  cards.push('<figure><a href="'+file+'?v='+hash+'"><img src="'+file+'?v='+hash+'" alt="'+set.name+' '+n+'장"></a><figcaption>'+n+' / '+set.count+'</figcaption></figure>');
  const url='소개와질문/'+set.folder+'/'+file+'?v='+hash;
  indexCards.push('<a href="'+url+'"><img src="'+url+'" alt="'+set.name+' '+n+'장" loading="lazy"></a>');
 }
 await sharp({create:{width:1376,height:Math.ceil(set.count/3)*560+20,channels:3,background:colors.sand}}).composite(thumbs).png().toFile(path.join(set.out,'한눈에보기.png'));
 await fs.writeFile(path.join(set.out,'미리보기.html'),'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>READ ME '+set.name+'</title><style>'+previewStyle+'</style></head><body><main><h1>READ ME '+set.name+' · '+set.count+'장</h1><nav><a href="../../전체-미리보기.html#'+set.id+'">전체 목록</a><a href="../00-모임 소개/미리보기.html">모임 소개</a><a href="../기수 모집(1기-관계)/미리보기.html">1기 모집</a><a href="게시물-캡션.txt">게시물 캡션</a></nav><div class="grid">'+cards.join('')+'</div></main></body></html>');
 const section='<section id="'+set.id+'" hidden><h2>'+set.name+'</h2><p>'+set.count+'장 · <a href="소개와질문/'+set.folder+'/미리보기.html">이 게시물 보기</a></p><div class="grid">'+indexCards.join('')+'</div></section>';
 const pattern=new RegExp('<section id="'+set.id+'"[\\s\\S]*?<\\/section>');
 index=pattern.test(index)?index.replace(pattern,section):index.replace('<section id="question"',section+'<section id="question"');
}
if(!index.includes('href="#recruit-1"'))index=index.replace('<a href="#intro">모임 소개</a>','<a href="#intro">모임 소개</a><a href="#recruit-1">1기 모집</a>');
index=index.replace(/모임 소개 [678]장(?:·1기 모집 7장)?과 대화·기록 실제 예시 보여주기 5장/g,'모임 소개 8장·1기 모집 7장과 대화·기록 실제 예시 보여주기 5장');
await fs.writeFile(indexPath,index);
await fs.writeFile(path.join(runtime,'텍스트-영역-검증.json'),JSON.stringify(bounds,null,2));
console.log('모임 소개 8장 생성. 텍스트 범위와 겹침 검사 통과.');


