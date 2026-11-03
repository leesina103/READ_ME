import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const home=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(home,'00-모임 소개');
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
async function card(n,dark=false,total=8){
 layers=[];copy=[];boxes=[];cardBackground=dark?'forest':'cream';
 const color=dark?'cream':'forest';
 await type('READ ME',1158,25,{bold:true,color});
 await type(n+' / '+total,1158,25,{x:890,color});
}

const question=path.join(home,'09-대화와기록-실제 예시 보여주기');
const title=async s=>type(s,130,65,{bold:true,color:'forest'});
const remi=async(name,x=740,y=840,w=220,h=250)=>picture(path.join(dir,'assets/리미-'+name+'.png'),x,y,w,h);
function panel(y,h){layers.push({input:Buffer.from('<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><rect x="80" y="'+y+'" width="920" height="'+h+'" rx="18" fill="'+colors.paper+'" stroke="'+colors.sand+'" stroke-width="2"/></svg>'),left:0,top:0});}

// 모집은 질문에서 시작해 참여 판단에 필요한 정보로 이어집니다.
await card(1);
await title('부탁을 거절하고 나서도\n계속 마음이 쓰이나요?');
await type('상대의 마음을 신경 쓰다 보면,\n내가 원하는 것은 뒤로 미루게 될 때가 있어요.',430,37);
await remi('기다림',690,660,265,300);
await type('READ ME 1기 모집 · 관계',955,40,{bold:true,color:'forest'});
await type('책 네 권으로 서로의 삶을 이야기하는 8주',1050,29);
await save(recruit,1);

await card(2);
await title('좋은 관계를 위해,\n나는 어디까지 맞춰야 할까요?');
await type('싫다는 말을 삼킨 순간.\n좋은 뜻으로 한 말이 엇갈린 순간.\n가까운 사람에게 오히려 말하기 어려웠던 순간.',425,37);
await type('책을 읽으며 각자의 경험을 꺼내보고,\n내가 바라는 관계를 생각해봐요.',760,39);
await remi('경청',790,940,155,175);
await save(recruit,2);

await card(3);
await title('네 권의 책으로\n관계를 들여다봅니다.');
const books=[['관계의 언어','문요한','나는 어떤 말과 행동에서\n존중받는다고 느낄까?'],['미움받을 용기','기시미 이치로 · 고가 후미타케','누군가를 실망시킬까 봐\n하지 못한 말이 있을까?'],['말센스','셀레스트 헤들리','나는 상대의 말을 듣는 동안\n무엇을 생각할까?'],['사랑의 기술','에리히 프롬','나는 가까운 사람에게 마음을\n어떻게 표현하고 있을까?']];
for(const [i,[book,author,q]] of books.entries()){
 const y=365+i*190;
 await picture(path.join(root,'public/book-cover-relationship-'+(i+1)+'.jpg'),92,y,100,145);
 await type(book,y+5,42,{bold:true,color:'forest',x:230});
 await type(author,y+65,25,{color:'muted',x:230});
 await type(q,y+100,29,{x:230,spacing:8});
}
await save(recruit,3);

await card(4);
await title('이런 마음이라면,\n함께 이야기해요.');
await type('삶에 변화가 필요한 사람',410,43,{bold:true,color:'forest'});
await type('익숙한 일상에 새로운 계기를 만들고 싶을 때.',480,32);
await type('같이 나아갈 사람이 필요한 사람',620,43,{bold:true,color:'forest'});
await type('혼자 하던 고민과 시도를 누군가와 나누고 싶을 때.',690,32);
await type('여러 사람의 생각과 삶이 궁금한 사람',830,40,{bold:true,color:'forest'});
await type('같은 질문에 다른 사람은 어떻게 답할지 궁금할 때.',900,32);
await remi('경청',810,995,140,140);
await save(recruit,4);

await card(5);
await title('대화에서 떠오른 생각을\n내 관계에서 시도해봐요.');
await type('조언하기 전에 상대의 생각을 먼저 물어보기처럼,\n내가 해볼 작은 행동을 정하고 기록해요.',355,34);
await picture(path.join(dir,'assets/토의-실제화면.png'),92,510,896,505);
await type('격주 오프라인 토의 4회 + 사이 주 온라인 실천·기록 4회',1040,28,{color:'forest'});
await type('READ ME 웹 대화방 · 질문과 답변 예시',1100,25,{color:'muted'});
await save(recruit,5);

await card(6);
await title('함께할 8주를\n미리 살펴봐 주세요.');
const facts=[['시작','2026년 11월 말부터 예정'],['기간','8주'],['장소','사당역 인근 예정'],['인원','그룹당 4~6명'],['만남','격주 오프라인 · 회차당 3시간']];
for(const [i,[label,value]] of facts.entries()){
 const y=385+i*125;
 await type(label,y,32,{color:'muted'});await type(value,y,38,{x:255,color:'forest'});
}
await type('정확한 시작일과 요일·시간은 추후 안내합니다.\n상세 장소는 참여 확정 후 안내합니다.',1050,29,{color:'muted'});
await save(recruit,6);

await card(7);
await title('참여를 결정하기 전,\n온라인으로 이야기해요.');
await type('온라인 인터뷰 · 20~30분',410,42,{bold:true,color:'forest'});
await type('모임에서 기대하는 경험과\n함께 읽고 말하는 방식을 나눠요.',495,39);
await type('READ ME는 유료 모임입니다.',740,41,{bold:true,color:'forest'});
await type('회비는 인터뷰 후 안내해요.\n안내를 확인한 뒤 참여를 결정해 주세요.',825,37);
await remi('대화',710,1000,245,130);
await save(recruit,7);

await card(8);
await title('함께 이야기하고 싶다면,\n프로필 링크에서 신청해 주세요.');
for(const [i,[a,b]] of [['모임 소개 확인','주제와 일정, 진행 방식을 살펴봐 주세요.'],['인터뷰 예약','편한 시간을 골라 온라인으로 이야기해요.'],['가입 신청','인터뷰 후 전달받은 안내에 따라 신청해 주세요.']].entries()){
 const y=400+i*210;await type(a,y,45,{bold:true,color:'forest'});await type(b,y+85,33);
}
await type('궁금한 점은 @readmebook_kr DM으로 물어봐 주세요.',1080,29,{color:'forest'});
await save(recruit,8);

// 대화와 기록 · 실제 예시 보여주기: 기존 주제를 유지하며 실제 후기가 아닌 예시로 보여줍니다.
await card(1,false,5);
await title('모두에게\n좋은 사람이어야 할까?');
await type('내 일정도 빠듯한데 부탁을 받았어요.\n거절하면 서운해할 것 같고,\n들어주자니 내가 힘들 것 같아요.',450,41);
await remi('기다림',705,760,245,280);
await type('여러분은 이럴 때\n어떻게 하나요?',925,42,{color:'forest'});
await save(question,1);

await card(2,false,5);
await title('상대의 기대는\n어디까지 내 몫일까요?');
await picture(path.join(root,'public/book-cover-relationship-2.jpg'),92,385,145,210);
await type('『미움받을 용기』',400,40,{bold:true,color:'forest',x:285});
await type('기시미 이치로 · 고가 후미타케',475,27,{color:'muted',x:285});
await type('타인의 인정을 바라는 마음과\n나의 과제, 타인의 과제를\n구분하는 이야기를 다룹니다.',655,38);
await type('내키지 않는 부탁을 받아준 적이 있나요?\n그때 어떤 마음이었는지 적어봐요.',930,37,{color:'forest'});
await type('책의 개념을 바탕으로 만든 질문이며, 직접 인용이 아닙니다.',1100,24,{color:'muted'});
await save(question,2);

await card(3,false,5);
await title('거절하면 관계가\n멀어질 것 같았어요.');
await type('토의 전 내가 생각한 답',365,30,{bold:true,color:'forest'});
panel(440,450);
await type('나의 답변',475,27,{color:'muted',x:130});
await type('내가 조금 무리하면 되는 일이니까\n웬만하면 들어주는 편이에요.\n\n그런데 그러고 나면 가끔은\n상대가 내 사정도 알아줬으면 싶어요.',545,37,{x:130});
await remi('경청',770,880,180,200);
await type('잘 정리된 답이 아니어도 괜찮아요.\n지금 떠오르는 경험부터 남겨봐요.',930,32);
await type('참여 방식을 보여주기 위한 가상 답변 예시',1100,24,{color:'muted'});
await save(question,3);

await card(4,false,5);
await title('“말하지 않으면\n모를 수도 있겠네요.”');
await type('오늘 새로 들은 관점',365,30,{bold:true,color:'forest'});
panel(440,235);
await type('“말하지 않으면 상대는\n내가 무리하고 있는지 모를 수도 있어요.”',490,37,{x:130});
await remi('대화',665,690,280,185);
await type('나는 거절하는 것과\n상대를 소중히 여기지 않는 것을\n같은 뜻으로 생각했나?',870,39,{color:'forest'});
await type('참여 방식을 보여주기 위한 가상 대화·기록 예시',1100,24,{color:'muted'});
await save(question,4);

await card(5,false,5);
await title('바로 “네”라고 하기 전에,\n내 일정을 살펴보기.');
panel(355,590);
for(const [label,body,y] of [
 ['토의 전 내가 생각한 답','내가 조금 무리해도 들어주는 게 좋다고 생각했다.',390],
 ['오늘 새로 들은 관점','내 사정을 말하지 않으면 상대는 모를 수도 있다.',570],
 ['다음 주에 살펴볼 행동이나 질문','“일정 확인하고 답할게”라고 말해보기.\n그때 내 마음과 상대의 반응을 적어보기.',750]
]){await type(label,y,29,{bold:true,color:'forest',x:125});await text(body,y+65,37,{x:125,maxWidth:820});}
await remi('기록',800,955,155,165);
await type('여러분이라면 어떤 답을 적고 싶나요?',985,32,{color:'forest'});
await type('모임 안내는 프로필 상단 소개 게시물에서 확인해 주세요.',1060,25);
await type('참여 방식을 보여주기 위한 가상 기록 예시',1110,24,{color:'muted'});
await save(question,5);

const sets=[{out:recruit,id:'recruit-1',name:'1기 모집',count:8,folder:'기수 모집(1기-관계)'},{out:question,id:'question',name:'대화와 기록 · 실제 예시 보여주기',count:5,folder:'09-대화와기록-실제 예시 보여주기'}];
const tokens=Object.entries(colors).map(([k,v])=>'--'+k+':'+v).join(';');
const style=':root{'+tokens+'}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:16px/1.7 sans-serif}main{max-width:1200px;margin:auto;padding:32px 24px}a{color:var(--forest)}nav{display:flex;flex-wrap:wrap;gap:20px;margin-bottom:28px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0}img{display:block;width:100%;height:auto}figcaption{padding:8px 0}@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){main{padding:20px 12px}.grid{grid-template-columns:1fr}}';
const indexPath=path.join(home,'../전체-미리보기.html');
let index=await fs.readFile(indexPath,'utf8');
for(const set of sets){
 const thumbs=[],cards=[],indexCards=[];
 for(let n=1;n<=set.count;n++){
  const file=String(n).padStart(2,'0')+'.png',buffer=await fs.readFile(path.join(set.out,file));
  const hash=createHash('sha256').update(buffer).digest('hex').slice(0,10);
  thumbs.push({input:await sharp(buffer).resize(432,540).toBuffer(),left:((n-1)%3)*452+20,top:Math.floor((n-1)/3)*560+20});
  cards.push('<figure><a href="'+file+'?v='+hash+'"><img src="'+file+'?v='+hash+'" alt="'+set.name+' '+n+'장"></a><figcaption>'+n+' / '+set.count+'</figcaption></figure>');
  const url='소개와질문/'+set.folder+'/'+file+'?v='+hash;
  indexCards.push('<a href="'+url+'"><img src="'+url+'" alt="'+set.name+' '+n+'장" loading="lazy"></a>');
 }
 await sharp({create:{width:1376,height:Math.ceil(set.count/3)*560+20,channels:3,background:colors.sand}}).composite(thumbs).png().toFile(path.join(set.out,'한눈에보기.png'));
 await fs.writeFile(path.join(set.out,'미리보기.html'),'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>READ ME '+set.name+'</title><style>'+style+'</style></head><body><main><h1>'+set.name+' · '+set.count+'장</h1><nav><a href="../../전체-미리보기.html#'+set.id+'">전체 목록</a><a href="../00-모임 소개/미리보기.html">모임 소개</a><a href="게시물-캡션.txt">게시물 캡션</a></nav><div class="grid">'+cards.join('')+'</div></main></body></html>');
 const pattern=new RegExp('<section id="'+set.id+'"[\\s\\S]*?<\\/section>');
 if(!pattern.test(index))throw Error('전체 목록 구역 없음: '+set.id);
 index=index.replace(pattern,'<section id="'+set.id+'" hidden><h2>'+set.name+'</h2><p>'+set.count+'장 · <a href="소개와질문/'+set.folder+'/미리보기.html">이 게시물 보기</a></p><div class="grid">'+indexCards.join('')+'</div></section>');
}
await fs.writeFile(indexPath,index);
await fs.writeFile(path.join(runtime,'모집-질문-텍스트-검증.json'),JSON.stringify(bounds,null,2));
console.log('1기 모집 8장과 대화와 기록 · 실제 예시 보여주기 5장 생성. 글자 범위·겹침 검사 통과.');
