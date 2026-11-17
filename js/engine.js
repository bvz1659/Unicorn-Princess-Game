/* Mini game engine for the learning games: canvas stage, drawing kit, drag helper, tweens, particles, rewards. */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const ML=g.ML;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const EF='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const FONT='"Chalkboard SE","Marker Felt","Comic Sans MS","Arial Rounded MT Bold",sans-serif';
const RB=['#ff4d6d','#ff9f1c','#ffd93d','#5ee06a','#4cc9f0','#7b6cff','#d96bff'];

/* ================= drawing kit ================= */
const SHAPE_COL={circle:['#ff8a8a','#e04848'],square:['#6cc0ff','#2a85d8'],triangle:['#7be08a','#38b04c'],star:['#ffe46b','#f0b400'],heart:['#ff9ccf','#e0509b'],diamond:['#c9adff','#8a5de0'],rectangle:['#ffbb77','#e8832a'],oval:['#6eecd0','#22b894']};
const FACE_Y={triangle:.3,heart:.0,star:.06,oval:0,diamond:0};
function rrect(c,x,y,w,h,r){c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function shapePath(c,t,r){
  c.beginPath();
  switch(t){
    case'circle':c.arc(0,0,r,0,TAU);break;
    case'square':{const h=r*.86;rrect(c,-h,-h,2*h,2*h,r*.2);break}
    case'rectangle':{const w=r*1.12,h=r*.66;rrect(c,-w,-h,2*w,2*h,r*.17);break}
    case'triangle':c.moveTo(0,-r);c.lineTo(r*1.04,r*.8);c.lineTo(-r*1.04,r*.8);c.closePath();break;
    case'star':for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.5:r;c.lineTo(Math.cos(a)*q,Math.sin(a)*q)}c.closePath();break;
    case'heart':c.moveTo(0,r*.88);c.bezierCurveTo(-r*1.4,r*.1,-r*.95,-r*.98,0,-r*.36);c.bezierCurveTo(r*.95,-r*.98,r*1.4,r*.1,0,r*.88);c.closePath();break;
    case'diamond':c.moveTo(0,-r);c.lineTo(r*.74,0);c.lineTo(0,r);c.lineTo(-r*.74,0);c.closePath();break;
    case'oval':c.ellipse(0,0,r*1.18,r*.72,0,0,TAU);break;
  }
}
function drawFace(c,s,mood,t){
  const blink=(Math.sin((t||0)*1.7)>.985)?.15:1,ey=-s*.1,ex=s*.27;
  c.save();c.lineCap='round';
  for(const sx of[-1,1]){
    c.fillStyle='#fff';c.beginPath();c.ellipse(sx*ex,ey,s*.17,s*.19*blink,0,0,TAU);c.fill();
    c.fillStyle='#2b1b4d';c.beginPath();c.ellipse(sx*ex+s*.02,ey+s*.02,s*.09,s*.1*blink,0,0,TAU);c.fill();
    c.fillStyle='rgba(255,110,150,.45)';c.beginPath();c.arc(sx*ex*1.35,ey+s*.28,s*.1,0,TAU);c.fill();
  }
  c.strokeStyle='#2b1b4d';c.lineWidth=Math.max(2,s*.06);c.fillStyle='#7a1e3a';
  c.beginPath();
  if(mood==='wow'){c.ellipse(0,ey+s*.4,s*.09,s*.12,0,0,TAU);c.fill()}
  else if(mood==='sad'){c.arc(0,ey+s*.55,s*.14,Math.PI*1.15,Math.PI*1.85);c.stroke()}
  else{c.arc(0,ey+s*.22,s*.2,.15*Math.PI,.85*Math.PI);c.stroke()}
  c.restore();
}
/* o: rot, face('happy'|'wow'|'sad'), silhouette, alpha, t, color(override fill pair), sx */
function drawShape(c,t,x,y,r,o){
  o=o||{};
  c.save();c.translate(x,y);if(o.rot)c.rotate(o.rot);if(o.sx)c.scale(o.sx,o.sy||o.sx);if(o.alpha!=null)c.globalAlpha=o.alpha;
  shapePath(c,t,r);
  if(o.silhouette){
    c.fillStyle='rgba(70,40,120,.26)';c.fill();c.setLineDash([r*.18,r*.14]);c.lineWidth=Math.max(3,r*.07);c.strokeStyle='rgba(255,255,255,.85)';c.lineJoin='round';c.stroke();c.setLineDash([]);
  }else{
    const col=o.color||SHAPE_COL[t],gr=c.createLinearGradient(0,-r,0,r);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);
    c.fillStyle=gr;c.fill();c.lineJoin='round';c.lineWidth=Math.max(3,r*.08);c.strokeStyle=col[1];c.stroke();
    c.save();c.clip();c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.ellipse(-r*.28,-r*.5,r*.55,r*.2,-.5,0,TAU);c.fill();c.restore();
    if(o.face){c.translate(0,r*(FACE_Y[t]||0));drawFace(c,r*.8,o.face,o.t)}
  }
  c.restore();
}
function drawNum(c,n,x,y,size,col){
  c.save();c.font='900 '+size+'px '+FONT;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  c.lineWidth=size*.16;c.strokeStyle='#fff';c.strokeText(n,x,y+size*.04);
  c.lineWidth=size*.06;c.strokeStyle=col?shade(col):'#7a3a9a';c.strokeText(n,x,y+size*.04);
  c.fillStyle=col||'#b44bd6';c.fillText(n,x,y+size*.04);c.restore();
}
function shade(hex){const n=parseInt(hex.slice(1),16),f=.72;return'rgb('+((n>>16&255)*f|0)+','+((n>>8&255)*f|0)+','+((n&255)*f|0)+')'}
function em(c,t,x,y,size){c.save();c.font=size+'px '+EF;c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y);c.restore()}
function pill(c,x,y,w,h,fill,stroke){c.beginPath();rrect(c,x-w/2,y-h/2,w,h,h/2);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=4;c.strokeStyle=stroke;c.stroke()}}
function star4(c,x,y,r,rot){c.save();c.translate(x,y);c.rotate(rot||0);c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?r*.35:r;c.lineTo(Math.cos(a)*q,Math.sin(a)*q)}c.closePath();c.fill();c.restore()}
function bgFill(c,W,H,kind,t){
  const K={sky:['#7fd2ff','#e6f7ff'],meadow:['#a6ecaa','#e5fbd6'],night:['#2b2370','#7458c4'],pink:['#ffbfe3','#fff1fa'],clinic:['#b9ecff','#fff3fa'],warm:['#ffdc96','#fff7e0'],lilac:['#d0b8ff','#f6eeff']};
  const k=K[kind]||K.sky,gr=c.createLinearGradient(0,0,0,H);gr.addColorStop(0,k[0]);gr.addColorStop(1,k[1]);c.fillStyle=gr;c.fillRect(0,0,W,H);
  if(kind==='sky'||kind==='meadow'||kind==='lilac'){
    c.fillStyle='rgba(255,255,255,.75)';
    for(let i=0;i<4;i++){const x=((i*257+t*(8+i*3))%(W+300))-150,y=H*(.08+.07*i);c.beginPath();c.ellipse(x,y,70,24,0,0,TAU);c.ellipse(x+40,y+6,55,20,0,0,TAU);c.ellipse(x-40,y+8,50,18,0,0,TAU);c.fill()}
    c.fillStyle=kind==='lilac'?'#c9b0f5':'#8fdc8c';c.beginPath();c.moveTo(0,H);c.lineTo(0,H*.92);c.quadraticCurveTo(W*.3,H*.84,W*.55,H*.92);c.quadraticCurveTo(W*.8,H*.86,W,H*.9);c.lineTo(W,H);c.fill();
  }else if(kind==='night'){
    c.fillStyle='#fff';for(let i=0;i<40;i++){c.globalAlpha=.4+.5*Math.abs(Math.sin(t*1.4+i));c.beginPath();c.arc((i*97)%W,(i*61)%(H*.85),1.4+(i%3)*.6,0,TAU);c.fill()}c.globalAlpha=1;
    c.fillStyle='#fff4c2';c.beginPath();c.arc(W*.82,H*.12,30,0,TAU);c.fill();
  }else if(kind==='pink'||kind==='warm'){
    c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<26;i++){c.beginPath();c.arc((i*131)%W,(i*79+t*6)%H,16+(i%4)*5,0,TAU);c.fill()}
  }else if(kind==='clinic'){
    c.fillStyle='rgba(255,255,255,.5)';c.fillRect(0,H*.62,W,H*.38);c.fillStyle='#ffd3ec';
    for(let i=0;i<8;i++)c.fillRect(i*W/4*.5,H*.62,W/16,H*.38);
    c.fillStyle='#fff';c.fillRect(W*.06,H*.14,W*.2,H*.18);c.strokeStyle='#ff8ac4';c.lineWidth=6;c.strokeRect(W*.06,H*.14,W*.2,H*.18);
    c.fillStyle='#ff6fa8';c.fillRect(W*.155,H*.165,W*.01,H*.12);c.fillRect(W*.115,H*.215,W*.09,H*.01);
  }
}

/* ================= tweens, timers, particles ================= */
let tweens=[],timers=[],parts=[],t=0;
const easeOut=k=>1-Math.pow(1-k,3),easeIO=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,easeBack=k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)};
function tween(o,to,ms,opt){opt=opt||{};const from={};for(const k in to)from[k]=o[k];tweens.push({o,from,to,t:-(opt.delay||0)/1000,d:ms/1000,ease:opt.ease||easeOut,done:opt.done})}
function later(ms,fn){timers.push({t:ms/1000,fn})}
function sp(x,y,o){if(parts.length>500)parts.shift();parts.push(Object.assign({x,y,vx:0,vy:0,gy:0,life:1,max:1,type:'s',c:'#fff',sz:10,rot:0,vr:0},o))}
function burst(x,y,n,cols,speed){cols=cols||RB;for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(.3,1)*(speed||220);sp(x,y,{vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,gy:380,life:rnd(.6,1.2),max:1.2,c:pick(cols),sz:rnd(8,15),vr:rnd(-7,7)})}}
function confetti(W,n){for(let i=0;i<(n||70);i++)sp(rnd(0,W),rnd(-80,-10),{vx:rnd(-40,40),vy:rnd(80,220),gy:30,life:rnd(2.2,3.8),max:3.8,type:'c',c:pick(RB),sz:rnd(8,14),vr:rnd(-8,8)})}
function emojiPop(x,y,txt,n){for(let i=0;i<(n||5);i++)sp(x+rnd(-30,30),y,{vx:rnd(-50,50),vy:rnd(-170,-90),gy:120,life:1.3,max:1.3,type:'e',t:txt,sz:rnd(26,38)})}
function stepFx(dt){
  t+=dt;
  for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];w.t+=dt;if(w.t<0)continue;const k=clamp(w.t/w.d,0,1),e=w.ease(k);for(const p in w.to)w.o[p]=w.from[p]+(w.to[p]-w.from[p])*e;if(k>=1){tweens.splice(i,1);if(w.done)w.done()}}
  for(let i=timers.length-1;i>=0;i--){timers[i].t-=dt;if(timers[i].t<=0){const f=timers[i].fn;timers.splice(i,1);f()}}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}p.vy+=p.gy*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt}
}
function drawFx(c){
  for(const p of parts){
    c.globalAlpha=clamp(p.life/p.max*1.6,0,1);
    if(p.type==='e'){c.save();c.translate(p.x,p.y);c.rotate(p.rot*.2);em(c,p.t,0,0,p.sz);c.restore()}
    else if(p.type==='c'){c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillRect(-p.sz/2,-p.sz/4,p.sz,p.sz/2);c.restore()}
    else{c.fillStyle=p.c;star4(c,p.x,p.y,p.sz,p.rot)}
  }
  c.globalAlpha=1;
}

/* ================= drag helper ================= */
function Drag(getItems,o){
  let cur=null,ox=0,oy=0,z=0;
  return{
    down(x,y){
      const its=getItems();
      for(let i=its.length-1;i>=0;i--){const it=its[i];if(it.fixed||it.locked)continue;
        if(Math.hypot(it.x-x,it.y-y)<(it.r||40)*1.2){cur=it;ox=it.x-x;oy=it.y-y;it.z=++z+1000;it.drag=true;if(o.pick)o.pick(it);return true}}
      return false;
    },
    move(x,y){if(cur){cur.x=x+ox;cur.y=y+oy-12}},
    up(x,y){if(cur){const it=cur;cur=null;it.drag=false;o.drop(it,x,y)}},
    get cur(){return cur}
  };
}

/* ================= stage ================= */
const Stage={reg:{},order:[],cur:null,inst:null,level:0,over:false};
let cv,ctx,W=0,H=0,DPR=1,raf=0,last=0,streak=0,promptFn=null,ptr=null;
Stage.register=def=>{Stage.reg[def.id]=def;Stage.order.push(def.id)};
Stage.stickerList=()=>{const a=[];for(const id of Stage.order){const d=Stage.reg[id];d.stickers.forEach((e,i)=>a.push({id:id+'_'+i,emoji:e,game:d}))}return a};

function resize(){
  if(!cv)return;
  DPR=Math.min(2,g.devicePixelRatio||1);W=innerWidth;H=innerHeight;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  if(Stage.inst&&Stage.inst.resize)Stage.inst.resize();
}
function lvOf(id){return(ML.S.lv&&ML.S.lv[id])||0}
Stage.lvOf=lvOf;

/* say(...ids): recorded clips when we have them, otherwise the phone voice reads the same words */
function say(){
  const ids=[].concat.apply([],[].slice.call(arguments));
  const V=g.Voice;
  const text=ids.map(i=>{const p=g.PHRASES.find(x=>x.id===i);return p?p.text.replace(/[!?]/g,''):String(i)}).join(' ');
  if(ML.S.sound&&V&&ids.every(i=>V.has(i))){ML.caption(text);ML.dbg('say clips: '+text);V.sayIds(ids);return}
  ML.say(text);   // shows the caption, then uses the phone voice if there is no recording
}
function numWords(n){return g.Voice.numIds(n)||['n'+n]}

function dots(done,total){
  const d=$('gdots');d.innerHTML='';
  for(let i=0;i<total;i++){const s=document.createElement('span');s.textContent=i<done?'⭐':'☆';d.appendChild(s)}
}
function react(grp,o){try{return g.Voice&&g.Voice.react(grp,o)}catch(e){return false}}
function good(){if(g.Host)g.Host.cheer();react('happy',{chance:.2,delay:800});streak++;const f=ML.nf(streak%8+4);ML.tone(f,ML.now(),.5,'sine',.18);ML.tone(f*2,ML.now()+.03,.3,'triangle',.07)}
function chime(k){const f=ML.nf(Math.min(14,Math.max(0,k))+2);ML.tone(f,ML.now(),.5,'triangle',.13);ML.tone(f*2,ML.now()+.02,.35,'sine',.05)}
function oops(){if(g.Host)g.Host.oops();streak=0;ML.sfx.boing();react('oops',{chance:.4,delay:500})}

const api={
  get W(){return W},get H(){return H},get ctx(){return ctx},get t(){return t},get level(){return Stage.level},
  rnd,pick,shuffle,clamp,TAU,RB,tween,later,easeOut,easeBack,easeIO,burst,confetti:()=>confetti(W),emojiPop,sp,
  say,numWords,good,oops,react,chime,sfx:ML.sfx,
  progress:dots,
  setPrompt:f=>{promptFn=f},
  drag:Drag,
  Draw:{drawShape,drawFace,drawNum,em,pill,shapePath,rrect,star4,bgFill,SHAPE_COL,FONT,EF,shade},
  win(o){win(o||{})}
};
Stage.api=api;

function win(o){
  if(Stage.over)return;Stage.over=true;
  const def=Stage.cur,stars=o.stars||3;
  ML.addStarsQuiet(stars);
  const S=ML.S;S.stickers=S.stickers||[];S.lv=S.lv||{};
  let sticker=null;
  const next=def.stickers.findIndex((e,i)=>!S.stickers.includes(def.id+'_'+i));
  if(next>=0){S.stickers.push(def.id+'_'+next);sticker=def.stickers[next]}
  S.lv[def.id]=Math.min(def.levels-1,(S.lv[def.id]||0)+1);
  ML.save();ML.questEvent('game');if(def.cat!=='more')ML.questEvent('learn');
  if(g.Host)g.Host.winDance();confetti(W,90);ML.sfx.fanfare();react('cheer',{delay:700});
  say(sticker?'new_sticker':ML.pick(['great_job','well_done','super','wow']));
  const box=$('gwin');box.hidden=false;
  box.querySelector('.wstars').textContent='⭐'.repeat(stars);
  const st=box.querySelector('.wsticker');st.textContent=sticker||'';st.hidden=!sticker;
  box.querySelector('.wnew').hidden=!sticker;
  $('gagain').onclick=()=>{box.hidden=true;Stage.open(def.id)};
  $('ghome').onclick=()=>{box.hidden=true;Stage.close()};
}

Stage.open=function(id){
  const def=Stage.reg[id];if(!def)return;
  if(!cv){cv=$('gcv');ctx=cv.getContext('2d');
    cv.addEventListener('pointerdown',e=>{e.preventDefault();ML.unlock();if(Stage.over||!Stage.inst)return;ptr=e.pointerId;try{cv.setPointerCapture(e.pointerId)}catch(_){}Stage.inst.down&&Stage.inst.down(e.clientX,e.clientY)});
    cv.addEventListener('pointermove',e=>{if(e.pointerId===ptr&&Stage.inst&&!Stage.over)Stage.inst.move&&Stage.inst.move(e.clientX,e.clientY)});
    const up=e=>{if(e.pointerId!==ptr)return;ptr=null;if(Stage.inst&&!Stage.over)Stage.inst.up&&Stage.inst.up(e.clientX,e.clientY)};
    cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    addEventListener('resize',resize);
  }
  Stage.cur=def;Stage.level=Math.min(def.levels-1,lvOf(id));Stage.over=false;
  tweens=[];timers=[];parts=[];streak=0;promptFn=null;
  $('hub').hidden=true;$('gwin').hidden=true;cv.hidden=false;$('gtop').hidden=false;
  ML.S.scene='games';
  resize();
  if(g.Host)g.Host.start(id);
  Stage.inst=def.create(api);
  if(Stage.inst.init)Stage.inst.init();
  $('gtitle').textContent=def.icon+' L'+(Stage.level+1);
  if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}
};
Stage.close=function(){
  if(raf){cancelAnimationFrame(raf);raf=0}
  if(Stage.inst&&Stage.inst.destroy)Stage.inst.destroy();
  Stage.inst=null;Stage.cur=null;
  if(cv)cv.hidden=true;$('gtop').hidden=true;$('gwin').hidden=true;
  if(g.Voice)g.Voice.stop();
  g.Hub&&g.Hub.open();
};
function loop(now){
  raf=requestAnimationFrame(loop);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  stepFx(dt);
  if(Stage.inst&&!Stage.over&&Stage.inst.update)Stage.inst.update(dt);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(Stage.inst)Stage.inst.draw(ctx);
  drawFx(ctx);
  if(g.Host)g.Host.frame(dt);
}
$('gexit').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ML.sfx.pop();Stage.close()});
$('gsay').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ML.unlock();if(promptFn)promptFn()});

/* on-screen caption: the words of every spoken line, so the game still has directions if the sound is off or fails */
let capT=0;
ML.caption=function(text){
  if(ML.S.scene!=='games')return;
  const e=$('gcap');if(!e)return;
  e.textContent=String(text).replace(/\s+/g,' ');e.classList.add('on');
  clearTimeout(capT);capT=setTimeout(()=>e.classList.remove('on'),5500);
};
$('gcap').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();$('gcap').classList.remove('on')});

g.Stage=Stage;
})(window);
