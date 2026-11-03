import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const dir=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(dir,'스타일-비교');
await fs.mkdir(out,{recursive:true});
const original=await fs.readFile(path.join(dir,'카드-생성.mjs'),'utf8');
// 기존 렌더러를 공유하되 비교 시안만 별도 경로에 저장합니다.
let script=original.slice(0,original.indexOf('await card(1);'));
script=script.replace("const dir=path.dirname(fileURLToPath(import.meta.url));",'const dir='+JSON.stringify(dir)+';');
script+=String.raw`
async function serif(s,y,size){
 const input=await sharp({text:{text:'<span foreground="'+colors.forest+'">'+esc(s)+'</span>',font:'Noto Serif KR Medium '+size,fontfile:'C:/Windows/Fonts/NotoSerifKR-VF.ttf',rgba:true,dpi:72,spacing:22}}).png().toBuffer();
 const m=await sharp(input).metadata();
 if(m.width>896||y+m.height>1140)throw Error('명조 제목 범위 초과');
 layers.push({input,left:92,top:y});copy.push(s);
}
const comparison=path.join(dir,'스타일-비교');
await card(1);
await serif('사람을\n만나고 싶었다.',150,88);
await type('근데 아무나\n만나고 싶지는 않았다.',490,58,{color:'forest'});
await picture(path.join(dir,'assets/리미-기다림.png'),660,745,290,320);
await type('내가 독서모임을 만드는 이유.',1020,32,{color:'forest'});
await save(comparison,1);
await card(5);
await serif('“어떤 점에서\n그렇게 느끼셨어요?”',145,69);
await picture(path.join(dir,'assets/리미-대화.png'),550,380,420,260);
await type('READ ME에서는\n그다음 이야기가 궁금해요.',690,44);
await type('말을 끝까지 듣고,\n어떤 마음이었는지 물어봐요.',855,41);
await type('생각이 덜 정리돼 있어도 괜찮아요.\n말하기 어려운 이야기는 넘겨도 돼요.',1030,33,{color:'muted'});
await save(comparison,5);
const composite=[];
for(const [row,n] of [1,5].entries()){
 for(const [col,folder] of [dir,comparison].entries()){
  const img=await sharp(col===0?path.join(comparison,'A-'+String(n).padStart(2,'0')+'.png'):path.join(folder,String(n).padStart(2,'0')+'.png')).resize(432,540).toBuffer();
  composite.push({input:img,left:24+col*456,top:95+row*580});
 }
}
for(const [col,label] of ['A · 현재 스타일','B · 명조 제목'].entries()){
 const input=await sharp({text:{text:label,font:'Malgun Gothic Bold 25',fontfile:'C:/Windows/Fonts/malgunbd.ttf',rgba:true}}).png().toBuffer();
 composite.push({input,left:24+col*456,top:32});
}
await fs.writeFile(path.join(comparison,'비교.png'),await sharp({create:{width:936,height:1240,channels:3,background:colors.sand}}).composite(composite).png().toBuffer());
console.log('1·5장 A/B 비교 생성 완료');
`;
const temp=path.join(dir,'../../../../tmp/intro-comparison-render.mjs');
await fs.writeFile(temp,script);
const result=spawnSync(process.execPath,[temp],{stdio:'inherit'});
await fs.unlink(temp);
if(result.status!==0)process.exit(result.status??1);
const css=await fs.readFile(path.join(dir,'../../../../app/globals.css'),'utf8');
const tokens=css.slice(css.indexOf(':root'),css.indexOf('}',css.indexOf(':root'))+1);
await fs.writeFile(path.join(out,'비교.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>READ ME 스타일 비교</title><style>${tokens}*{box-sizing:border-box}body{background:var(--cream);color:var(--ink);font:16px/1.7 sans-serif;margin:0;padding:24px}main{max-width:1100px;margin:auto}h1,h2{color:var(--forest)}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}img{width:100%;display:block}figcaption{padding:12px 0}a{color:var(--forest)}@media(max-width:820px){body{padding:16px}.pair{gap:12px}}@media(max-width:430px){body{padding:12px}.pair{gap:8px}figcaption{font-size:12px}}</style><main><h1>같은 문장, 다른 글씨</h1><p>A는 현재 스타일, B는 Noto Serif KR 명조 제목입니다. 문구·리미·본문 배치는 유지했습니다. 1장은 배경도 초록에서 크림으로 바꿨고, 5장은 손글씨와 명조의 차이를 비교합니다.</p>${[1,5].map(n=>`<h2>${n}장</h2><div class="pair"><figure><a href="../0${n}.png"><img src="../0${n}.png" alt="${n}장 A 현재 스타일"></a><figcaption>A · 현재 ${n===1?'고딕 + 초록 표지':'손글씨 질문'}</figcaption></figure><figure><a href="0${n}.png"><img src="0${n}.png" alt="${n}장 B 명조 제목"></a><figcaption>B · 명조 제목${n===1?' + 크림 표지':''}</figcaption></figure></div>`).join('')}<h2>실천·기록은 어디에 있나요?</h2><p>현재 6장 하단의 ‘다시 일상으로 돌아가면’과 7장의 행동 예시에 들어 있습니다. ‘내 생각 / 새로 들은 관점 / 해볼 일’ 노트 디자인은 아직 적용하지 않은 제안입니다.</p><div class="pair"><figure><img src="../06.png" alt="6장 진행 방식"><figcaption>6장 · 하단에 시도와 기록 안내</figcaption></figure><figure><img src="../07.png" alt="7장 실천 예시"><figcaption>7장 · 일상에서 해볼 행동 예시</figcaption></figure></div></main>`);
