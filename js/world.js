(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const EF='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const WW=3600,WH=2600;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

/* ---------- seeded world so it is the same every time ---------- */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=mulberry(7);
const rr=(a,b)=>a+R()*(b-a);

/* ---------- state ---------- */
const S={char:null,stars:0,t:0,night:0,nightT:0,sound:true,combo:0,comboT:0,magicCool:0,castleCool:0,carCool:0,rainT:0,msgT:0};
const P={x:WW/2,y:WH-520,tx:null,ty:null,face:1,moving:false,hop:0,spin:0,dash:0,giggle:0,k:'player'};
const cam={x:0,y:0};
let W=0,H=0,DPR=1,Z=1;
const hist=[];

/* ---------- dress-up options ---------- */
const RB5=['#ff4d6d','#ffd93d','#5ee06a','#4cc9f0','#d96bff'];
const BODY=[{f:'#ffffff',o:'#cdbbea',l:'#d9cdf0'},{f:'#ffd6ec',o:'#f0a8cf',l:'#f3bddb'},{f:'#e6d6ff',o:'#b99be8',l:'#cfb8f5'},{f:'#d3f7e5',o:'#8fd7b4',l:'#b3ead0'},{f:'#d4ecff',o:'#8cc2ee',l:'#b5dbf8'},{f:'#fff0b3',o:'#e8c660',l:'#f5dc8a'},{f:'#6f5a99',o:'#41306b',l:'#58457f'}];
const MANES=[['#ff4d6d','#ff9f1c','#ffd93d','#5ee06a','#4cc9f0','#7b6cff','#d96bff'],['#ff4d9d','#ff7ab8','#ff9fcf','#ffbfe0','#ff9fcf','#ff7ab8','#ff4d9d'],['#1b6dff','#2f9bff','#4cc9f0','#7be3ff','#4cc9f0','#2f9bff','#1b6dff'],['#ffb300','#ffd54a','#ffe98a','#fff3b8','#ffe98a','#ffd54a','#ffb300'],['#ff4d6d','#ff7a3d','#ffb703','#ffd93d','#ffb703','#ff7a3d','#ff4d6d'],['#3a2a8c','#6a3fd6','#9b6bff','#d96bff','#9b6bff','#6a3fd6','#3a2a8c']];
const HORNS=[{f:'#ffd84d',s:'#e3a91a'},{f:'#e8eef7',s:'#aab6c8'},{f:'#ff9fd0',s:'#e0569f'},{f:'#7be3ff',s:'#3aa6d8'},{f:'rainbow',s:'#c89bff'}];
const HAIRS=['#f4b32a','#7a4a2a','#2b2233','#d2491e','#ff7ab8','#4aa8ff'];
const DRESSES=[['#ff8fcf','#ff5fb0'],['#c79bff','#9b5fe8'],['#8fd0ff','#4a9bf0'],['#9ff0c8','#43d49b'],['#ffe680','#ffc233'],['#ff8a8a','#e63946'],'rainbow'];
const UCROWN=[-1,0,2,3],PCROWN=[0,1,2,3,-1];
const DEF={unicorn:{body:0,mane:0,horn:0,crown:0,wings:false,saddle:false,garland:false,aura:false},princess:{dress:0,hair:0,crown:0,wings:false,wand:false,aura:false}};
S.outfit=JSON.parse(JSON.stringify(DEF));
S.scene='';S.mode='';S.build=false;S.tool='🌷';S.paint=false;S.placed=[];S.doorCool=0;S.caveCool=0;S.schoolCool=0;S.flash=0;S.resetting=false;
const BUILD=[['🌷',90],['🌳',200],['🌲',200],['🏡',190],['⛲',150],['🎈',80],['🎪',190],['⛺',150],['🪑',80],['🌉',210],['🌈',210],['🗑️',0]];
const BSIZE=Object.fromEntries(BUILD);

try{const s=JSON.parse(localStorage.getItem('magicland')||'{}');S.stars=s.stars|0;S.lastChar=s.char||null;if(s.outfit)for(const k in S.outfit)Object.assign(S.outfit[k],s.outfit[k]||{});S.stickers=Array.isArray(s.stickers)?s.stickers:[];S.lv=(s.lv&&typeof s.lv==='object')?s.lv:{};if(Array.isArray(s.placed))S.placed=s.placed.filter(a=>BSIZE[a[0]]).map(a=>({k:'placed',e:a[0],x:a[1],y:a[2],s:BSIZE[a[0]],born:-9}))}catch(e){}
function save(){if(S.resetting)return;try{localStorage.setItem('magicland',JSON.stringify({stars:S.stars,char:S.char,outfit:S.outfit,placed:S.placed.map(p=>[p.e,p.x|0,p.y|0]),stickers:S.stickers,lv:S.lv}))}catch(e){}}

function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  Z=clamp(Math.min(W,H)/520,.6,1.5);
}
addEventListener('resize',resize);resize();

/* ---------- world layout ---------- */
const C={x:WW/2,y:520};                       // castle
const POND={x:760,y:1500,rx:300,ry:170};
const CAR={x:2500,y:1800,spin:0,k:'carousel'};
const RAIN={x:2760,y:1020,r:330};
const spawn={x:WW/2,y:WH-520};
const B=(t)=>{const p0={x:C.x,y:C.y+260},p1={x:C.x-800,y:1050},p2={x:C.x+800,y:1750},p3={x:spawn.x,y:spawn.y+60},u=1-t;
  return{x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y}};
const pathPts=[];for(let i=0;i<=40;i++)pathPts.push(B(i/40));

const DF={x:2900,y:1330};
const CAVE={k:'cave',x:3330,y:1750};
const SCHOOL={k:'school',x:560,y:640};
const DOORS=[{k:'door',x:300,y:900,to:1},{k:'door',x:3300,y:1100,to:0},{k:'door',x:1100,y:2250,to:3},{k:'door',x:2050,y:1400,to:2}];
const RES=[{x:DF.x,y:DF.y+60,r:300},{x:CAVE.x,y:CAVE.y,r:230},{x:SCHOOL.x,y:SCHOOL.y,r:220},...DOORS.map(d=>({x:d.x,y:d.y,r:110}))];
function free(x,y,r,strict){
  for(const q of RES)if(Math.hypot(x-q.x,y-q.y)<q.r+r)return false;
  if(x<130||x>WW-130||y<260||y>WH-130)return false;
  if(Math.hypot(x-C.x,(y-C.y-120)*1.3)<430)return false;
  if(((x-POND.x)/(POND.rx+r))**2+((y-POND.y)/(POND.ry+r))**2<1.1)return false;
  if(x>RAIN.x-RAIN.r-60&&x<RAIN.x+RAIN.r+60&&y>RAIN.y-200&&y<RAIN.y+60)return false;
  if(Math.hypot(x-CAR.x,y-CAR.y)<220)return false;
  if(strict){for(const p of pathPts)if(Math.hypot(x-p.x,y-p.y)<110+r)return false;
    if(Math.hypot(x-spawn.x,y-spawn.y)<220)return false}
  return true;
}
function place(n,r,strict,mk,arr){let g=0;while(arr.length<n&&g++<n*40){const x=rr(150,WW-150),y=rr(280,WH-150);if(free(x,y,r,strict))arr.push(mk(x,y))}}

const trees=[],flowers=[],stars=[],animals=[],butter=[],ducks=[],decor=[],tufts=[],blots=[],flies=[],clouds=[];
// border forest
for(let x=40;x<WW;x+=150){trees.push({k:'tree',x:x+rr(-30,30),y:rr(150,230),s:rr(200,260),e:'🌲',cool:0,shake:0});trees.push({k:'tree',x:x+rr(-30,30),y:WH-rr(20,90),s:rr(200,260),e:'🌲',cool:0,shake:0})}
for(let y=300;y<WH;y+=170){trees.push({k:'tree',x:rr(20,100),y:y+rr(-30,30),s:rr(200,260),e:'🌲',cool:0,shake:0});trees.push({k:'tree',x:WW-rr(20,100),y:y+rr(-30,30),s:rr(200,260),e:'🌲',cool:0,shake:0})}
place(70,60,true,(x,y)=>({k:'tree',x,y,s:rr(160,230),e:R()<.85?'🌳':'🌲',fruit:R()<.3,cool:0,shake:0}),trees);
// flower clusters
const FL=['🌸','🌼','🌷','🌺','🌻','💐'];
for(let c=0;c<34;c++){const cx=rr(200,WW-200),cy=rr(320,WH-200);if(!free(cx,cy,40,false))continue;const e=FL[Math.floor(R()*FL.length)];
  for(let i=0;i<9;i++){const x=cx+rr(-170,170),y=cy+rr(-120,120);if(free(x,y,10,false))flowers.push({k:'flower',x,y,e:R()<.7?e:FL[Math.floor(R()*FL.length)],s:rr(46,64),gone:0,born:-9})}}
place(30,30,false,(x,y)=>({k:'star',x,y,ph:rr(0,6),gone:0}),stars);
const PETS=['🐰','🐱','🐶','🦌','🐿️','🦔','🐑','🐻','🐼','🦊','🐹','🐥'];
place(14,40,false,(x,y)=>({k:'animal',e:pick(PETS),x,y,hx:x,hy:y,tx:x,ty:y,wait:rnd(0,3),hop:0,face:1,follow:false}),animals);
place(16,30,false,(x,y)=>({k:'bf',x,y,z:rr(50,120),a:rr(0,6),ph:rr(0,6),gone:0}),butter);
for(let i=0;i<4;i++)ducks.push({k:'duck',hx:POND.x+rr(-150,150),hy:POND.y+rr(-60,60),r:rr(30,70),a:rr(0,6),sp:rr(.3,.6),x:0,y:0,face:1,hop:0});
decor.push({k:'castle',x:C.x,y:C.y+200},CAR,{k:'fountain',x:C.x+10,y:C.y+470});
for(const h of[[3000,640],[3060,2000]])decor.push({k:'house',x:h[0],y:h[1]});
decor.push(SCHOOL,CAVE,...DOORS);
for(let i=0;i<700;i++)tufts.push({x:rr(0,WW),y:rr(0,WH),s:rr(8,16)});
for(let i=0;i<90;i++)blots.push({x:rr(0,WW),y:rr(0,WH),r:rr(120,320),c:R()<.5?'rgba(255,255,255,.07)':'rgba(40,160,70,.08)'});
for(let i=0;i<60;i++)flies.push({x:rr(0,WW),y:rr(200,WH),a:rr(0,6),ph:rr(0,6)});
for(let i=0;i<7;i++)clouds.push({x:rr(0,1400),y:rr(40,900),s:rr(80,170),v:rr(8,22)});

/* ---------- audio (all generated, no files) ---------- */
let AC=null,master=null,musicNext=0,mi=4;
const PENT=[0,2,4,7,9];
const nf=i=>262*Math.pow(2,(PENT[((i%5)+5)%5]+12*Math.floor(i/5))/12);
// iPhones mute Web Audio when the silent switch is on, and only start audio from a real touch.
// Fix: ask for "playback" audio, and loop a silent <audio> clip, which makes iOS treat us like a media app.
let silentEl=null;
function iosUnmute(){
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  if(silentEl)return;
  try{
    const n=800,b=new DataView(new ArrayBuffer(44+n*2));
    const w=(o,s)=>{for(let i=0;i<s.length;i++)b.setUint8(o+i,s.charCodeAt(i))};
    w(0,'RIFF');b.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);
    b.setUint32(24,8000,true);b.setUint32(28,16000,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,n*2,true);
    silentEl=new Audio(URL.createObjectURL(new Blob([b],{type:'audio/wav'})));
    silentEl.loop=true;silentEl.volume=.01;silentEl.setAttribute('playsinline','');
    silentEl.play().catch(()=>{silentEl=null});
  }catch(e){silentEl=null}
}
function audioInit(){
  if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.9;master.connect(AC.destination);
    AC.onstatechange=()=>{if(AC.state==='interrupted'||AC.state==='suspended')try{AC.resume()}catch(e){}}}catch(e){AC=null}}
  iosUnmute();
  if(AC&&AC.state!=='running'){try{AC.resume()}catch(e){}}
  if(AC&&!AC.unlocked){try{const s=AC.createBufferSource();s.buffer=AC.createBuffer(1,1,22050);s.connect(AC.destination);s.start(0);AC.unlocked=true}catch(e){}}
}
function tone(f,t0,d,type,v,slide){
  if(!AC||!S.sound)return;
  const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t0+d);
  g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v||.15,t0+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(g);g.connect(master);o.start(t0);o.stop(t0+d+.05);
}
const now=()=>AC?AC.currentTime:0;
const sfx={
  collect(){const n=nf(S.combo+5);tone(n,now(),.35,'sine',.18);tone(n*2,now()+.03,.25,'triangle',.07)},
  pop(){tone(520,now(),.12,'sine',.18,2.2)},
  boing(){tone(220,now(),.25,'sine',.2,2.5)},
  quack(){const t=now();tone(420,t,.1,'sawtooth',.07,.6);tone(380,t+.13,.12,'sawtooth',.07,.6)},
  mew(){const t=now();tone(600,t,.18,'sine',.14,1.5);tone(900,t+.18,.22,'sine',.14,.7)},
  blip(){tone(700,now(),.08,'square',.05,1.4);tone(900,now()+.09,.08,'square',.05,1.2)},
  giggle(){const t=now();for(let i=0;i<5;i++)tone(700+i*80+(i%2)*120,t+i*.07,.08,'triangle',.09)},
  gliss(up){const t=now();for(let i=0;i<10;i++)tone(nf(up?i+2:12-i),t+i*.05,.4,'sine',.1)},
  fanfare(){const t=now(),ns=[0,2,4,7,9,12];ns.forEach((n,i)=>tone(nf(n)*1,t+i*.11,.5,'triangle',.14));tone(nf(14),t+.7,.9,'sine',.14)},
  tune(){const t=now(),seq=[4,6,7,9,7,6,4,7,9,11,9,7];seq.forEach((n,i)=>tone(nf(n),t+i*.16,.3,'triangle',.1))},
  boom(){tone(120,now(),.35,'sine',.2,.4);tone(nf(11+Math.floor(Math.random()*4)),now()+.1,.6,'sine',.08)},
  splash(){tone(300+Math.random()*100,now(),.12,'sine',.07,1.8)}
};
function music(){
  if(!AC||!S.sound||S.t<musicNext||S.scene==='games')return;
  mi=clamp(mi+pick([-2,-1,-1,1,1,2]),-2,9);
  tone(nf(mi),now(),1.6,'triangle',.045);
  if(Math.random()<.3)tone(nf(mi)/2,now(),2,'sine',.03);
  musicNext=S.t+pick([.5,.5,1,1.5]);
}
let voice=null,speechOK=false;
function pickVoice(){   // prefer a British English voice (girls' names first); the high pitch in say() makes it sound like a child
  try{const vs=speechSynthesis.getVoices(),gb=vs.filter(v=>/^en[-_]GB/i.test(v.lang));
    voice=gb.find(v=>/serena|martha|kate|stephanie|amy|emma|female|libby|sonia/i.test(v.name))||gb.find(v=>!/daniel|oliver|arthur|male/i.test(v.name))||gb[0]
      ||vs.find(v=>/^en[-_](AU|IE|ZA|US)/i.test(v.lang)&&/samantha|karen|moira|female|zira|google/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null}catch(e){}}
if('speechSynthesis' in window){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}
function speechUnlock(){   // phones only allow speech once it has been started from a touch
  if(speechOK||!('speechSynthesis' in window))return;speechOK=true;
  try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch(e){}
}
const DBG=[];
function dbg(m){DBG.push(new Date().toTimeString().slice(3,8)+' '+m);if(DBG.length>14)DBG.shift()}
function say(txt){
  dbg('say: '+txt);
  if(window.ML&&ML.caption)ML.caption(txt);          // always show the words on screen too
  if(!S.sound){dbg(' muted');return}
  if(window.Voice&&Voice.say(txt)){dbg(' -> recording');return}
  if(window.Voice)Voice.stop();
  if(!('speechSynthesis' in window)){dbg(' no speechSynthesis');return}
  try{
    const ss=speechSynthesis;
    if(!voice)pickVoice();
    const u=new SpeechSynthesisUtterance(txt);
    u.pitch=1.5;u.rate=.95;u.volume=1;
    if(voice){u.voice=voice;u.lang=voice.lang}          // only set a language when we really have a matching voice
    u.onerror=e=>dbg(' tts error: '+(e.error||'?'));u.onstart=()=>dbg(' tts started');
    window.__utt=u;                                     // keep a reference so it is not garbage collected mid-sentence
    const go=()=>{try{ss.resume();ss.speak(u)}catch(e){dbg(' speak threw '+e.message)}};
    if(ss.speaking||ss.pending){ss.cancel();setTimeout(go,120)}else go();
  }catch(e){dbg(' say threw '+e.message)}
}

/* ---------- particles & timers ---------- */
const parts=[];const timers=[];
const later=(s,fn)=>timers.push({t:s,fn});
function sp(x,y,o){if(parts.length>700)parts.shift();parts.push(Object.assign({x,y,vx:0,vy:0,g:0,life:1,max:1,type:'s',c:'#fff',sz:10,rot:0,vr:0},o))}
const RB=['#ff4d6d','#ff9f1c','#ffd93d','#5ee06a','#4cc9f0','#7b6cff','#d96bff'];
function burst(x,y,n,cols,speed,kind){for(let i=0;i<n;i++){const a=rnd(0,6.28),v=rnd(.3,1)*speed;sp(x,y,{vx:Math.cos(a)*v,vy:Math.sin(a)*v-speed*.3,g:260,life:rnd(.6,1.2),max:1.2,type:kind||'s',c:pick(cols),sz:rnd(8,16),vr:rnd(-6,6)})}}
function hearts(x,y,n){for(let i=0;i<n;i++)sp(x+rnd(-30,30),y,{vx:rnd(-40,40),vy:rnd(-120,-70),life:1.4,max:1.4,type:'e',t:pick(['💖','💗','💕','💜']),sz:rnd(26,38)})}
function confetti(x,y,n){for(let i=0;i<n;i++)sp(x+rnd(-200,200),y-rnd(100,300),{vx:rnd(-60,60),vy:rnd(40,160),g:20,life:rnd(2,3.5),max:3.5,type:'c',c:pick(RB),sz:rnd(8,14),vr:rnd(-8,8)})}
function firework(x,y){const c=pick([RB,['#fff','#ffe66d','#ffd1f0'],['#4cc9f0','#fff','#b8f2ff']]);burst(x,y,46,c,rnd(220,320),'s');sfx.boom()}

/* ---------- scoring ---------- */
function toast(t,ms){const e=$('toast');e.textContent=t;e.classList.add('on');S.msgT=(ms||2000)/1000}
function hud(){$('stars').textContent='⭐ '+S.stars;$('pals').textContent='🐾 '+animals.filter(a=>a.follow).length}
function addStars(n){
  const before=S.stars;S.stars+=n;hud();save();
  const hit=Math.floor(S.stars/5)>Math.floor(before/5);
  if(hit){
    const big=Math.floor(S.stars/10)>Math.floor(before/10);
    const n5=Math.floor(S.stars/5)*5;
    toast((big?'Hooray! ':'')+n5+' stars! '+(big?'🎉':'⭐'),2400);say(n5+' stars!');
    if(big){sfx.fanfare();confetti(P.x,P.y,60);later(.2,()=>firework(P.x-120,P.y-260));later(.6,()=>firework(P.x+130,P.y-300))}
  }
}

/* ---------- input ---------- */
let held=false,ptrId=null;const ptr={x:0,y:0};
const toWorld=(sx,sy)=>({x:sx/Z+cam.x,y:sy/Z+cam.y});
function unlock(){audioInit();speechUnlock();if(AC&&window.Voice&&!Voice._p){Voice._p=1;Voice.init().then(()=>Voice.preload())}}
['touchstart','touchend','click','pointerup','pointerdown'].forEach(ev=>addEventListener(ev,unlock,{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AC){try{AC.resume()}catch(e){}if(silentEl)silentEl.play().catch(()=>{})}});
cv.addEventListener('pointerdown',e=>{
  e.preventDefault();unlock();
  if(!S.char)return;
  if(S.scene==='dress'){dressTap(e.clientX,e.clientY);return}
  if(S.scene==='cave'){caveTap(e.clientX,e.clientY);return}
  if(S.scene==='shower'){showerTap(e.clientX,e.clientY);return}
  if(S.scene)return;
  held=true;ptrId=e.pointerId;ptr.x=e.clientX;ptr.y=e.clientY;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  if(S.build){bt={x:ptr.x,y:ptr.y,t:performance.now(),moved:false};return}
  tapAt(toWorld(ptr.x,ptr.y));
});
cv.addEventListener('pointermove',e=>{if(held&&e.pointerId===ptrId){ptr.x=e.clientX;ptr.y=e.clientY;if(bt&&Math.hypot(ptr.x-bt.x,ptr.y-bt.y)>14)bt.moved=true}});
const rel=e=>{if(e.pointerId!==ptrId)return;held=false;
  if(S.build&&bt){const tap=!bt.moved&&performance.now()-bt.t<450;const p=toWorld(bt.x,bt.y);bt=null;if(tap){P.tx=null;placeAt(p)}}};
cv.addEventListener('pointerup',rel);cv.addEventListener('pointercancel',rel);
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>e.preventDefault());

function tapAt(w){
  if(Math.hypot(w.x-C.x,w.y-(C.y+130))<75){enterDress();return}
  // tapping a friend/duck/butterfly/you makes them react
  const hit=(o,r,dy)=>Math.hypot(o.x-w.x,(o.y-(dy||0))-w.y)<r;
  if(hit(P,70,45)){P.giggle=.6;P.hop=1;sfx.giggle();hearts(P.x,P.y-120,4);return}
  for(const a of animals)if(hit(a,70,40)){if(a.follow){openPet(a);return}a.hop=1;hearts(a.x,a.y-80,2);animalSound(a);return}
  for(const d of ducks)if(hit(d,60,20)){d.hop=1;sfx.quack();sp(d.x,d.y-50,{type:'e',t:'💦',vy:-60,life:.8,max:.8,sz:30});return}
  for(const b of butter)if(!b.gone&&hit(b,70,b.z)){catchButterfly(b);return}
  if(hit(CAR,150,90)&&S.carCool<=0){carouselRide();return}
}
function animalSound(a){a.e==='🐱'?sfx.mew():a.e==='🐶'?sfx.blip():sfx.pop()}

/* ---------- buttons ---------- */
function choose(c){
  S.char=c;$('pick').hidden=true;$('hud').hidden=false;
  $('magicIcon').textContent=c==='unicorn'?'🌈':'✨';
  P.x=spawn.x;P.y=spawn.y;P.tx=null;hist.length=0;
  audioInit();sfx.fanfare();save();
  const msg=c==='unicorn'?"You're a unicorn!":"You're a princess!";
  toast(msg+(c==='unicorn'?' 🦄':' 👸'),2600);say(msg);
  hearts(P.x,P.y-100,8);
  if(!Q.def)later(4,newQuest);
}
document.querySelectorAll('.card').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();choose(b.dataset.c)}));
$('dressBtn').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();unlock();enterDress()});
$('stars').addEventListener('pointerdown',e=>{e.stopPropagation();unlock();say('You have '+S.stars+' stars!');sfx.collect();toast('⭐ '+S.stars,1500)});
$('swap').addEventListener('pointerdown',e=>{e.stopPropagation();held=false;$('pick').hidden=false;$('hud').hidden=true;S.char=null;sfx.pop()});
function setSound(on){
  S.sound=on;
  document.querySelectorAll('.sndbtn').forEach(b=>{b.textContent=on?'🔊':'🔇'});
  if(!on){try{speechSynthesis.cancel()}catch(_){}if(window.Voice)Voice.stop()}else{audioInit();sfx.pop()}
}
document.querySelectorAll('.sndbtn').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();setSound(!S.sound)}));
$('magic').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();unlock();magic()});

function magic(){
  if(!S.char||S.magicCool>0)return;
  if(S.char==='unicorn'){
    S.magicCool=6;P.dash=3.2;P.hop=1;sfx.gliss(true);toast('Rainbow dash! 🌈',1400);say('Rainbow dash!');
    for(let i=0;i<40;i++)sp(P.x,P.y-60,{vx:rnd(-260,260),vy:rnd(-300,-40),g:300,life:rnd(.6,1.3),max:1.3,c:pick(RB),sz:rnd(8,18),vr:rnd(-8,8)});
  }else{
    S.magicCool=5;P.spin=1.3;sfx.gliss(true);toast('Magic bloom! 🌸',1400);say('Magic bloom!');
    let got=0;
    for(const f of flowers){if(Math.hypot(f.x-P.x,f.y-P.y)<330){if(f.gone){f.gone=0;f.born=S.t}}}
    for(let i=0;i<10&&flowers.length<340;i++){const a=rnd(0,6.28),d=rnd(90,300),x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d*.8;
      if(free(x,y,10,false)){flowers.push({k:'flower',x,y,e:pick(FL),s:rnd(50,68),gone:0,born:S.t+i*.07});got++}}
    for(let i=0;i<50;i++){const a=rnd(0,6.28),v=rnd(80,320);sp(P.x,P.y-50,{vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,life:rnd(.8,1.5),max:1.5,type:'e',t:pick(['✨','🌸','💖','⭐','🌷']),sz:rnd(20,34),g:-20})}
  }
}

/* ---------- interactions ---------- */
function collectFlower(f){
  f.gone=S.t;S.combo++;S.comboT=1.6;sfx.collect();
  burst(f.x,f.y-20,7,[RB[0],RB[2],RB[5],'#fff','#ffb3e1'],150);
  addStars(1);questEvent('flower',f.e);
}
function catchButterfly(b){
  b.gone=S.t;sfx.giggle();hearts(b.x,b.y-b.z,3);burst(b.x,b.y-b.z,12,RB,160);addStars(2);questEvent('bf');
}
function befriend(a){
  const n=animals.filter(x=>x.follow).length;
  a.hop=1;animalSound(a);hearts(a.x,a.y-80,4);
  if(n<8&&!a.follow){a.follow=true;a.name=pick(NAMES);a.happy=0;questEvent('friend');toast('New friend! '+a.e,1600);hud();addStars(3);
    // a fresh wild animal appears somewhere so the world stays full
    if(animals.filter(x=>!x.follow).length<10){const x=rr(300,WW-300),y=rr(400,WH-300);if(free(x,y,30,false))animals.push({k:'animal',e:pick(PETS),x,y,hx:x,hy:y,tx:x,ty:y,wait:1,hop:0,face:1,follow:false})}
  }else{a.befCool=3}
}
function party(){
  S.castleCool=40;questEvent('castle');toast('🏰 Royal party! 🎉',3200);sfx.tune();say('Royal party!');addStars(10);
  confetti(C.x,C.y+100,90);
  for(let i=0;i<8;i++)later(i*.45,()=>firework(C.x+rnd(-320,320),C.y-rnd(60,360)));
}
function carouselRide(){
  S.carCool=25;CAR.spin=5;questEvent('carousel');toast('Wheee! 🎠',2200);sfx.tune();say('Wheee!');addStars(5);
  for(let i=0;i<10;i++)later(i*.4,()=>hearts(CAR.x+rnd(-60,60),CAR.y-100,2));
}

/* ---------- update ---------- */
function update(dt){
  S.t+=dt;
  for(let i=timers.length-1;i>=0;i--){timers[i].t-=dt;if(timers[i].t<=0){const f=timers[i].fn;timers.splice(i,1);f()}}
  if(S.msgT>0){S.msgT-=dt;if(S.msgT<=0)$('toast').classList.remove('on')}
  S.night+=(S.nightT-S.night)*Math.min(1,dt*2);
  if(S.comboT>0){S.comboT-=dt;if(S.comboT<=0)S.combo=0}
  S.magicCool=Math.max(0,S.magicCool-dt);S.castleCool=Math.max(0,S.castleCool-dt);S.carCool=Math.max(0,S.carCool-dt);
  P.hop=Math.max(0,P.hop-dt*2.5);P.giggle=Math.max(0,P.giggle-dt);
  if(CAR.spin>0)CAR.spin-=dt;
  music();
  D.spin=Math.max(0,D.spin-dt);D.hop=Math.max(0,D.hop-dt*2.5);

  // ---- player movement ----
  if(S.char&&!S.scene){
    const lock=S.mode==='race'&&RC&&RC.state==='count';
    if(lock){P.tx=null}else if(held){const w=toWorld(ptr.x,ptr.y);P.tx=w.x;P.ty=w.y}
    let spd=S.char==='unicorn'?340:260;
    if(P.dash>0){spd*=2.2;P.dash-=dt}
    if(P.spin>0)P.spin-=dt;
    P.moving=false;
    if(P.tx!=null){
      const dx=P.tx-P.x,dy=P.ty-P.y,d=Math.hypot(dx,dy);
      if(d>14){const st=Math.min(d,spd*dt);P.x+=dx/d*st;P.y+=dy/d*st;P.moving=true;if(Math.abs(dx)>6)P.face=dx>0?1:-1}
      else if(!held){P.tx=null}
    }
    P.x=clamp(P.x,110,WW-110);P.y=clamp(P.y,300,WH-110);
    if(P.moving){hist.push({x:P.x,y:P.y});if(hist.length>600)hist.shift();
      if(S.char==='unicorn'){
        trail.push({x:P.x-P.face*72,y:P.y-48,t:S.t});if(trail.length>(P.dash>0?70:34))trail.shift();
      }else if(Math.random()<dt*9){sp(P.x+rnd(-20,20),P.y-20,{type:'e',t:pick(['✨','💖','🌸']),vy:-30,life:1,max:1,sz:rnd(18,28)})}
      P.hop+=0;
    }
    if(trail.length&&(!P.moving||S.char!=='unicorn')&&Math.random()<.5)trail.shift();
    if(P.dash>0&&Math.random()<.6)sp(P.x-P.face*60,P.y-50,{vx:rnd(-30,30),vy:rnd(-30,30),life:.5,max:.5,c:pick(RB),sz:rnd(10,20)});
  }

  // ---- followers ----
  let fi=0;
  for(const a of animals){
    if(!a.follow)continue;fi++;
    const h=hist[hist.length-1-fi*16]||hist[0]||P;
    const tx=h.x-(h.x===P.x?P.face*60*fi:0),ty=h.y;
    const ox=a.x;a.x+=(tx-a.x)*Math.min(1,dt*7);a.y+=(ty-a.y)*Math.min(1,dt*7);
    if(Math.abs(a.x-ox)>.4)a.face=a.x>ox?1:-1;
    a.moving=Math.hypot(tx-a.x,ty-a.y)>20;
  }

  // ---- wild animals wander ----
  for(const a of animals){
    a.hop=Math.max(0,a.hop-dt*2.5);if(a.befCool>0)a.befCool-=dt;
    if(a.follow)continue;
    if(a.wait>0){a.wait-=dt;a.moving=false}
    else{const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);
      if(d<8){a.wait=rnd(1.5,4.5);a.tx=clamp(a.hx+rnd(-260,260),150,WW-150);a.ty=clamp(a.hy+rnd(-200,200),320,WH-150);if(!free(a.tx,a.ty,10,false)){a.tx=a.x;a.ty=a.y}}
      else{const st=Math.min(d,70*dt);a.x+=dx/d*st;a.y+=dy/d*st;a.face=dx>0?1:-1;a.moving=true}}
    if(S.char&&!(a.befCool>0)&&Math.hypot(a.x-P.x,a.y-P.y)<85)befriend(a);
  }
  for(const d of ducks){d.a+=dt*d.sp;const ox=d.x;d.x=d.hx+Math.cos(d.a)*d.r*1.6;d.y=d.hy+Math.sin(d.a)*d.r*.6;d.face=d.x>=ox?1:-1;d.hop=Math.max(0,d.hop-dt*2.5)}
  for(const b of butter){
    if(b.gone){if(S.t-b.gone>4){b.gone=0;const x=rr(200,WW-200),y=rr(350,WH-200);b.x=x;b.y=y}continue}
    b.a+=rnd(-3,3)*dt;b.x+=Math.cos(b.a)*70*dt;b.y+=Math.sin(b.a)*45*dt;
    if(b.x<150||b.x>WW-150)b.a=Math.PI-b.a;if(b.y<320||b.y>WH-150)b.a=-b.a;
    if(S.char&&Math.hypot(b.x-P.x,b.y-b.z*.3-P.y+50)<75)catchButterfly(b);
  }
  for(const f of flies){f.a+=rnd(-2,2)*dt;f.x+=Math.cos(f.a)*30*dt;f.y+=Math.sin(f.a)*30*dt;f.x=clamp(f.x,0,WW);f.y=clamp(f.y,0,WH)}
  for(const c of clouds){c.x+=c.v*dt;if(c.x>W+300)c.x=-300}

  if(S.char&&!S.scene){
    for(const f of flowers){
      if(f.gone){if(S.t-f.gone>25){f.gone=0;f.born=S.t}continue}
      if(Math.abs(f.x-P.x)<58&&Math.abs(f.y-P.y)<58&&Math.hypot(f.x-P.x,f.y-P.y)<58&&S.t>f.born+.3)collectFlower(f);
    }
    for(const s of stars){
      if(s.gone){if(S.t-s.gone>40)s.gone=0;continue}
      if(Math.hypot(s.x-P.x,s.y-P.y)<75){s.gone=S.t;S.combo+=2;S.comboT=1.6;sfx.collect();burst(s.x,s.y-40,16,['#ffe66d','#fff','#ffd1f0'],200);addStars(3);questEvent('star')}
    }
    for(const t of trees){
      t.shake=Math.max(0,t.shake-dt*2);t.cool=Math.max(0,t.cool-dt);
      if(Math.abs(t.x-P.x)<80&&Math.abs(t.y-P.y)<50){
        if(t.cool<=0){t.shake=1;t.cool=t.fruit?18:6;sfx.pop();
          for(let i=0;i<6;i++)sp(t.x+rnd(-60,60),t.y-t.s*.7,{vx:rnd(-40,40),vy:rnd(0,60),g:200,life:1,max:1,type:'e',t:t.fruit?'🍎':'🍃',sz:26});
          if(t.fruit){addStars(2);toast('Yummy apples! 🍎',1200);questEvent('apple')}}}
    }
    if(S.castleCool<=0&&Math.hypot(P.x-C.x,(P.y-(C.y+230))*1.2)<260)party();
    if(S.carCool<=0&&Math.hypot(P.x-CAR.x,P.y-CAR.y)<130)carouselRide();
    // pond splashes
    if(P.moving&&((P.x-POND.x)/POND.rx)**2+((P.y-POND.y)/POND.ry)**2<1){
      if(S.t>(S.pondQ||0)){S.pondQ=S.t+15;questEvent('pond')}
      if(Math.random()<dt*14){sp(P.x+rnd(-30,30),P.y-5,{vx:rnd(-50,50),vy:rnd(-160,-80),g:420,life:.7,max:.7,c:'#bfeaff',type:'o',sz:rnd(5,9)});if(Math.random()<.3)sfx.splash()}
    }
    // walking under the rainbow
    if(Math.abs(P.x-RAIN.x)<RAIN.r+50&&P.y>RAIN.y-120&&P.y<RAIN.y+80){
      if(S.t>(S.rbQ||0)){S.rbQ=S.t+20;questEvent('rainbow')}
      S.rainT-=dt;if(S.rainT<=0){S.rainT=.12;sp(P.x+rnd(-90,90),P.y-rnd(150,300),{vx:rnd(-20,20),vy:rnd(60,140),life:1.4,max:1.4,c:pick(RB),sz:rnd(10,18),vr:3});if(Math.random()<.4)tone(nf(Math.floor(rnd(2,10))),now(),.5,'sine',.07)}
    }
  }

  featuresTick(dt);

  // ---- particles ----
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}
    p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt}

  // ---- camera ----
  const vw=W/Z,vh=H/Z;
  const tx=clamp(P.x-vw/2,0,Math.max(0,WW-vw)),ty=clamp(P.y-vh*.55,0,Math.max(0,WH-vh));
  const k=Math.min(1,dt*5);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;

  // ---- magic button ring ----
  const m=$('magic');
  if(S.char){const p=S.magicCool>0?1-S.magicCool/(S.char==='unicorn'?6:5):1;m.style.setProperty('--p',(p*360)+'deg');m.classList.toggle('ready',S.magicCool<=0)}
}
const trail=[];

/* ---------- drawing ---------- */
function shadow(x,y,w){ctx.fillStyle='rgba(0,50,0,.2)';ctx.beginPath();ctx.ellipse(x,y,w,w*.28,0,0,7);ctx.fill()}
function em(t,x,y,size){ctx.font=size+'px '+EF;ctx.fillText(t,x,y)}
function star4(x,y,r,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=i%2?r*.35:r;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}ctx.closePath();ctx.fill();ctx.restore()}
function pop(t){const x=clamp(t,0,1);return x<1?1+Math.sin(x*Math.PI)*.35-(1-x)*.9:1}

function drawGround(vx,vy,vw,vh){
  ctx.fillStyle=S.night>.5?'#6fc27a':'#8fe388';ctx.fillRect(vx-10,vy-10,vw+20,vh+20);
  for(const b of blots){if(b.x+b.r<vx||b.x-b.r>vx+vw||b.y+b.r<vy||b.y-b.r>vy+vh)continue;ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill()}
  // path
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();pathPts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.strokeStyle='#f3b9d4';ctx.lineWidth=150;ctx.stroke();
  ctx.strokeStyle='#ffe3ee';ctx.lineWidth=124;ctx.stroke();
  ctx.setLineDash([2,60]);ctx.strokeStyle='#fff';ctx.lineWidth=14;ctx.stroke();ctx.setLineDash([]);
  // castle plaza
  ctx.fillStyle='#ffe3ee';ctx.beginPath();ctx.ellipse(C.x,C.y+300,420,170,0,0,7);ctx.fill();
  // pond
  const g=ctx.createRadialGradient(POND.x,POND.y,20,POND.x,POND.y,POND.rx);g.addColorStop(0,'#8be1ff');g.addColorStop(1,'#3fa9f5');
  ctx.fillStyle='#d9f5ff';ctx.beginPath();ctx.ellipse(POND.x,POND.y,POND.rx+18,POND.ry+14,0,0,7);ctx.fill();
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(POND.x,POND.y,POND.rx,POND.ry,0,0,7);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=5;
  for(let i=0;i<4;i++){const a=S.t*.6+i*1.7;ctx.beginPath();ctx.ellipse(POND.x+Math.cos(a)*120,POND.y+Math.sin(a)*40,40,12,0,0,4.5);ctx.stroke()}
  for(const l of[[-170,50],[120,-70],[200,60],[-60,-90]]){ctx.fillStyle='#4cc66a';ctx.beginPath();ctx.ellipse(POND.x+l[0],POND.y+l[1],34,14,0,0.3,6.0);ctx.fill();ctx.fillStyle='#ff9ed2';ctx.beginPath();ctx.arc(POND.x+l[0]+6,POND.y+l[1]-4,7,0,7);ctx.fill()}
  // rainbow
  ctx.lineCap='butt';
  for(let i=0;i<7;i++){ctx.strokeStyle=RB[i];ctx.lineWidth=26;ctx.beginPath();ctx.ellipse(RAIN.x,RAIN.y,RAIN.r-i*24,RAIN.r*.9-i*22,0,Math.PI,0);ctx.stroke()}
  ctx.lineCap='round';
  // grass tufts
  ctx.strokeStyle='rgba(30,130,60,.35)';ctx.lineWidth=3;ctx.beginPath();
  for(const t of tufts){if(t.x<vx||t.x>vx+vw||t.y<vy||t.y>vy+vh)continue;ctx.moveTo(t.x-t.s*.5,t.y);ctx.lineTo(t.x-t.s*.7,t.y-t.s);ctx.moveTo(t.x,t.y);ctx.lineTo(t.x,t.y-t.s*1.2);ctx.moveTo(t.x+t.s*.5,t.y);ctx.lineTo(t.x+t.s*.7,t.y-t.s)}
  ctx.stroke();
}

function drawTrail(){
  if(trail.length<2)return;
  ctx.lineCap='round';
  const w=P.dash>0?11:7;
  for(let c=0;c<7;c++){
    for(let i=1;i<trail.length;i++){
      const a=trail[i-1],b=trail[i],age=S.t-b.t,al=clamp(1-age/(P.dash>0?1.6:.9),0,1);
      if(al<=0)continue;
      // offset each colour band perpendicular to the direction of travel
      let nx=-(b.y-a.y),ny=b.x-a.x;if(ny<0||(ny===0&&nx<0)){nx=-nx;ny=-ny}
      const nl=Math.hypot(nx,ny)||1;nx=nx/nl*(c-3)*w*.9;ny=ny/nl*(c-3)*w*.9;
      ctx.globalAlpha=al;ctx.strokeStyle=RB[c];ctx.lineWidth=w;
      ctx.beginPath();ctx.moveTo(a.x+nx,a.y+ny);ctx.lineTo(b.x+nx,b.y+ny);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
}

function drawEnt(e){
  switch(e.k){
    case 'tree':{
      const s=e.s,sw=Math.sin(S.t*28)*e.shake*6;
      shadow(e.x,e.y,s*.35);ctx.save();ctx.translate(e.x+sw,e.y);em(e.e,0,-s*.42,s);
      if(e.fruit){ctx.font=s*.2+'px '+EF;ctx.fillText('🍎',-s*.18,-s*.6);ctx.fillText('🍎',s*.16,-s*.45);ctx.fillText('🍎',-s*.02,-s*.82)}
      ctx.restore();break}
    case 'flower':{
      if(e.gone)break;const sc=pop((S.t-e.born)*2.5);if(S.t<e.born)break;
      ctx.save();ctx.translate(e.x,e.y);ctx.scale(sc,sc);ctx.rotate(Math.sin(S.t*2+e.x)*.06);
      if(S.night>.3){ctx.globalAlpha=S.night*.5;ctx.fillStyle='#fff7a8';ctx.beginPath();ctx.arc(0,-e.s*.4,e.s*.8,0,7);ctx.fill();ctx.globalAlpha=1}
      em(e.e,0,-e.s*.4,e.s);ctx.restore();break}
    case 'star':{
      if(e.gone)break;const b=Math.sin(S.t*3+e.ph)*10;
      shadow(e.x,e.y,22);ctx.fillStyle='rgba(255,240,120,.35)';ctx.beginPath();ctx.arc(e.x,e.y-60+b,42,0,7);ctx.fill();
      em('⭐',e.x,e.y-60+b,64);break}
    case 'animal':{
      const bob=(e.moving||e.follow&&e.moving?Math.abs(Math.sin(S.t*10+e.x*.01))*10:0)+Math.sin(e.hop*Math.PI)*45;
      shadow(e.x,e.y,28);ctx.save();ctx.translate(e.x,e.y-bob);ctx.scale(-e.face,1);em(e.e,0,-32,68);ctx.restore();
      if(e.follow){ctx.save();ctx.globalAlpha=.9;em('💗',e.x+14,e.y-bob-78,22);ctx.restore();
        ctx.font='700 20px "Chalkboard SE","Comic Sans MS",sans-serif';ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.fillStyle='#b44bd6';ctx.strokeText(e.name||'',e.x,e.y+18);ctx.fillText(e.name||'',e.x,e.y+18)}
      break}
    case 'duck':{
      const bob=Math.sin(S.t*3+e.a)*3+Math.sin(e.hop*Math.PI)*30;
      ctx.save();ctx.translate(e.x,e.y-bob);ctx.scale(-e.face,1);em('🦆',0,-18,58);ctx.restore();break}
    case 'bf':{
      if(e.gone)break;const fl=.5+.5*Math.abs(Math.sin(S.t*14+e.ph));
      shadow(e.x,e.y,12);ctx.save();ctx.translate(e.x,e.y-e.z+Math.sin(S.t*3+e.ph)*8);ctx.scale(fl,1);em('🦋',0,0,50);ctx.restore();break}
    case 'castle':shadow(e.x,e.y,300);em('🏰',e.x,e.y-190,420);
      {const pb=1+Math.sin(S.t*3)*.06;ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(e.x,e.y-70,46*pb,0,7);ctx.fill();ctx.strokeStyle='#ff6fb5';ctx.lineWidth=6;ctx.stroke();em('👗',e.x,e.y-68,56*pb)}
      if(S.night>.3){ctx.save();ctx.globalAlpha=S.night*.6;ctx.fillStyle='#ffe58a';for(const w of[[-70,-250],[0,-290],[75,-250],[-30,-160],[40,-160]]){ctx.beginPath();ctx.arc(e.x+w[0],e.y+w[1],12,0,7);ctx.fill()}ctx.restore()}
      break;
    case 'carousel':{shadow(e.x,e.y,100);ctx.save();ctx.translate(e.x,e.y-95);if(e.spin>0)ctx.rotate(Math.sin(S.t*8)*.08);em('🎠',0,0,210);ctx.restore();break}
    case 'fountain':shadow(e.x,e.y,70);em('⛲',e.x,e.y-70,150);break;
    case 'house':shadow(e.x,e.y,100);em('🏡',e.x,e.y-90,200);break;
    case 'school':shadow(e.x,e.y,120);em('🏫',e.x,e.y-110,230);
      {const pb=1+Math.sin(S.t*3)*.06;ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(e.x,e.y-220,34*pb,0,7);ctx.fill();ctx.strokeStyle='#4cc9f0';ctx.lineWidth=5;ctx.stroke();em('📚',e.x,e.y-218,40*pb)}break;
    case 'cave':drawCaveDoor(e);break;
    case 'door':drawMagicDoor(e);break;
    case 'placed':{const sc=pop((S.t-e.born)*2.5),fl=e.e==='🎈'?Math.sin(S.t*2+e.x)*10-60:0;
      shadow(e.x,e.y,e.s*.3);ctx.save();ctx.translate(e.x,e.y+fl);ctx.scale(sc,sc);em(e.e,0,-e.s*.42,e.s);ctx.restore();break}
    case 'rival':{const v=e,gal=Math.abs(Math.sin(S.t*12))*9;shadow(v.x,v.y,56);ctx.save();ctx.translate(v.x,v.y-gal);ctx.scale(v.face*.85,.85);
      paintUnicorn(ctx,S.t,RC&&RC.state==='go',false,{body:1,mane:1,horn:2,crown:1,wings:false,saddle:true,garland:false,aura:false});ctx.restore();break}
    case 'player':drawPlayer();break;
  }
}

/* Both characters are drawn with vector shapes (feet at 0,0, unicorn faces right). Outfit `o` comes from the dress-up room. */
function star4c(c,x,y,r,rot){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=i%2?r*.35:r;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}c.closePath();c.fill();c.restore()}

function wingPaint(c,x,y,rot,len,flap,alpha){
  c.save();c.translate(x,y);c.rotate(rot+flap);
  const g=c.createLinearGradient(0,0,len,0);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#ffc2ea');
  c.globalAlpha=alpha||.95;c.fillStyle=g;
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.5,-len*.6,len,-len*.1);c.quadraticCurveTo(len*.72,len*.08,len*.92,len*.3);c.quadraticCurveTo(len*.4,len*.28,0,0);c.fill();
  c.strokeStyle='rgba(255,140,210,.8)';c.lineWidth=2;c.stroke();
  c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.5;c.beginPath();c.moveTo(len*.15,-len*.05);c.quadraticCurveTo(len*.5,-len*.3,len*.85,-len*.08);c.stroke();
  c.restore();
}
function crownPaint(c,type,x,y,s,rot,t){
  if(type<0)return;
  c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);c.lineJoin='round';c.lineCap='round';
  if(type===0){
    c.fillStyle='#ffd84d';c.strokeStyle='#e3a91a';c.lineWidth=2;c.beginPath();c.moveTo(-15,0);c.lineTo(-17,-20);c.lineTo(-8,-11);c.lineTo(0,-24);c.lineTo(8,-11);c.lineTo(17,-20);c.lineTo(15,0);c.closePath();c.fill();c.stroke();
    c.fillStyle='#ff4d9d';c.beginPath();c.arc(0,-8,3.5,0,7);c.fill();c.fillStyle='#5ad1ff';c.beginPath();c.arc(-9,-5,2.4,0,7);c.arc(9,-5,2.4,0,7);c.fill();
  }else if(type===1){
    c.strokeStyle='#d6deee';c.lineWidth=4;c.beginPath();c.arc(0,4,17,Math.PI*1.12,Math.PI*1.88);c.stroke();
    c.fillStyle='#7be3ff';c.strokeStyle='#3aa6d8';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-24);c.lineTo(6,-16);c.lineTo(0,-8);c.lineTo(-6,-16);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff';for(const px of[-12,12]){c.beginPath();c.arc(px,-9,2.6,0,7);c.fill()}
  }else if(type===2){
    const cols=['#ff6fb5','#ffd93d','#ff9f1c','#c79bff','#ff6fb5'];
    for(let i=-2;i<=2;i++){const fx=i*8.5,fy=-(11-i*i*.9);c.fillStyle=cols[i+2];for(let k=0;k<5;k++){const a=k*1.2566;c.beginPath();c.arc(fx+Math.cos(a)*4,fy+Math.sin(a)*4,3.1,0,7);c.fill()}c.fillStyle='#fff6a8';c.beginPath();c.arc(fx,fy,2.6,0,7);c.fill()}
  }else if(type===3){
    c.fillStyle='#ff6fb5';c.strokeStyle='#e0408f';c.lineWidth=2;
    c.beginPath();c.moveTo(0,-6);c.lineTo(-20,-18);c.lineTo(-20,4);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(0,-6);c.lineTo(20,-18);c.lineTo(20,4);c.closePath();c.fill();c.stroke();
    c.beginPath();c.arc(0,-6,5.5,0,7);c.fill();c.stroke();c.fillStyle='#fff';for(const d of[[-12,-8],[12,-8]]){c.beginPath();c.arc(d[0],d[1],2,0,7);c.fill()}
  }
  c.restore();
}

function paintUnicorn(c,t,run,dash,o){
  o=o||DEF.unicorn;
  const bc=BODY[o.body]||BODY[0],mane=MANES[o.mane]||MANES[0],horn=HORNS[o.horn]||HORNS[0];
  const ph=t*(dash?18:12),sw=run?1:0.08;
  c.lineCap='round';c.lineJoin='round';
  const leg=(x,a,near)=>{
    c.save();c.translate(x,-50);c.rotate(Math.sin(ph+a)*.7*sw);
    if(near){c.strokeStyle=bc.o;c.lineWidth=17;c.beginPath();c.moveTo(0,0);c.lineTo(0,44);c.stroke()}
    c.strokeStyle=near?bc.f:bc.l;c.lineWidth=near?12:13;c.beginPath();c.moveTo(0,0);c.lineTo(0,44);c.stroke();
    c.fillStyle='#f5c542';c.beginPath();c.arc(0,47,7.5,0,7);c.fill();c.restore();
  };
  leg(-34,Math.PI,false);leg(32,0,false);
  if(o.wings){const fl=Math.sin(t*(run?10:3))*.18;wingPaint(c,-14,-98,-2.35,64,fl,.8);wingPaint(c,-2,-100,-1.95,84,-fl)}
  // tail
  for(let i=0;i<6;i++){c.strokeStyle=mane[i];c.lineWidth=9;c.beginPath();c.moveTo(-50,-84+i*4);
    c.bezierCurveTo(-88,-104+i*3,-108+Math.sin(t*5+i*.5)*8,-62,-92+Math.sin(t*5+i)*10,-20+i*2);c.stroke()}
  // body
  c.fillStyle=bc.f;c.strokeStyle=bc.o;c.lineWidth=3;c.beginPath();c.ellipse(0,-72,57,33,0,0,7);c.fill();c.stroke();
  c.fillStyle='rgba(255,140,200,.3)';c.beginPath();c.ellipse(-10,-62,22,12,0,0,7);c.fill();
  if(o.saddle){c.fillStyle='#ff6fb5';c.strokeStyle='#ffd84d';c.lineWidth=3;c.beginPath();c.ellipse(-2,-98,25,9,0,0,7);c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(-2,-98,3,0,7);c.fill()}
  leg(-30,0,true);leg(36,Math.PI,true);
  // neck
  c.strokeStyle=bc.o;c.lineWidth=36;c.beginPath();c.moveTo(38,-86);c.lineTo(58,-122);c.stroke();
  c.strokeStyle=bc.f;c.lineWidth=31;c.beginPath();c.moveTo(38,-86);c.lineTo(58,-122);c.stroke();
  // mane
  for(let i=0;i<7;i++){c.strokeStyle=mane[i];c.lineWidth=7;c.beginPath();c.moveTo(56+i,-152);
    c.bezierCurveTo(36+Math.sin(t*6+i)*4,-140+i*3,22,-112,24-i*1.5,-88+i*2.5);c.stroke()}
  if(o.garland){const gc=['#ff6fb5','#ffd93d','#c79bff','#ff9f1c','#5ee06a'];for(let i=0;i<6;i++){const u=i/5;c.fillStyle=gc[i%5];c.beginPath();c.arc(36+u*20+8,-86-u*34,6.5,0,7);c.fill();c.fillStyle='#fff6a8';c.beginPath();c.arc(36+u*20+8,-86-u*34,2.3,0,7);c.fill()}}
  // head
  c.fillStyle=bc.f;c.strokeStyle=bc.o;c.lineWidth=3;
  c.save();c.translate(74,-134);c.rotate(.25);c.beginPath();c.ellipse(0,0,27,19,0,0,7);c.fill();c.stroke();
  c.beginPath();c.ellipse(22,8,14,11,0,0,7);c.fill();c.stroke();c.restore();
  c.fillStyle='#ff9ec8';c.beginPath();c.arc(98,-124,3.5,0,7);c.fill();
  c.beginPath();c.arc(84,-127,6,0,7);c.globalAlpha=.55;c.fill();c.globalAlpha=1;
  c.fillStyle='#2b1b4d';c.beginPath();c.arc(78,-140,4.2,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(79.2,-141.3,1.5,0,7);c.fill();
  // ear
  c.fillStyle=bc.f;c.strokeStyle=bc.o;c.beginPath();c.moveTo(58,-146);c.lineTo(52,-168);c.lineTo(72,-152);c.closePath();c.fill();c.stroke();
  c.fillStyle='#ffb3d6';c.beginPath();c.moveTo(60,-150);c.lineTo(56,-163);c.lineTo(67,-153);c.fill();
  crownPaint(c,UCROWN[o.crown]===undefined?-1:UCROWN[o.crown],60,-153,.8,-.25,t);
  // horn
  let hf=horn.f;if(hf==='rainbow'){hf=c.createLinearGradient(68,-150,94,-212);RB5.forEach((cl,i)=>hf.addColorStop(i/4,cl))}
  c.fillStyle=hf;c.strokeStyle=horn.s;c.lineWidth=2;c.beginPath();c.moveTo(68,-150);c.lineTo(94,-212);c.lineTo(86,-148);c.closePath();c.fill();c.stroke();
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=3;for(let i=1;i<5;i++){const u=i/5;c.beginPath();c.moveTo(68+26*u-4,-150-62*u+6);c.lineTo(68+26*u+5,-150-62*u-4);c.stroke()}
  if(dash){c.fillStyle='#fff';star4c(c,98,-218,10+Math.sin(t*20)*3,t*4)}
  if(o.aura){c.fillStyle='#fff6b0';for(let i=0;i<6;i++){const a=t*1.3+i*1.05;star4c(c,10+Math.cos(a)*115,-100+Math.sin(a)*85,6+Math.sin(t*5+i)*3,t*3+i)}}
}

function paintPrincess(c,t,walk,o){
  o=o||DEF.princess;
  const hair=HAIRS[o.hair]||HAIRS[0],dress=DRESSES[o.dress]||DRESSES[0];
  const sway=(walk?Math.sin(t*12)*.07:Math.sin(t*2)*.02);
  c.lineCap='round';c.lineJoin='round';
  if(o.wings){const fl=Math.sin(t*(walk?10:3))*.16;
    c.save();wingPaint(c,6,-76,-.55,72,-fl);c.restore();
    c.save();c.scale(-1,1);wingPaint(c,6,-76,-.55,72,-fl);c.restore();
    c.save();wingPaint(c,6,-70,.35,46,fl,.8);c.restore();c.save();c.scale(-1,1);wingPaint(c,6,-70,.35,46,fl,.8);c.restore()}
  // long hair behind
  c.fillStyle=hair;c.beginPath();c.ellipse(0,-98,31,38,0,0,7);c.fill();
  c.beginPath();c.moveTo(-30,-98);c.quadraticCurveTo(-36,-60,-24,-56);c.lineTo(24,-56);c.quadraticCurveTo(36,-60,30,-98);c.fill();
  // shoes
  c.fillStyle='#ff6fb5';c.beginPath();c.ellipse(-14,-3,12,6,0,0,7);c.ellipse(14,-3,12,6,0,0,7);c.fill();
  // dress
  c.save();c.translate(0,-64);c.rotate(sway);
  const g=c.createLinearGradient(0,0,0,64);
  if(dress==='rainbow')RB5.forEach((cl,i)=>g.addColorStop(i/4,cl));else{g.addColorStop(0,dress[0]);g.addColorStop(1,dress[1])}
  c.fillStyle=g;
  c.beginPath();c.moveTo(-15,-8);c.lineTo(15,-8);c.quadraticCurveTo(26,30,52,58);
  for(let x=52;x>-52;x-=26)c.quadraticCurveTo(x-13,72,x-26,58);
  c.quadraticCurveTo(-26,30,-15,-8);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=3;c.stroke();
  c.fillStyle='#ffe66d';c.fillRect(-16,4,32,6);
  c.fillStyle='rgba(255,255,255,.85)';for(const d of[[-26,36],[0,44],[26,36],[-12,24],[14,26],[-38,54],[38,54],[0,60]]){c.beginPath();c.arc(d[0],d[1],3,0,7);c.fill()}
  c.restore();
  // arms
  c.strokeStyle='#ffdcc0';c.lineWidth=9;const ar=walk?Math.sin(t*12)*8:0;
  c.beginPath();c.moveTo(-14,-66);c.lineTo(-34,-48+ar);c.moveTo(14,-66);c.lineTo(o.wand?40:34,o.wand?-62:-48-ar);c.stroke();
  if(o.wand){c.strokeStyle='#ffd84d';c.lineWidth=4;c.beginPath();c.moveTo(38,-58);c.lineTo(56,-104);c.stroke();c.fillStyle='#ffe66d';star4c(c,57,-110,13+Math.sin(t*6)*2,t*2)}
  // head
  c.fillStyle='#ffdcc0';c.beginPath();c.arc(0,-92,23,0,7);c.fill();
  c.fillStyle=hair;c.beginPath();c.arc(0,-96,24,Math.PI*1.02,Math.PI*1.98);c.quadraticCurveTo(10,-104,-4,-100);c.quadraticCurveTo(-14,-98,-24,-90);c.fill();
  c.fillStyle='#3b2a63';c.beginPath();c.arc(-8,-91,3.2,0,7);c.arc(8,-91,3.2,0,7);c.fill();
  c.fillStyle='rgba(255,120,160,.5)';c.beginPath();c.arc(-14,-84,5,0,7);c.arc(14,-84,5,0,7);c.fill();
  c.strokeStyle='#c2506f';c.lineWidth=2.5;c.beginPath();c.arc(0,-84,6,.15*Math.PI,.85*Math.PI);c.stroke();
  crownPaint(c,PCROWN[o.crown]===undefined?0:PCROWN[o.crown],0,-110,1,0,t);
  if(o.aura){c.fillStyle='#fff6b0';for(let i=0;i<6;i++){const a=t*1.3+i*1.05;star4c(c,Math.cos(a)*70,-80+Math.sin(a)*70,5+Math.sin(t*5+i)*2.5,t*3+i)}}
}


function drawPlayer(){
  const uni=S.char==='unicorn';
  const gallop=P.moving?Math.abs(Math.sin(S.t*(P.dash>0?18:12)))*(uni?10:7):0;
  const hop=Math.sin(P.hop*Math.PI)*60;
  shadow(P.x,P.y,uni?62:42);
  ctx.save();ctx.translate(P.x,P.y-gallop-hop);
  const gl=ctx.createRadialGradient(0,-70,10,0,-70,130);gl.addColorStop(0,uni?'rgba(255,200,255,.5)':'rgba(255,240,150,.5)');gl.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,-70,130,0,7);ctx.fill();
  if(uni){
    ctx.scale(P.face*.9,.9);
    if(P.dash>0)ctx.rotate(-.08);
    paintUnicorn(ctx,S.t,P.moving,P.dash>0,S.outfit.unicorn);
  }else{
    let sx=1;
    if(P.spin>0)sx=Math.cos(P.spin*14);
    ctx.scale(sx*1.25,1.25);if(P.giggle>0)ctx.rotate(Math.sin(S.t*30)*.08);
    paintPrincess(ctx,S.t,P.moving||P.spin>0,S.outfit.princess);
  }
  ctx.restore();
}

function drawParticles(){
  for(const p of parts){
    const a=clamp(p.life/p.max*1.6,0,1);ctx.globalAlpha=a;
    if(p.type==='e'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);em(p.t,0,0,p.sz);ctx.restore()}
    else if(p.type==='c'){ctx.fillStyle=p.c;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.sz/2,-p.sz/4,p.sz,p.sz/2);ctx.restore()}
    else if(p.type==='o'){ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,7);ctx.fill()}
    else{ctx.fillStyle=p.c;star4(p.x,p.y,p.sz,p.rot)}
  }
  ctx.globalAlpha=1;
}

const vis=[];
function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const vw=W/Z,vh=H/Z,vx=cam.x,vy=cam.y;
  ctx.save();ctx.scale(Z,Z);ctx.translate(-vx,-vy);
  drawGround(vx,vy,vw,vh);
  drawTrail();
  drawWorldExtras(vx,vy,vw,vh);
  vis.length=0;
  const m=260;
  const add=e=>{if(e.x>vx-m&&e.x<vx+vw+m&&e.y>vy-60&&e.y<vy+vh+m+200)vis.push(e)};
  trees.forEach(add);flowers.forEach(add);stars.forEach(add);animals.forEach(add);ducks.forEach(add);butter.forEach(add);decor.forEach(add);S.placed.forEach(add);
  if(RC)vis.push(RC.rival);
  if(S.char)vis.push(P);
  vis.sort((a,b)=>a.y-b.y);
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const e of vis)drawEnt(e);
  drawParticles();
  ctx.restore();

  // soft clouds drifting overhead
  ctx.fillStyle='rgba(255,255,255,.22)';
  for(const c of clouds){ctx.beginPath();ctx.ellipse(c.x,c.y,c.s,c.s*.35,0,0,7);ctx.ellipse(c.x+c.s*.5,c.y+8,c.s*.7,c.s*.3,0,0,7);ctx.ellipse(c.x-c.s*.5,c.y+10,c.s*.6,c.s*.28,0,0,7);ctx.fill()}

  // night
  if(S.night>.01){
    const px=(P.x-vx)*Z,py=(P.y-60-vy)*Z,rad=Math.max(W,H)*.55;
    const g=ctx.createRadialGradient(px,py,40,px,py,rad);
    g.addColorStop(0,'rgba(20,10,80,'+(.1*S.night)+')');g.addColorStop(.35,'rgba(20,10,80,'+(.5*S.night)+')');g.addColorStop(1,'rgba(10,5,50,'+(.72*S.night)+')');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(const f of flies){const sx=(f.x-vx)*Z,sy=(f.y-vy)*Z;if(sx<-20||sx>W+20||sy<-20||sy>H+20)continue;
      const a=(.4+.6*Math.abs(Math.sin(S.t*2+f.ph)))*S.night;ctx.fillStyle='rgba(255,240,130,'+a+')';ctx.beginPath();ctx.arc(sx,sy,4*Z,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,240,130,'+a*.25+')';ctx.beginPath();ctx.arc(sx,sy,14*Z,0,7);ctx.fill()}
    ctx.globalCompositeOperation='source-over';
  }
  drawOverlays();
}

/* ---------- dress-up room (inside the castle) ---------- */
const D={spin:0,hop:0,cx:0,fy:0,sc:1,h:200,changed:false};let dtab=0;
const sw=a=>'linear-gradient(135deg,'+a[0]+','+a[1]+')';
const CATS={
  unicorn:[
    {key:'body',icon:'🎨',items:BODY.map(b=>({sw:b.f}))},
    {key:'mane',icon:'🌈',items:MANES.map(m=>({sw:'linear-gradient(90deg,'+m.join(',')+')'}))},
    {key:'horn',icon:'💎',items:HORNS.map(h=>({sw:h.f==='rainbow'?'linear-gradient(135deg,#ff4d6d,#ffd93d,#5ee06a,#4cc9f0,#d96bff)':h.f}))},
    {key:'crown',icon:'👑',items:[{e:'🚫'},{e:'👑'},{e:'🌸'},{e:'🎀'}]},
    {key:'extras',icon:'✨',toggle:1,items:[{k:'wings',e:'🧚'},{k:'saddle',e:'🎠'},{k:'garland',e:'🌺'},{k:'aura',e:'🌟'}]}],
  princess:[
    {key:'dress',icon:'👗',items:DRESSES.map(d=>({sw:d==='rainbow'?'linear-gradient(135deg,#ff4d6d,#ffd93d,#5ee06a,#4cc9f0,#d96bff)':sw(d)}))},
    {key:'hair',icon:'💇',items:HAIRS.map(h=>({sw:h}))},
    {key:'crown',icon:'👑',items:[{e:'👑'},{e:'💎'},{e:'🌸'},{e:'🎀'},{e:'🚫'}]},
    {key:'extras',icon:'✨',toggle:1,items:[{k:'wings',e:'🧚'},{k:'wand',e:'🪄'},{k:'aura',e:'🌟'}]}]
};
function mkBtn(cls,txt,fn){const b=document.createElement('button');b.className=cls;b.textContent=txt;b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();unlock();fn(b)});return b}
function buildDress(){
  const cats=CATS[S.char],tabs=$('dtabs'),items=$('ditems'),o=S.outfit[S.char];
  tabs.innerHTML='';items.innerHTML='';
  cats.forEach((cat,i)=>tabs.appendChild(mkBtn('tab'+(i===dtab?' on':''),cat.icon,()=>{dtab=i;sfx.pop();buildDress()})));
  tabs.appendChild(mkBtn('tab done','✅',leaveDress));
  const cat=cats[dtab];
  cat.items.forEach((it,i)=>{
    const b=mkBtn('opt'+((cat.toggle?o[it.k]:o[cat.key]===i)?' on':''),it.e||'',()=>{
      if(cat.toggle)o[it.k]=!o[it.k];else o[cat.key]=i;
      D.changed=true;save();S.combo=(S.combo+1)%8;sfx.collect();D.spin=S.char==='princess'?.9:0;D.hop=S.char==='unicorn'?1:0;
      burst(D.cx,D.fy-D.h*D.sc*.6,16,['#fff','#ffd1f0','#ffe66d','#c9a8ff'],220);buildDress();
    });
    if(it.sw)b.style.background=it.sw;
    items.appendChild(b);
  });
}
function enterDress(){
  if(!S.char||S.scene==='dress')return;
  S.scene='dress';held=false;P.tx=null;dtab=0;parts.length=0;D.changed=false;
  $('dress').hidden=false;buildDress();
  sfx.gliss(true);toast('Royal dress-up! 👑',2200);say('Welcome to the castle! Time to dress up!');
}
function leaveDress(){
  S.scene='';$('dress').hidden=true;parts.length=0;save();if(D.changed){D.changed=false;questEvent('dress')}
  toast('You look beautiful! 💖',2200);say('You look beautiful!');sfx.fanfare();hearts(P.x,P.y-120,8);
}
function dressTap(x,y){
  if(Math.abs(x-D.cx)<D.sc*110&&y>D.fy-D.h*D.sc-20&&y<D.fy+10){
    D.spin=S.char==='princess'?1.2:0;D.hop=1;sfx.giggle();hearts(D.cx,D.fy-D.h*D.sc,5);
  }
}
function mix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const A=p(a),B=p(b);return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'}
function archPath(x,top,ww,wh){ctx.beginPath();ctx.moveTo(x-ww/2,top+wh);ctx.lineTo(x-ww/2,top+ww/2);ctx.arc(x,top+ww/2,ww/2,Math.PI,0);ctx.lineTo(x+ww/2,top+wh);ctx.closePath()}
function drawRoom(fy,AW){
  const t=S.t,night=S.night;
  let g=ctx.createLinearGradient(0,0,0,fy);g.addColorStop(0,'#a98ee0');g.addColorStop(1,'#e8d6f7');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // stone bricks
  ctx.strokeStyle='rgba(110,70,170,.16)';ctx.lineWidth=2;ctx.beginPath();
  for(let r=0,y=0;y<fy;y+=48,r++){ctx.moveTo(0,y);ctx.lineTo(W,y);for(let x=(r%2?48:0);x<W;x+=96){ctx.moveTo(x,y);ctx.lineTo(x,Math.min(y+48,fy))}}
  ctx.stroke();
  // tall arched windows
  const xs=AW>820?[.12,.3,.7,.88]:[.2,.8],ww=Math.min(96,AW*.16),wt=fy*.14,wh=fy*.5;
  for(const f of xs){
    const x=AW*f;
    if(night<.5){ctx.fillStyle='rgba(255,250,200,'+(.16*(1-night*2))+')';ctx.beginPath();ctx.moveTo(x-ww/2,wt+wh);ctx.lineTo(x+ww/2,wt+wh);ctx.lineTo(x+ww*1.5,fy+20);ctx.lineTo(x-ww*.2,fy+20);ctx.fill()}
    ctx.save();archPath(x,wt,ww,wh);
    const sg=ctx.createLinearGradient(0,wt,0,wt+wh);sg.addColorStop(0,mix('#7fd2ff','#1a1860',night));sg.addColorStop(1,mix('#e3f6ff','#4a3a9a',night));
    ctx.fillStyle=sg;ctx.fill();ctx.clip();
    if(night>.15){ctx.fillStyle='rgba(255,255,255,'+night+')';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(x-ww/2+((i*37+f*100)%ww),wt+10+((i*53)%(wh*.6)),1.7,0,7);ctx.fill()}
      ctx.fillStyle='rgba(255,245,190,'+night+')';ctx.beginPath();ctx.arc(x+ww*.1,wt+ww*.5,ww*.14,0,7);ctx.fill()}
    else{ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(x+Math.sin(t*.3+f*9)*ww*.2,wt+wh*.45,ww*.3,ww*.1,0,0,7);ctx.fill()}
    ctx.restore();
    ctx.strokeStyle='#ffd84d';ctx.lineWidth=6;archPath(x,wt,ww,wh);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,wt);ctx.lineTo(x,wt+wh);ctx.moveTo(x-ww/2,wt+wh*.45);ctx.lineTo(x+ww/2,wt+wh*.45);ctx.stroke();
  }
  // banners
  for(const f of[.07,.93]){const x=AW*f+(f>.5?(W-AW):0);ctx.fillStyle='#ff6fb5';ctx.beginPath();ctx.moveTo(x-20,0);ctx.lineTo(x+20,0);ctx.lineTo(x+20,fy*.4);ctx.lineTo(x,fy*.4-18);ctx.lineTo(x-20,fy*.4);ctx.fill();ctx.fillStyle='#ffd84d';ctx.fillRect(x-20,0,40,8);em('⭐',x,fy*.18,22)}
  // chandelier
  const cx=AW/2,cy=fy*.1;
  ctx.strokeStyle='#caa43a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,cy);ctx.stroke();
  ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(cx,cy+8,52,12,0,0,Math.PI);ctx.stroke();
  for(let i=-2;i<=2;i++){const x=cx+i*21,y=cy+8+Math.sqrt(Math.max(0,1-(i*21/52)**2))*12,fl=.75+.25*Math.sin(t*8+i*2);
    ctx.fillStyle='#fff';ctx.fillRect(x-3,y-13,6,13);
    ctx.fillStyle='rgba(255,210,90,'+.28*fl+')';ctx.beginPath();ctx.arc(x,y-19,17,0,7);ctx.fill();
    ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.ellipse(x,y-19,3.2,5.5*fl,0,0,7);ctx.fill()}
  // floor, carpet
  const y0=fy-34;
  ctx.fillStyle='#f6dff0';ctx.fillRect(0,y0,W,H-y0);
  for(let y=y0,r=0,h=18;y<H;y+=h,h*=1.25,r++){const tw=h*2.4;for(let x=(r%2?-tw/2:0),k=0;x<W;x+=tw,k++)if((k+r)%2===0){ctx.fillStyle='#ffd0ea';ctx.fillRect(x,y,tw,h)}}
  ctx.fillStyle='#c9a2e8';ctx.fillRect(0,y0-8,W,10);
  const cw=Math.max(240,AW*.4);
  ctx.fillStyle='#e63a73';ctx.beginPath();ctx.moveTo(AW/2-100,y0+4);ctx.lineTo(AW/2+100,y0+4);ctx.lineTo(AW/2+cw,H);ctx.lineTo(AW/2-cw,H);ctx.fill();
  ctx.strokeStyle='#ffd84d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(AW/2-100,y0+4);ctx.lineTo(AW/2-cw,H);ctx.moveTo(AW/2+100,y0+4);ctx.lineTo(AW/2+cw,H);ctx.stroke();
  // vases with flowers
  for(const f of[.1,.9]){const x=AW*f+(f>.5?(W-AW):0);shadow(x,y0+8,28);em('💐',x,y0-22,64)}
  // floating glitter
  ctx.fillStyle='rgba(255,255,255,.75)';
  for(let i=0;i<22;i++){const x=(i*131+t*(8+i%5*3))%W,y=fy-((i*97+t*(14+i%4*4))%fy);star4(x,y,2.5+(i%3),t+i)}
}
function drawDress(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const pn=$('dress'),side=pn.offsetHeight>H*.7,AW=side?W-pn.offsetWidth:W;
  const fy=side?H-16:H-pn.offsetHeight-8;
  ctx.textAlign='center';ctx.textBaseline='middle';
  drawRoom(fy,AW);
  const uni=S.char==='unicorn';
  const sc=uni?clamp(Math.min((fy-100)/235,AW/250),.35,1.7):clamp(Math.min((fy-100)/145,AW/150),.45,2.6);
  D.cx=AW/2;D.fy=fy;D.sc=sc;D.h=uni?215:140;
  // soft spotlight under the character
  const sg=ctx.createRadialGradient(D.cx,fy,10,D.cx,fy,130*sc);sg.addColorStop(0,'rgba(255,255,255,.75)');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(D.cx,fy-4,130*sc,34*sc,0,0,7);ctx.fill();
  const hop=Math.sin(D.hop*Math.PI)*60*sc;
  ctx.save();ctx.translate(D.cx,fy-6-hop);
  if(uni){ctx.scale(sc,sc);paintUnicorn(ctx,S.t,false,false,S.outfit.unicorn)}
  else{ctx.scale((D.spin>0?Math.cos(D.spin*14):1)*sc,sc);paintPrincess(ctx,S.t,D.spin>0,S.outfit.princess)}
  ctx.restore();
  drawParticles();
}


/* =====================================================================
   MORE FUN: quests, learning, build, pets, paint, dance pads,
   mini-games, secret doors, treasure cave, weather
   ===================================================================== */
const NUM=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
const NAMES=['Biscuit','Sparkle','Pip','Daisy','Mochi','Peanut','Luna','Buttons','Waffles','Tinkle','Bubbles','Coco','Pumpkin','Sunny'];
function el(tag,cls,txt,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(parent)parent.appendChild(e);return e}
function tapBtn(b,fn){b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();unlock();fn(e)})}
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const rect=(x,y,w,h,r)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()};

/* ---------- UI plumbing ---------- */
let uiKey='';
function syncUI(){
  const k=[S.scene,S.mode,S.build,S.paint,!!S.char].join();
  if(k===uiKey)return;uiKey=k;
  $('hud').hidden=!S.char||S.build||S.scene==='dress'||S.scene==='cave'||S.scene==='shower';
  $('build').hidden=!S.build;
  $('gbar').hidden=!(S.mode||S.scene==='shower'||S.scene==='cave');
  $('paintPill').hidden=!(S.paint&&!S.scene&&!S.build);
}
function closeModal(){$('modal').hidden=true;$('mbox').innerHTML='';if(S.scene==='modal')S.scene='';PET=null;L=null}
function openMenu(){if(S.scene||S.build||!S.char)return;S.scene='modal';held=false;$('menu').hidden=false;$('mPaint').classList.toggle('on',S.paint);$('mNight').textContent=S.nightT?'☀️':'🌙'}
function closeMenu(){$('menu').hidden=true;if(S.scene==='modal')S.scene=''}
function toggleNight(){S.nightT=S.nightT?0:1;sfx.gliss(!S.nightT)}
function stopMode(){
  const wasCave=S.scene==='cave';
  S.mode='';SK=null;RC=null;SH=null;$('bignum').textContent='';$('ginfo').textContent='';
  if(S.scene==='shower'||S.scene==='cave'){S.scene='';if(wasCave){P.x=CAVE.x-20;P.y=CAVE.y+150;S.caveCool=6;P.tx=null}CV=null}
}
function bigNum(t){const b=$('bignum');b.textContent=t;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}

/* ---------- 2. quests ---------- */
const QDEF=[
  {t:'flower',icon:'🌸',n:3,say:'Pick three flowers!'},{t:'flower',icon:'🌸',n:5,say:'Pick five flowers!'},
  {t:'fl:🌺',icon:'🌺',n:2,say:'Find two red flowers!'},{t:'fl:🌻',icon:'🌻',n:2,say:'Find two yellow flowers!'},{t:'fl:🌷',icon:'🌷',n:2,say:'Find two tulips!'},{t:'fl:🌸',icon:'🌸',n:3,say:'Find three pink flowers!'},
  {t:'star',icon:'⭐',n:2,say:'Catch two floating stars!'},{t:'bf',icon:'🦋',n:2,say:'Catch two butterflies!'},
  {t:'friend',icon:'🐰',n:1,say:'Make a new friend!'},{t:'friend',icon:'🐾',n:2,say:'Make two new friends!'},
  {t:'apple',icon:'🍎',n:1,say:'Shake an apple tree!'},{t:'pond',icon:'🦆',n:1,say:'Go splash in the pond!'},
  {t:'rainbow',icon:'🌈',n:1,say:'Walk under the rainbow!'},{t:'castle',icon:'🏰',n:1,say:'Go to the castle for a party!'},
  {t:'carousel',icon:'🎠',n:1,say:'Take a ride on the carousel!'},{t:'dance',icon:'🪩',n:3,say:'Dance on three sparkly pads!'},
  {t:'door',icon:'🚪',n:1,say:'Find a magic door!'},{t:'cave',icon:'💎',n:1,say:'Find the treasure cave!'},
  {t:'dress',icon:'👗',n:1,say:'Go dress up in the castle!'},{t:'care',icon:'🤗',n:1,say:'Take care of a friend!'},
  {t:'game',icon:'🎮',n:1,say:'Play a game!'},{t:'build',icon:'🏡',n:2,say:'Build two things in your garden!'},
  {t:'learn',icon:'📚',n:1,say:'Go and play a learning game!'},{t:'paint',icon:'🎨',n:2,say:'Paint with your magic!'}
];
const Q={def:null,n:0,wait:0,done:0};
function renderQuest(){
  if(!Q.def)return;$('qi').textContent=Q.def.icon;
  let s='';for(let i=0;i<Q.def.n;i++)s+=i<Q.n?'●':'○';$('qd').textContent=s;
}
function newQuest(){
  let d;do{d=QDEF[Math.floor(Math.random()*QDEF.length)]}while(d===Q.def);
  Q.def=d;Q.n=0;Q.wait=0;renderQuest();$('quest').classList.remove('done');
  if(!S.scene)say(d.say);
}
function questEvent(t,arg){
  const d=Q.def;if(!d||Q.wait>0||!S.char)return;
  const ok=d.t===t||(t==='flower'&&d.t.startsWith('fl:')&&(d.t.slice(3)===arg||(d.t==='fl:🌻'&&arg==='🌼')));
  if(!ok)return;
  Q.n++;renderQuest();
  if(Q.n>=d.n){
    Q.wait=1;Q.done++;$('quest').classList.add('done');$('qd').textContent='🎉';
    toast('Quest done! 🎉',2400);say('You did it! Great job!');sfx.fanfare();confetti(P.x,P.y,50);addStars(5);
    later(4.5,newQuest);
  }else if(d.n>1)say(NUM[Q.n]+'!');
}
$('quest').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();unlock();if(Q.def&&Q.wait<=0)say(Q.def.say);sfx.pop()});

/* ---------- 3. learning (school) ---------- */
const LCOL=[['red','#ff4d4d'],['blue','#3a8dff'],['yellow','#ffd93d'],['green','#3fcf6e'],['pink','#ff8ad0'],['purple','#a96bff'],['orange','#ff9f1c']];
const LSHAPE={circle:'border-radius:50%',square:'border-radius:12%',triangle:'clip-path:polygon(50% 6%,96% 92%,4% 92%)',star:'clip-path:polygon(50% 2%,61% 36%,98% 36%,68% 57%,79% 92%,50% 71%,21% 92%,32% 57%,2% 36%,39% 36%)',diamond:'clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)'};
const LNAME={A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'eff',G:'gee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'are',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zee'};
const LCOUNT=[['🍎','apples'],['⭐','stars'],['🦋','butterflies'],['🐰','bunnies'],['🌸','flowers'],['🍓','strawberries']];
let L=null,PET=null;
function openLearn(){
  if(window.Hub){closeMenu();Hub.open();return}
  if(S.scene||S.build)return;
  S.scene='modal';held=false;L={r:0,lock:false};$('modal').hidden=false;learnNext();
}
function learnNext(){
  const box=$('mbox');box.innerHTML='';L.lock=false;
  const bar=el('div','mbar',null,box);
  const dots=el('div','mdots',null,bar);for(let i=0;i<5;i++)el('span',null,i<L.r?'⭐':'☆',dots);
  tapBtn(el('button','mx','✖',bar),closeModal);
  const prompt=el('div','mprompt',null,box);
  const type=pick(['count','count','color','color','letter','shape']);
  let ask='',opts=[];
  if(type==='count'){
    const n=1+Math.floor(Math.random()*6),it=pick(LCOUNT);
    prompt.textContent=it[0].repeat(n);prompt.classList.add('wrap');
    ask='How many '+it[1]+' can you count?';
    const set=new Set([n]);while(set.size<3)set.add(1+Math.floor(Math.random()*6));
    opts=[...set].map(v=>({ok:v===n,say:NUM[v],render:b=>{b.textContent=v}}));
  }else if(type==='color'){
    const cs=shuffle(LCOL.slice()).slice(0,3),t=cs[0];
    prompt.textContent='🎨';ask='Tap the '+t[0]+' one!';
    opts=cs.map(c=>({ok:c===t,say:c[0],render:b=>{b.classList.add('round');b.style.background=c[1]}}));
  }else if(type==='letter'){
    const ls=shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0,3),t=ls[0];
    prompt.textContent=t.toLowerCase();prompt.classList.add('letter');
    ask='Find the big letter '+LNAME[t]+'!';
    opts=ls.map(c=>({ok:c===t,say:LNAME[c],render:b=>{b.textContent=c}}));
  }else{
    const ss=shuffle(Object.keys(LSHAPE)).slice(0,3),t=ss[0];
    prompt.textContent='🔷';ask='Tap the '+t+'!';
    opts=ss.map(s=>({ok:s===t,say:s,render:b=>{const d=el('span','shp',null,b);d.style.cssText=LSHAPE[s]+';background:'+pick(['#ff6fb5','#4cc9f0','#ffb703','#8a5cff','#3fcf6e'])}}));
  }
  tapBtn(el('button','mspeak','🔊',box),()=>say(ask));
  const row=el('div','mopts',null,box);
  shuffle(opts).forEach(o=>{
    const b=el('button','mopt',null,row);o.render(b);
    tapBtn(b,()=>{
      if(L.lock)return;
      if(o.ok){
        L.lock=true;b.classList.add('good');sfx.collect();say(pick(['Yes!','Great job!','You got it!','Super!']));addStars(1);L.r++;
        setTimeout(()=>{if(!L)return;if(L.r>=5)endLearn();else learnNext()},1100);
      }else{b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');sfx.boing();say('Try again!')}
    });
  });
  setTimeout(()=>say(ask),250);
}
function endLearn(){
  closeModal();S.schoolCool=45;confetti(P.x,P.y,70);sfx.fanfare();toast('Super smart! 🧠⭐',2600);say('You are so smart!');addStars(5);
  questEvent('learn');questEvent('game');
}

/* ---------- 5. pets ---------- */
function openPet(a){
  if(S.scene&&S.scene!=='modal')return;
  if(!a){const f=animals.filter(x=>x.follow);if(!f.length){toast('Make a friend first! 🐰',2200);say('Make a friend first!');return}a=f[0]}
  S.scene='modal';held=false;PET=a;$('modal').hidden=false;petRender();say(a.name+'!');
}
function petRender(){
  const a=PET,box=$('mbox');box.innerHTML='';
  const fl=animals.filter(x=>x.follow),bar=el('div','mbar',null,box);
  if(fl.length>1)tapBtn(el('button','mx','◀',bar),()=>{PET=fl[(fl.indexOf(PET)+fl.length-1)%fl.length];petRender();say(PET.name)});
  el('div','pname',a.name,bar);
  if(fl.length>1)tapBtn(el('button','mx','▶',bar),()=>{PET=fl[(fl.indexOf(PET)+1)%fl.length];petRender();say(PET.name)});
  tapBtn(el('button','mx','✖',bar),closeModal);
  el('div','pbig',a.e,box).id='pbig';
  const hs=el('div','phearts',null,box);for(let i=0;i<5;i++)el('span',null,i<a.happy?'💖':'🤍',hs);
  const tools=el('div','mopts',null,box);
  [['🍎','Yum yum!'],['🛁','Splash splash!'],['🎀','So pretty!'],['🤗','Aww, I love you!']].forEach(t=>tapBtn(el('button','mopt',t[0],tools),()=>petCare(t[0],t[1])));
}
function petCare(icon,line){
  const a=PET;if(!a)return;
  a.happy=Math.min(5,a.happy+1);sfx.collect();say(line);
  const pb=$('pbig');pb.classList.remove('wig');void pb.offsetWidth;pb.classList.add('wig');
  for(let i=0;i<6;i++){const s=el('span','fx',icon,$('mbox'));s.style.left=(25+Math.random()*50)+'%';s.style.animationDelay=(i*.08)+'s';setTimeout(()=>s.remove(),1500)}
  document.querySelectorAll('.phearts span').forEach((h,i)=>{h.textContent=i<a.happy?'💖':'🤍'});
  if(a.happy>=5&&!a.cared){a.cared=true;addStars(5);toast(a.name+' is so happy! 💖',2600);say(a.name+' is so happy!');questEvent('care')}
}

/* ---------- 4. build your garden ---------- */
let bt=null;
function enterBuild(){
  if(S.scene||S.build)return;
  S.build=true;held=false;buildPanel();toast('🏡 Tap to build!',2200);say('Tap to build! Tap the trash can to take things away.');
}
function buildPanel(){
  const p=$('build');p.innerHTML='';const row=el('div','brow',null,p);
  BUILD.forEach(([e])=>tapBtn(el('button','opt sm'+(S.tool===e?' on':''),e,row),()=>{S.tool=e;sfx.pop();buildPanel()}));
  tapBtn(el('button','tab done','✅',row),leaveBuild);
}
function leaveBuild(){S.build=false;bt=null;save();toast('So pretty! 🏡',2000);say('So pretty!');sfx.fanfare()}
function placeAt(w){
  if(S.tool==='🗑️'){
    let bi=-1,bd=90;S.placed.forEach((p,i)=>{const d=Math.hypot(p.x-w.x,p.y-p.s*.4-w.y);if(d<bd){bd=d;bi=i}});
    if(bi>=0){const p=S.placed.splice(bi,1)[0];burst(p.x,p.y-p.s*.4,14,['#fff','#ddd','#bbb'],160,'o');sfx.pop();save()}
    return;
  }
  if(S.placed.length>=80){toast('So many things! 🎉',1500);return}
  S.placed.push({k:'placed',e:S.tool,x:w.x,y:w.y+BSIZE[S.tool]*.3,s:BSIZE[S.tool],born:S.t});
  burst(w.x,w.y,12,['#fff','#ffd1f0','#ffe66d'],170);sfx.collect();save();questEvent('build');
}

/* ---------- 6. paint + dance floor ---------- */
const paintDots=[];let pcount=0;
function paintStep(){
  const l=paintDots[paintDots.length-1];
  if(l&&Math.hypot(l.x-P.x,l.y-P.y)<24)return;
  paintDots.push({x:P.x-P.face*18,y:P.y-6,c:RB[pcount%7],s:rnd(13,20)});pcount++;
  if(paintDots.length>2500)paintDots.shift();
  if(pcount%40===0){questEvent('paint');sfx.pop()}
}
const pads=[];for(let r=0;r<2;r++)for(let c=0;c<3;c++)pads.push({x:DF.x+(c-1)*135,y:DF.y+r*135,i:r*3+c,glow:0,on:false});
const padHit=new Set();let padTimer=0;
function padTick(dt){
  padTimer-=dt;if(padTimer<=0)padHit.clear();
  for(const p of pads){
    p.glow=Math.max(0,p.glow-dt*1.6);
    const inside=Math.hypot(P.x-p.x,P.y-p.y)<62;
    if(inside&&!p.on){
      p.glow=1;const f=nf(p.i+3);tone(f,now(),.9,'sine',.2);tone(f*2,now()+.02,.5,'triangle',.07);
      burst(p.x,p.y-10,14,[RB[p.i],'#fff'],190);P.hop=.5;questEvent('dance');
      padHit.add(p.i);padTimer=12;
      if(padHit.size===6){padHit.clear();addStars(6);toast('Dance party! 🪩',2400);say('Dance party!');sfx.tune();confetti(DF.x,DF.y,50)}
    }
    p.on=inside;
  }
}

/* ---------- 7a. hide & seek ---------- */
let SK=null;
function startSeek(){
  if(S.scene||S.mode)return;
  const c=trees.filter(t=>t.x>350&&t.x<WW-350&&t.y>450&&t.y<WH-350&&Math.hypot(t.x-P.x,t.y-P.y)>600&&Math.hypot(t.x-P.x,t.y-P.y)<1500);
  const tree=pick(c.length?c:trees);
  SK={tree,pet:pick(['🐰','🐱','🐶','🐼','🦊','🐥']),ping:0};S.mode='seek';
  toast('🙈 Find me!',2400);say('I am hiding! Can you find me? Follow the arrow!');
}
function seekTick(dt){
  const t=SK.tree,d=Math.hypot(t.x-P.x,t.y-P.y);
  SK.ping-=dt;
  if(SK.ping<=0){SK.ping=clamp(d/800,.3,1.6);tone(500+(1-Math.min(1,d/1500))*800,now(),.14,'sine',.12)}
  if(d<700&&Math.random()<dt*6)sp(t.x+rnd(-70,70),t.y-rnd(40,200),{type:'e',t:'✨',vy:-30,life:1,max:1,sz:rnd(20,32)});
  if(d<110){
    sp(t.x,t.y-100,{type:'e',t:SK.pet,vy:-150,g:300,life:1.8,max:1.8,sz:90});
    confetti(t.x,t.y,50);sfx.fanfare();addStars(8);toast('You found me! 🎉',2600);say('You found me! Hooray!');questEvent('game');
    t.shake=1;S.mode='';SK=null;
  }
}

/* ---------- 7b. unicorn race (up the pink road to the castle) ---------- */
let RC=null;
const GATES=[34,27,20,13,6];
function startRace(){
  if(S.scene||S.mode)return;
  const a=pathPts[39],riv={k:'rival',x:a.x+70,y:a.y,seg:39,face:-1,run:true,tx:0,ty:0};
  P.x=a.x-70;P.y=a.y;P.tx=null;P.face=-1;hist.length=0;
  cam.x=clamp(P.x-W/Z/2,0,WW);cam.y=clamp(P.y-H/Z*.55,0,WH);
  RC={state:'count',t:3.99,last:4,gates:GATES.map(i=>({x:pathPts[i].x,y:pathPts[i].y,done:false})),next:0,rival:riv,over:false};
  S.mode='race';toast('🏁 Race to the castle!',2000);say('Race to the castle! Go through the gates!');
}
function raceTick(dt){
  const r=RC;
  if(r.state==='count'){
    r.t-=dt;const n=Math.ceil(r.t);
    if(n!==r.last&&n>=1){r.last=n;bigNum(String(n));sfx.pop();say(NUM[n])}
    if(r.t<=0){r.state='go';bigNum('GO!');say('Go!');sfx.fanfare();setTimeout(()=>{if(RC===r)$('bignum').textContent=''},900)}
    return;
  }
  const v=r.rival,tg=pathPts[Math.max(GATES[4],v.seg-1)];
  const dx=tg.x-v.x,dy=tg.y-v.y,d=Math.hypot(dx,dy);
  if(!r.over){
    if(d<14){v.seg--;}else{const st=Math.min(d,190*dt);v.x+=dx/d*st;v.y+=dy/d*st;v.face=dx>0?1:-1}
    if(v.seg<=GATES[4]+0){r.over=true;
      if(r.next<r.gates.length){S.mode='';toast('So close! Try again! 💪',2800);say('So close! Try again!');addStars(3);questEvent('game');RC=null;return}}
  }
  const g=r.gates[r.next];
  if(g&&Math.hypot(P.x-g.x,P.y-g.y)<110){
    g.done=true;r.next++;sfx.collect();burst(g.x,g.y-40,18,RB,220);
    if(r.next>=r.gates.length&&!r.over){
      S.mode='';RC=null;confetti(P.x,P.y,90);sfx.fanfare();addStars(15);toast('You win! 🏆',3000);say('You win! You are the fastest!');questEvent('game');
      later(.3,()=>firework(P.x-120,P.y-250));later(.7,()=>firework(P.x+120,P.y-280));
    }
  }
}

/* ---------- 7c. star shower ---------- */
let SH=null;
function startShower(){
  if(S.scene||S.mode)return;
  S.scene='shower';held=false;SH={t:25,items:[],spawn:.3,score:0,hop:0};parts.length=0;
  toast('🌠 Catch the stars!',2000);say('Tap the falling stars!');
}
function showerTick(dt){
  SH.t-=dt;SH.hop=Math.max(0,SH.hop-dt*3);SH.spawn-=dt;
  if(SH.spawn<=0){SH.spawn=Math.max(.32,.75-(25-SH.t)*.02);
    SH.items.push({x:rnd(50,W-50),y:-50,vy:rnd(120,190)+(25-SH.t)*5,e:pick(['⭐','⭐','⭐','💖','🌙']),sz:rnd(58,80),rot:rnd(-.4,.4)})}
  for(let i=SH.items.length-1;i>=0;i--){const it=SH.items[i];it.y+=it.vy*dt;it.rot+=dt*.5;if(it.y>H+80)SH.items.splice(i,1)}
  $('ginfo').textContent='⭐ '+SH.score+'   ⏱ '+Math.ceil(Math.max(0,SH.t));
  if(SH.t<=0){
    const sc=SH.score;stopMode();
    addStars(Math.min(25,sc));confetti(P.x,P.y,60);sfx.fanfare();toast('You caught '+sc+' stars! 🌠',3000);say('You caught '+sc+' stars! Great job!');questEvent('game');
  }
}
function showerTap(x,y){
  for(let i=SH.items.length-1;i>=0;i--){const it=SH.items[i];
    if(Math.hypot(it.x-x,it.y-y)<it.sz*.9){
      SH.items.splice(i,1);SH.score++;SH.hop=1;S.combo=SH.score%10;sfx.collect();burst(it.x,it.y,12,['#ffe66d','#fff','#ffd1f0'],200);return}}
}
function drawShower(){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#150f3d');g.addColorStop(.7,'#3b2a85');g.addColorStop(1,'#8a5cc8');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#fff';for(let i=0;i<40;i++){ctx.globalAlpha=.4+.5*Math.abs(Math.sin(S.t*1.5+i));ctx.beginPath();ctx.arc((i*97)%W,(i*61)%(H*.8),1.5+(i%3)*.6,0,7);ctx.fill()}ctx.globalAlpha=1;
  ctx.fillStyle='#fff4c2';ctx.beginPath();ctx.arc(W*.8,H*.14,32,0,7);ctx.fill();
  ctx.fillStyle='#2a1c63';ctx.beginPath();ctx.moveTo(0,H);ctx.quadraticCurveTo(W*.25,H*.82,W*.55,H*.92);ctx.quadraticCurveTo(W*.8,H*.8,W,H*.9);ctx.lineTo(W,H);ctx.fill();
  for(const it of SH.items){ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.rot);ctx.fillStyle='rgba(255,240,120,.3)';ctx.beginPath();ctx.arc(0,0,it.sz*.7,0,7);ctx.fill();em(it.e,0,0,it.sz);ctx.restore()}
  // her, cheering at the bottom
  const uni=S.char==='unicorn',sc=uni?.75:1.1;
  ctx.save();ctx.translate(W/2,H-24-Math.sin(SH.hop*Math.PI)*60);
  if(uni){ctx.scale(sc,sc);paintUnicorn(ctx,S.t,false,false,S.outfit.unicorn)}else{ctx.scale(sc,sc);paintPrincess(ctx,S.t,false,S.outfit.princess)}
  ctx.restore();
  drawParticles();
}

/* ---------- 8a. magic doors ---------- */
function doorTick(){
  if(S.doorCool>0)return;
  for(const d of DOORS)if(Math.hypot(P.x-d.x,P.y-d.y)<58){
    const to=DOORS[d.to];P.x=to.x;P.y=to.y+95;P.tx=null;hist.length=0;
    cam.x=clamp(P.x-W/Z/2,0,Math.max(0,WW-W/Z));cam.y=clamp(P.y-H/Z*.55,0,Math.max(0,WH-H/Z));
    S.doorCool=3;S.flash=1;sfx.gliss(true);toast('✨ Whoosh! ✨',1400);say('Whoosh!');burst(P.x,P.y-60,30,RB,260);questEvent('door');return;
  }
}

/* ---------- 8b. treasure cave ---------- */
let CV=null;
function enterCave(){
  if(S.scene||S.mode)return;
  S.scene='cave';held=false;parts.length=0;
  const items=shuffle(['💎','🪙','👑','🔑','🐚','🍬']);
  CV={rocks:items.map(e=>({e,open:0,shake:0,x:0,y:0,r:50})),found:0,done:false};$('ginfo').textContent='💎 0/6';
  sfx.gliss(false);toast('💎 Treasure cave!',2200);say('Wow, a treasure cave! Tap the sparkly rocks!');questEvent('cave');
}
function caveTap(x,y){
  if(!CV||CV.done)return;
  for(const r of CV.rocks)if(!r.open&&Math.hypot(r.x-x,r.y-y)<r.r*1.2){
    r.open=1;CV.found++;sfx.collect();burst(r.x,r.y-20,18,['#fff','#ffe66d','#c9a8ff'],220);addStars(2);
    $('ginfo').textContent='💎 '+CV.found+'/6';
    if(CV.found>=6){CV.done=true;confetti(W/2,H*.4,90);sfx.fanfare();addStars(15);toast('All the treasure! 🎁',3200);say('You found all the treasure!');
      setTimeout(()=>{if(CV)stopMode()},3600)}
    return;
  }
}
function drawCave(){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1d1238');g.addColorStop(1,'#4a2f7a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<8;i++){const x=(i*173+60)%W,y=H*.2+((i*89)%(H*.5)),c=RB[i%7];
    ctx.globalAlpha=.2+.15*Math.sin(S.t*2+i);ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,46,0,7);ctx.fill();ctx.globalAlpha=.9;
    ctx.beginPath();ctx.moveTo(x,y-28);ctx.lineTo(x+13,y);ctx.lineTo(x,y+16);ctx.lineTo(x-13,y);ctx.fill();ctx.globalAlpha=1}
  ctx.fillStyle='#2a1a50';for(let i=0;i<9;i++){const x=i*W/8,h=40+((i*37)%60)*1.3;ctx.beginPath();ctx.moveTo(x-30,0);ctx.lineTo(x+30,0);ctx.lineTo(x,h);ctx.fill()}
  ctx.fillStyle='#2f1d5c';ctx.beginPath();ctx.ellipse(W/2,H,W*.85,H*.2,0,0,7);ctx.fill();
  const r=Math.min(W/8,66);
  CV.rocks.forEach((rk,i)=>{
    rk.x=W*(.2+.3*(i%3));rk.y=H*(.4+.22*Math.floor(i/3));rk.r=r;
    if(rk.open)rk.open=Math.min(1.5,rk.open+.04);
    const o=rk.open>0;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(rk.x,rk.y+r*.7,r*1.2,r*.3,0,0,7);ctx.fill();
    ctx.fillStyle=o?'#6b5a8a':'#8b7aa8';ctx.beginPath();ctx.ellipse(rk.x,rk.y+4,r*1.1,r*.8,0,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.ellipse(rk.x-r*.3,rk.y-r*.25,r*.4,r*.2,-.4,0,7);ctx.fill();
    if(!o){ctx.fillStyle='#fff';ctx.globalAlpha=.5+.5*Math.sin(S.t*4+i*2);star4(rk.x+r*.35,rk.y-r*.3,9+Math.sin(S.t*3+i)*3,S.t+i);ctx.globalAlpha=1}
    else{const by=-Math.min(1,rk.open)*r*1.1-Math.abs(Math.sin(S.t*3+i))*8;ctx.fillStyle='rgba(255,240,120,.35)';ctx.beginPath();ctx.arc(rk.x,rk.y+by,r*.8,0,7);ctx.fill();em(rk.e,rk.x,rk.y+by,r*1.3)}
  });
  if(CV.found===0){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='700 22px '+EF;ctx.fillText('✨ tap the sparkly rocks ✨',W/2,H*.2)}
  drawParticles();
}
function drawCaveDoor(e){
  shadow(e.x,e.y,150);
  ctx.fillStyle='#8f86a8';ctx.beginPath();ctx.ellipse(e.x,e.y-70,150,110,0,Math.PI,0);ctx.lineTo(e.x+150,e.y);ctx.lineTo(e.x-150,e.y);ctx.fill();
  ctx.fillStyle='#a79fc0';ctx.beginPath();ctx.ellipse(e.x-60,e.y-110,50,28,-.3,0,7);ctx.fill();
  ctx.fillStyle='#1b1030';ctx.beginPath();ctx.ellipse(e.x,e.y-48,56,70,0,Math.PI,0);ctx.lineTo(e.x+56,e.y);ctx.lineTo(e.x-56,e.y);ctx.fill();
  for(let i=0;i<4;i++){const gx=e.x-90+i*60,c=RB[(i*2)%7];ctx.globalAlpha=.6+.4*Math.sin(S.t*3+i);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(gx,e.y-132);ctx.lineTo(gx+10,e.y-112);ctx.lineTo(gx,e.y-98);ctx.lineTo(gx-10,e.y-112);ctx.fill();ctx.globalAlpha=1}
  ctx.fillStyle='#fff';ctx.globalAlpha=.6+.4*Math.sin(S.t*4);star4(e.x,e.y-70,10,S.t);ctx.globalAlpha=1;
}
function drawMagicDoor(e){
  const gl=.5+.5*Math.sin(S.t*3+e.x);
  ctx.fillStyle='rgba(200,150,255,'+(.25+.2*gl)+')';ctx.beginPath();ctx.arc(e.x,e.y-55,70+gl*8,0,7);ctx.fill();
  ctx.fillStyle='#ffd84d';rect(e.x-33,e.y-118,66,118,28);ctx.fill();
  ctx.fillStyle='#7b4dd8';ctx.beginPath();ctx.moveTo(e.x-26,e.y);ctx.lineTo(e.x-26,e.y-92);ctx.arc(e.x,e.y-92,26,Math.PI,0);ctx.lineTo(e.x+26,e.y);ctx.fill();
  ctx.fillStyle='#ffe66d';ctx.beginPath();ctx.arc(e.x+14,e.y-48,5,0,7);ctx.fill();
  ctx.fillStyle='#fff';star4(e.x,e.y-78,9+gl*3,S.t*2);
}

/* ---------- 8c. weather: rain, puddles, snow ---------- */
const WX={type:'clear',t:50,drops:[],puddles:[],flakes:[],rainbowT:0,pT:0};
function weatherTick(dt){
  WX.t-=dt;
  if(WX.rainbowT>0)WX.rainbowT-=dt;
  if(WX.t<=0){
    if(WX.type==='clear'){
      if(Math.random()<.65){WX.type='rain';WX.t=rnd(28,40);toast('🌧️ It is raining!',2600);say('It is raining! Splash in the puddles!')}
      else{WX.type='snow';WX.t=rnd(28,40);toast('❄️ Snow!',2600);say('Look, it is snowing!');WX.puddles.length=0}
    }else{
      const wasRain=WX.type==='rain';WX.type='clear';WX.t=rnd(55,95);
      if(wasRain){WX.rainbowT=9;toast('A rainbow! 🌈',2800);say('Look, a rainbow!');sfx.gliss(true);addStars(3)}
    }
  }
  if(WX.type==='rain'){
    while(WX.drops.length<110)WX.drops.push({x:rnd(0,W),y:rnd(-H,H),v:rnd(900,1300)});
    for(const d of WX.drops){d.y+=d.v*dt;d.x-=d.v*.12*dt;if(d.y>H){d.y=-20;d.x=rnd(0,W*1.2)}}
    WX.pT-=dt;
    if(WX.pT<=0&&WX.puddles.length<14){WX.pT=.9;WX.puddles.push({x:cam.x+rnd(80,W/Z-80),y:cam.y+rnd(200,H/Z-60),r:rnd(45,80),age:0,cool:0})}
  }else WX.drops.length=0;
  if(WX.type==='snow'){
    while(WX.flakes.length<90)WX.flakes.push({x:rnd(0,W),y:rnd(-H,H),v:rnd(40,100),ph:rnd(0,6),r:rnd(2,5)});
    for(const f of WX.flakes){f.y+=f.v*dt;f.x+=Math.sin(S.t+f.ph)*20*dt;if(f.y>H){f.y=-10;f.x=rnd(0,W)}}
  }else WX.flakes.length=0;
  for(let i=WX.puddles.length-1;i>=0;i--){const p=WX.puddles[i];p.age+=dt;p.cool-=dt;
    if(WX.type!=='rain'&&p.age>70)WX.puddles.splice(i,1);
    else if(P.moving&&p.cool<=0&&((P.x-p.x)/p.r)**2+((P.y-p.y)/(p.r*.5))**2<1){
      p.cool=.22;sfx.splash();for(let k=0;k<6;k++)sp(P.x+rnd(-30,30),P.y-5,{vx:rnd(-90,90),vy:rnd(-220,-100),g:520,life:.7,max:.7,c:'#bfeaff',type:'o',sz:rnd(5,9)});
      if(Math.random()<.12){sp(p.x,p.y-30,{type:'e',t:'🐸',vy:-220,g:520,life:1,max:1,sz:46});sfx.blip()}}}
}
function drawWorldExtras(vx,vy,vw,vh){
  // painted dots
  for(const d of paintDots){if(d.x<vx-30||d.x>vx+vw+30||d.y<vy-30||d.y>vy+vh+30)continue;ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,d.s,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(d.x-d.s*.3,d.y-d.s*.3,d.s*.35,0,7);ctx.fill()}
  // puddles
  for(const p of WX.puddles){ctx.fillStyle='rgba(120,190,255,.55)';ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.5,0,0,7);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=3;const rp=(S.t*.8+p.x)%1;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r*(.3+rp*.6),p.r*.5*(.3+rp*.6),0,0,7);ctx.stroke()}
  // dance floor
  ctx.fillStyle='#3a2a6a';ctx.beginPath();ctx.ellipse(DF.x,DF.y+68,260,150,0,0,7);ctx.fill();
  ctx.strokeStyle='#ffd84d';ctx.lineWidth=6;ctx.stroke();
  for(const p of pads){
    ctx.globalAlpha=.55+.45*p.glow;ctx.fillStyle=RB[p.i];ctx.beginPath();ctx.ellipse(p.x,p.y,58+p.glow*8,36+p.glow*5,0,0,7);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=4;ctx.stroke();
    if(p.glow>0){ctx.fillStyle='rgba(255,255,255,'+p.glow*.5+')';ctx.beginPath();ctx.ellipse(p.x,p.y,70,44,0,0,7);ctx.fill()}
  }
  // race gates
  if(RC)RC.gates.forEach((g,i)=>{
    const act=i===RC.next,pl=act?1+Math.sin(S.t*6)*.08:1;
    ctx.lineWidth=14;ctx.strokeStyle=g.done?'rgba(255,215,80,.35)':act?'#ff6fb5':'rgba(255,255,255,.7)';
    ctx.beginPath();ctx.ellipse(g.x,g.y-70,90*pl,70*pl,0,0,7);ctx.stroke();
    if(act){ctx.strokeStyle='#ffd84d';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(g.x,g.y-70,98*pl,78*pl,0,0,7);ctx.stroke()}
    ctx.fillStyle=g.done?'#ffd84d':'#fff';star4(g.x,g.y-70,g.done?14:10,S.t);
  });
}
function drawPointer(tx,ty,icon,col){
  const sx=(tx-cam.x)*Z,sy=(ty-cam.y)*Z,dx=sx-W/2,dy=sy-H/2;
  const k=Math.min((W/2-46)/Math.abs(dx||1),(H/2-90)/Math.abs(dy||1));
  const on=k>=1;
  const px=on?sx:W/2+dx*k,py=on?sy-70:H/2+dy*k;
  ctx.save();ctx.translate(px,py+(on?Math.sin(S.t*6)*6:0));
  if(!on){ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(44,0);ctx.lineTo(18,-22);ctx.lineTo(18,22);ctx.fill();ctx.rotate(-Math.atan2(dy,dx))}
  ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(0,0,28,0,7);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=5;ctx.stroke();em(icon,0,2,32);ctx.restore();
}
function drawOverlays(){
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(WX.rainbowT>0){const a=Math.min(1,WX.rainbowT/2,(9-WX.rainbowT)/1.5);ctx.globalAlpha=Math.max(0,a)*.75;ctx.lineCap='butt';
    for(let i=0;i<7;i++){ctx.strokeStyle=RB[i];ctx.lineWidth=Math.max(14,W*.03);ctx.beginPath();ctx.ellipse(W/2,H*.62,W*.55-i*W*.03,H*.5-i*W*.03,0,Math.PI,0);ctx.stroke()}ctx.globalAlpha=1;ctx.lineCap='round'}
  if(WX.type==='rain'){
    ctx.fillStyle='rgba(50,70,120,.14)';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(200,225,255,.65)';ctx.lineWidth=2;ctx.beginPath();for(const d of WX.drops){ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+3,d.y+16)}ctx.stroke();
  }
  if(WX.type==='snow'){
    ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,.9)';for(const f of WX.flakes){ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill()}
  }
  if(S.mode==='seek'&&SK)drawPointer(SK.tree.x,SK.tree.y-60,'🙈','#ff6fb5');
  if(S.mode==='race'&&RC&&RC.gates[RC.next])drawPointer(RC.gates[RC.next].x,RC.gates[RC.next].y-70,'🏁','#ffb703');
  if(S.flash>0){ctx.fillStyle='rgba(255,255,255,'+S.flash+')';ctx.fillRect(0,0,W,H)}
}

/* ---------- per-frame hook ---------- */
function featuresTick(dt){
  if(S.flash>0)S.flash=Math.max(0,S.flash-dt*1.6);
  S.doorCool=Math.max(0,S.doorCool-dt);S.caveCool=Math.max(0,S.caveCool-dt);S.schoolCool=Math.max(0,S.schoolCool-dt);
  if(SH)showerTick(dt);
  if(!S.char||S.scene)return;
  weatherTick(dt);
  if(S.paint&&P.moving)paintStep();
  padTick(dt);doorTick();
  if(S.mode==='seek'&&SK)seekTick(dt);
  if(S.mode==='race'&&RC)raceTick(dt);
  if(S.caveCool<=0&&!S.mode&&Math.hypot(P.x-CAVE.x,P.y-(CAVE.y-30))<85)enterCave();
  if(S.schoolCool<=0&&!S.mode&&Math.hypot(P.x-SCHOOL.x,P.y-SCHOOL.y)<110){S.schoolCool=45;openLearn()}
  if(S.mode==='seek')$('ginfo').textContent='🙈 Find me!';
  if(S.mode==='race'&&RC)$('ginfo').textContent='🏁 '+RC.next+'/'+RC.gates.length;
}

/* ---------- menu + buttons ---------- */
$('menuBtn').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();unlock();sfx.pop();openMenu()});
$('menuX').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();closeMenu()});
$('paintPill').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();S.paint=false;sfx.pop()});
$('gstop').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();sfx.pop();stopMode()});
document.querySelectorAll('#menu [data-m]').forEach(b=>tapBtn(b,()=>{
  const m=b.dataset.m;closeMenu();
  if(m==='paint'){S.paint=!S.paint;toast(S.paint?'🎨 Paint on!':'🎨 Paint off',1500);say(S.paint?'Paint on! Walk to paint!':'Paint off')}
  else if(m==='clean'){paintDots.length=0;sfx.splash();toast('🧽 All clean!',1500)}
  else if(m==='night')toggleNight();
  else if(m==='build')enterBuild();
  else if(m==='shower')startShower();
  else if(m==='seek')startSeek();
  else if(m==='race')startRace();
  else if(m==='learn')openLearn();
  else if(m==='pets')openPet(null);
}));
$('pals').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();unlock();openPet(null)});

/* ---------- start over (hold the button) ---------- */
let rsT=null;
const rsBtn=$('reset');
function rsCancel(){clearTimeout(rsT);rsT=null;rsBtn.classList.remove('hold')}
rsBtn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();unlock();rsBtn.classList.add('hold');
  rsT=setTimeout(()=>{S.resetting=true;try{localStorage.removeItem('magicland')}catch(_){}say('Starting over!');setTimeout(()=>location.reload(),350)},1800)});
['pointerup','pointerleave','pointercancel'].forEach(ev=>rsBtn.addEventListener(ev,rsCancel));


/* ---------- pick-screen previews (animated) ---------- */
const pu=$('pu').getContext('2d'),pp=$('pp').getContext('2d');
function previews(){
  if($('pick').hidden)return;
  pu.clearRect(0,0,440,440);pp.clearRect(0,0,440,440);
  pu.save();pu.translate(215,360);pu.scale(1.5,1.5);paintUnicorn(pu,S.t,false,false,S.outfit.unicorn);pu.restore();
  pp.save();pp.translate(220,370);pp.scale(2.3,2.3);paintPrincess(pp,S.t,false,S.outfit.princess);pp.restore();
}

/* ---------- main loop ---------- */
let last=performance.now();
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  update(dt);syncUI();if(S.scene==='games'){}else if(S.scene==='dress')drawDress();else if(S.scene==='cave'&&CV)drawCave();else if(S.scene==='shower'&&SH)drawShower();else draw();previews();
  requestAnimationFrame(frame);
}
hud();
// start the camera on the spawn point
cam.x=clamp(P.x-W/Z/2,0,WW);cam.y=clamp(P.y-H/Z*.55,0,WH);
requestAnimationFrame(frame);

// bridge for the learning games (js/engine.js, js/hub.js, js/games/*)
window.ML={dbgLog:()=>DBG,dbg,setSound,S,P,audio:()=>AC?{ac:AC,out:master}:null,say,sfx,tone,nf,now,toast,unlock,save,hud,burst,hearts,confetti,questEvent,pick,shuffle,
  addStarsQuiet:n=>{S.stars+=n;hud();save()}};
// debug hook for testing
window.__game={S,P,animals,flowers,choose,Q,WX,questEvent,openLearn,startRace,startSeek,startShower,enterCave,enterBuild,openPet,pads,DOORS,CAVE,SCHOOL,DF};

/* ---------- offline support ---------- */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
})();
