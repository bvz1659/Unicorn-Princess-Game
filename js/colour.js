/* Colouring: free draw, colouring pages by category, and photo -> colouring page. Fully offline. */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const ML=g.ML,Hub=g.Hub;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const SAVE_KEY='magicland_art';
const PALETTE=['#ff3b30','#ff9500','#ffd60a','#34c759','#30d5c8','#5ac8fa','#007aff','#af52de','#ff6fb5','#ffcba4','#a2724a','#9a9a9a','#222222','#ffffff'];
const TOOLS=[['fill','🪣'],['marker','🖊️'],['crayon','🖍️'],['rainbow','🌈'],['sparkle','✨'],['eraser','🧽']];
const SIZES=[10,24,48];

const st={mode:'draw',tool:'marker',size:1,color:'#ff6fb5',custom:[],cw:900,ch:900,undo:[],wall:null,item:null,seed:1,photo:null,detail:1,drawing:false,last:null,moved:false,hue:0,startPt:null};
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');if(Array.isArray(s.custom))st.custom=s.custom.slice(0,8)}catch(e){}
const saveCustom=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify({custom:st.custom}))}catch(e){}};

/* ---------- colour maths ---------- */
function hsv2rgb(h,s,v){const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[Math.round(f(5)*255),Math.round(f(3)*255),Math.round(f(1)*255)]}
const hex2rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
const rgb2hex=(r,g2,b)=>'#'+[r,g2,b].map(v=>v.toString(16).padStart(2,'0')).join('');
function rgb2hsv(r,g2,b){r/=255;g2/=255;b/=255;const mx=Math.max(r,g2,b),mn=Math.min(r,g2,b),d=mx-mn;let h=0;
  if(d){if(mx===r)h=((g2-b)/d)%6;else if(mx===g2)h=(b-r)/d+2;else h=(r-g2)/d+4;h*=60;if(h<0)h+=360}return[h,mx?d/mx:0,mx]}

/* ---------- DOM ---------- */
let built=false,pc,lc,pctx,lctx,tray;
function el(tag,cls,txt,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(parent)parent.appendChild(e);return e}
function tap(b,fn){
  let sx=0,sy=0,id=null,t0=0;
  b.addEventListener('pointerdown',e=>{e.stopPropagation();ML.unlock();sx=e.clientX;sy=e.clientY;id=e.pointerId;t0=Date.now()});
  b.addEventListener('pointerup',e=>{if(e.pointerId!==id)return;id=null;e.stopPropagation();e.preventDefault();if(Math.hypot(e.clientX-sx,e.clientY-sy)<14&&Date.now()-t0<900)fn(e,b)});
  b.addEventListener('pointercancel',()=>{id=null});
}

function build(){
  if(built)return;built=true;
  const art=el('div',null,null,document.body);art.id='art';art.hidden=true;
  const top=el('div',null,null,art);top.id='atop';
  tap(el('button',null,'✖',top),()=>{ML.sfx.pop();close()});
  const mid=el('div',null,null,top);mid.id='amid';
  const b={};
  b.pic=el('button',null,'🖼️',mid);tap(b.pic,()=>{ML.sfx.pop();openPicker()});
  b.dice=el('button',null,'🎲',mid);tap(b.dice,()=>{ML.sfx.pop();st.seed=Math.floor(Math.random()*1e6);startPage(true)});
  b.photo=el('button',null,'📷',mid);tap(b.photo,()=>{ML.sfx.pop();pickPhoto()});
  b.detail=el('button',null,'🔍',mid);tap(b.detail,()=>{ML.sfx.pop();st.detail=(st.detail+1)%3;startPhoto(true);toast(['Simple','More detail','Lots of detail'][st.detail])});
  b.undo=el('button',null,'↩️',mid);tap(b.undo,()=>{ML.sfx.pop();undo()});
  b.clear=el('button',null,'🗑️',mid);tap(b.clear,(e,btn)=>{
    if(btn.dataset.sure){clearTimeout(+btn.dataset.sure);delete btn.dataset.sure;btn.textContent='🗑️';clearPaint();return}
    btn.textContent='❓';btn.dataset.sure=setTimeout(()=>{delete btn.dataset.sure;btn.textContent='🗑️'},2200)});
  b.save=el('button',null,'💾',mid);tap(b.save,()=>{ML.sfx.pop();savePic()});
  art._b=b;
  const stage=el('div',null,null,art);stage.id='astage';
  const wrap=el('div',null,null,stage);wrap.id='awrap';
  pc=el('canvas',null,null,wrap);lc=el('canvas',null,null,wrap);pc.id='apaint';lc.id='aline';
  pctx=pc.getContext('2d',{willReadFrequently:true});lctx=lc.getContext('2d',{willReadFrequently:true});
  tray=el('div',null,null,art);tray.id='atray';
  el('div',null,null,tray).id='atools';el('div',null,null,tray).id='acolors';
  const toast=el('div',null,null,art);toast.id='atoast';
  // picker
  const pk=el('div','asheet',null,document.body);pk.id='apick';pk.hidden=true;
  // colour wheel
  const wh=el('div','asheet',null,document.body);wh.id='awheel';wh.hidden=true;
  const fi=el('input',null,null,document.body);fi.type='file';fi.accept='image/*';fi.id='afile';fi.hidden=true;
  fi.addEventListener('change',()=>{const f=fi.files&&fi.files[0];if(f)loadPhoto(f);fi.value=''});
  // drawing on the stage
  wrap.addEventListener('pointerdown',pDown);wrap.addEventListener('pointermove',pMove);
  wrap.addEventListener('pointerup',pUp);wrap.addEventListener('pointercancel',pUp);
  addEventListener('resize',()=>{if(!$('art').hidden)fit()});
  drawTray();
}
function toast(t){const e=$('atoast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),1800)}

function drawTray(){
  const tools=$('atools'),cols=$('acolors');tools.innerHTML='';cols.innerHTML='';
  TOOLS.forEach(([k,ic])=>{const b=el('button','tb'+(st.tool===k?' on':''),ic,tools);tap(b,()=>{st.tool=k;ML.sfx.pop();drawTray()})});
  SIZES.forEach((s,i)=>{const b=el('button','sz'+(st.size===i?' on':''),null,tools);const d=el('i',null,null,b);d.style.width=d.style.height=(8+i*8)+'px';tap(b,()=>{st.size=i;ML.sfx.pop();drawTray()})});
  const all=[...PALETTE,...st.custom];
  all.forEach(c=>{const b=el('button','sw'+(st.color.toLowerCase()===c.toLowerCase()?' on':''),null,cols);b.style.background=c;if(c==='#ffffff')b.style.boxShadow='inset 0 0 0 2px #ccc';tap(b,()=>{st.color=c;if(st.tool==='eraser')st.tool=st.mode==='draw'?'marker':'fill';ML.sfx.pop();drawTray()})});
  const w=el('button','sw wheel','🎨',cols);tap(w,()=>{ML.sfx.pop();openWheel()});
  const art=$('art');if(art){const b=art._b;
    b.pic.hidden=st.mode!=='page';b.dice.hidden=st.mode!=='page';b.photo.hidden=st.mode!=='photo';b.detail.hidden=st.mode!=='photo'}
}

/* ---------- canvas setup ---------- */
function setupCanvas(w,h){
  st.cw=w;st.ch=h;pc.width=lc.width=w;pc.height=lc.height=h;
  pctx.fillStyle='#fff';pctx.fillRect(0,0,w,h);lctx.clearRect(0,0,w,h);
  st.undo=[];st.wall=null;fit();
}
function fit(){
  const stage=$('astage'),r=stage.getBoundingClientRect(),pad=10;
  const aw=r.width-pad*2,ah=r.height-pad*2,s=Math.min(aw/st.cw,ah/st.ch);
  const w=Math.floor(st.cw*s),h=Math.floor(st.ch*s),wrap=$('awrap');
  wrap.style.width=w+'px';wrap.style.height=h+'px';
}
function open(mode){
  build();
  st.mode=mode;st.started=false;
  $('hub').hidden=true;$('art').hidden=false;ML.S.scene='games';
  st.tool=mode==='draw'?'marker':'fill';
  drawTray();
  if(mode==='draw'){startDraw()}
  else if(mode==='page')openPicker();
  else pickPhoto(true);
}
function close(){
  $('art').hidden=true;$('apick').hidden=true;$('awheel').hidden=true;
  if(g.Voice)g.Voice.stop();
  g.Hub.open();
}
function startDraw(){
  $('apick').hidden=true;
  const stage=$('astage').getBoundingClientRect(),asp=clamp(stage.height/stage.width,.8,1.5);
  setupCanvas(900,Math.round(900*asp));
  ML.say('Draw anything you like!');
}

/* ---------- picture picker ---------- */
let pickCat=0;
function openPicker(){
  const pk=$('apick');pk.hidden=false;pk.innerHTML='';
  const card=el('div','acard',null,pk);
  const bar=el('div','abar',null,card);
  tap(el('button','mx','✖',bar),()=>{ML.sfx.pop();pk.hidden=true;if(!st.started)close()});
  el('div','atitle','Pick a picture',bar);
  const cats=el('div','acats',null,card);
  g.ArtLib.cats.forEach((c,i)=>{const b=el('button','acat'+(i===pickCat?' on':''),c.emoji,cats);tap(b,()=>{pickCat=i;ML.sfx.pop();ML.say(c.name+'!');openPicker()})});
  const grid=el('div','athumbs',null,card);
  const cat=g.ArtLib.cats[pickCat];
  cat.items.forEach(item=>{
    const seed=Math.floor(Math.random()*1e6);
    const b=el('button','athumb',null,grid);const cv=el('canvas',null,null,b);cv.width=cv.height=240;g.ArtLib.render(cv,item,seed,4);
    el('span',null,item.name,b);
    tap(b,()=>{ML.sfx.pop();st.item=item;st.seed=seed;pk.hidden=true;startPage(false)});
  });
  const sur=el('button','asurprise','🎲 Surprise me!',card);
  tap(sur,()=>{const c=g.ArtLib.cats[Math.floor(Math.random()*g.ArtLib.cats.length)];st.item=c.items[Math.floor(Math.random()*c.items.length)];st.seed=Math.floor(Math.random()*1e6);pk.hidden=true;startPage(false)});
}
function startPage(keepPaint){
  st.started=true;$('apick').hidden=true;
  setupCanvas(1000,1000);
  g.ArtLib.render(lc,st.item,st.seed,9);
  buildWall();
  drawTray();
  if(!keepPaint)ML.say('Pick a colour and tap to fill!');
}
function buildWall(){
  const d=lctx.getImageData(0,0,st.cw,st.ch).data,w=new Uint8Array(st.cw*st.ch);
  for(let i=0;i<w.length;i++)w[i]=d[i*4+3]>=140?1:0;
  st.wall=w;
}

/* ---------- photo -> colouring page ---------- */
function pickPhoto(){$('afile').click()}
function loadPhoto(file){
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{st.photo=img;st.detail=1;startPhoto(false)};
  img.onerror=()=>toast('Could not open that photo');
  img.src=url;
}
function startPhoto(keep){
  if(!st.photo)return;
  toast('Making your colouring page…');
  setTimeout(()=>{
    const r=photoToLines(st.photo,st.detail);
    setupCanvas(r.cw,r.ch);
    lctx.putImageData(r.line,0,0);
    buildWall();drawTray();
    if(!keep)ML.say('Pick a colour and tap to fill!');
  },30);
}
function photoToLines(img,detail){
  const P=[{s:150,k:6,min:70},{s:210,k:8,min:44},{s:290,k:10,min:30}][detail];
  const ar=(img.naturalWidth/img.naturalHeight)||1;
  let w,h;if(ar>=1){w=P.s;h=Math.max(8,Math.round(P.s/ar))}else{h=P.s;w=Math.max(8,Math.round(P.s*ar))}
  const t=document.createElement('canvas');t.width=w;t.height=h;const tc=t.getContext('2d',{willReadFrequently:true});
  tc.fillStyle='#fff';tc.fillRect(0,0,w,h);tc.drawImage(img,0,0,w,h);
  const id=tc.getImageData(0,0,w,h),d=id.data,n=w*h;
  // 1) smooth: two 3x3 box blurs
  let src=new Float32Array(n*3);for(let i=0;i<n;i++){src[i*3]=d[i*4];src[i*3+1]=d[i*4+1];src[i*3+2]=d[i*4+2]}
  for(let pass=0;pass<2;pass++){
    const dst=new Float32Array(n*3);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      let r=0,gg=0,b=0,c=0;
      for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;const j=(yy*w+xx)*3;r+=src[j];gg+=src[j+1];b+=src[j+2];c++}}
      const o=(y*w+x)*3;dst[o]=r/c;dst[o+1]=gg/c;dst[o+2]=b/c;
    }
    src=dst;
  }
  // 2) k-means colour quantisation
  const K=P.k,step=Math.max(1,Math.floor(n/5000)),samp=[];
  for(let i=0;i<n;i+=step)samp.push(i);
  samp.sort((a,b)=>(src[a*3]+src[a*3+1]+src[a*3+2])-(src[b*3]+src[b*3+1]+src[b*3+2]));
  const cen=[];for(let k=0;k<K;k++){const i=samp[Math.floor((k+.5)/K*samp.length)];cen.push([src[i*3],src[i*3+1],src[i*3+2]])}
  const near=i=>{let bi=0,bd=1e18;const r=src[i*3],gg=src[i*3+1],b=src[i*3+2];for(let k=0;k<K;k++){const c=cen[k],dd=(r-c[0])**2+(gg-c[1])**2+(b-c[2])**2;if(dd<bd){bd=dd;bi=k}}return bi};
  for(let it=0;it<7;it++){
    const sum=cen.map(()=>[0,0,0,0]);
    for(const i of samp){const k=near(i),s=sum[k];s[0]+=src[i*3];s[1]+=src[i*3+1];s[2]+=src[i*3+2];s[3]++}
    sum.forEach((s,k)=>{if(s[3])cen[k]=[s[0]/s[3],s[1]/s[3],s[2]/s[3]]});
  }
  const lab=new Int32Array(n);for(let i=0;i<n;i++)lab[i]=near(i);
  // 3) connected components
  const comp=new Int32Array(n).fill(-1),stack=new Int32Array(n);let nc=0;const areas=[],lists=[];
  for(let s0=0;s0<n;s0++){
    if(comp[s0]>=0)continue;
    const L=[],c=nc++;let sp=0;stack[sp++]=s0;comp[s0]=c;
    while(sp){const p=stack[--sp];L.push(p);const x=p%w,y=(p-x)/w;
      if(x>0&&comp[p-1]<0&&lab[p-1]===lab[p]){comp[p-1]=c;stack[sp++]=p-1}
      if(x<w-1&&comp[p+1]<0&&lab[p+1]===lab[p]){comp[p+1]=c;stack[sp++]=p+1}
      if(y>0&&comp[p-w]<0&&lab[p-w]===lab[p]){comp[p-w]=c;stack[sp++]=p-w}
      if(y<h-1&&comp[p+w]<0&&lab[p+w]===lab[p]){comp[p+w]=c;stack[sp++]=p+w}}
    lists.push(L);areas.push(L.length);
  }
  // 4) merge tiny regions into their biggest neighbour
  for(let guard=0;guard<6000;guard++){
    let sm=-1,sa=1e9;
    for(let c=0;c<nc;c++){const a=areas[c];if(a>0&&a<P.min&&a<sa){sa=a;sm=c}}
    if(sm<0)break;
    const cnt=new Map();
    for(const p of lists[sm]){const x=p%w,y=(p-x)/w;
      const nb=[x>0?comp[p-1]:-1,x<w-1?comp[p+1]:-1,y>0?comp[p-w]:-1,y<h-1?comp[p+w]:-1];
      for(const q of nb)if(q>=0&&q!==sm)cnt.set(q,(cnt.get(q)||0)+1)}
    if(!cnt.size)break;
    let best=-1,bc=0;cnt.forEach((v,k)=>{if(v>bc){bc=v;best=k}});
    for(const p of lists[sm]){comp[p]=best;lists[best].push(p)}
    areas[best]+=areas[sm];areas[sm]=0;lists[sm]=[];
  }
  // 5) region boundaries -> black lines
  const mc=document.createElement('canvas');mc.width=w;mc.height=h;const mx=mc.getContext('2d'),mi=mx.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x;
    if((x<w-1&&comp[p]!==comp[p+1])||(y<h-1&&comp[p]!==comp[p+w])){const o=p*4;mi.data[o]=22;mi.data[o+1]=22;mi.data[o+2]=22;mi.data[o+3]=255}}
  mx.putImageData(mi,0,0);
  // 6) smooth upscale + threshold so the lines are crisp
  const sc=1000/Math.max(w,h),cw=Math.round(w*sc),ch=Math.round(h*sc);
  const oc=document.createElement('canvas');oc.width=cw;oc.height=ch;const o2=oc.getContext('2d',{willReadFrequently:true});
  o2.imageSmoothingEnabled=true;o2.imageSmoothingQuality='high';o2.drawImage(mc,0,0,cw,ch);
  const out=o2.getImageData(0,0,cw,ch),od=out.data;
  for(let i=0;i<cw*ch;i++){const a=od[i*4+3]>85?255:0;od[i*4]=22;od[i*4+1]=22;od[i*4+2]=22;od[i*4+3]=a}
  // frame around the picture
  const fw=5;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(x<fw||y<fw||x>=cw-fw||y>=ch-fw){const o=(y*cw+x)*4;od[o]=22;od[o+1]=22;od[o+2]=22;od[o+3]=255}
  return{cw,ch,line:out};
}

/* ---------- painting ---------- */
function toCanvas(e){const r=pc.getBoundingClientRect();return[(e.clientX-r.left)*st.cw/r.width,(e.clientY-r.top)*st.ch/r.height]}
function pushUndo(){st.undo.push(pctx.getImageData(0,0,st.cw,st.ch));if(st.undo.length>10)st.undo.shift()}
function undo(){const s=st.undo.pop();if(s)pctx.putImageData(s,0,0);else toast('Nothing to undo')}
function clearPaint(){pushUndo();pctx.fillStyle='#fff';pctx.fillRect(0,0,st.cw,st.ch);ML.sfx.splash()}
let pid=null;
function pDown(e){
  if(pid!==null)return;
  e.preventDefault();ML.unlock();pid=e.pointerId;try{e.currentTarget.setPointerCapture(pid)}catch(_){}
  const [x,y]=toCanvas(e);st.startPt=[x,y];st.moved=false;
  if(st.tool==='fill'){return}
  pushUndo();st.drawing=true;st.last=[x,y];st.hue=(st.hue+37)%360;
  stamp(x,y,x,y);
}
function pMove(e){
  if(e.pointerId!==pid)return;
  const [x,y]=toCanvas(e);
  if(Math.hypot(x-st.startPt[0],y-st.startPt[1])>8)st.moved=true;
  if(!st.drawing)return;
  stamp(st.last[0],st.last[1],x,y);st.last=[x,y];
}
function pUp(e){
  if(e.pointerId!==pid)return;pid=null;
  if(st.tool==='fill'&&!st.moved){const [x,y]=toCanvas(e);doFill(Math.round(x),Math.round(y))}
  st.drawing=false;st.last=null;
}
function stamp(x0,y0,x1,y1){
  const sz=SIZES[st.size]*(st.cw/900),c=pctx,dist=Math.hypot(x1-x0,y1-y0);
  c.lineCap='round';c.lineJoin='round';
  if(st.tool==='marker'||st.tool==='eraser'){
    c.strokeStyle=st.tool==='eraser'?'#ffffff':st.color;c.lineWidth=st.tool==='eraser'?sz*1.4:sz;
    c.beginPath();c.moveTo(x0,y0);c.lineTo(x1+.01,y1);c.stroke();
  }else if(st.tool==='rainbow'){
    st.hue=(st.hue+dist*.5)%360;c.strokeStyle='hsl('+st.hue+',90%,58%)';c.lineWidth=sz;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1+.01,y1);c.stroke();
  }else if(st.tool==='crayon'){
    const n=Math.max(1,Math.round(dist/3));c.fillStyle=st.color;
    for(let i=0;i<n*3+3;i++){const t=Math.random(),px=x0+(x1-x0)*t+(Math.random()-.5)*sz*1.1,py=y0+(y1-y0)*t+(Math.random()-.5)*sz*1.1;
      c.globalAlpha=.35+Math.random()*.5;c.beginPath();c.arc(px,py,sz*(.08+Math.random()*.18),0,7);c.fill()}
    c.globalAlpha=1;
  }else if(st.tool==='sparkle'){
    const [r,g2,b]=hex2rgb(st.color),n=Math.max(1,Math.round(dist/(sz*.8)));
    for(let i=0;i<n;i++){const t=n>1?i/(n-1):0,px=x0+(x1-x0)*t,py=y0+(y1-y0)*t,s=sz*(.4+Math.random()*.6);
      c.fillStyle='rgba('+r+','+g2+','+b+',.9)';c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4,q=k%2?s*.32:s;c.lineTo(px+Math.cos(a)*q,py+Math.sin(a)*q)}c.closePath();c.fill();
      c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(px,py,s*.12,0,7);c.fill()}
  }
}
function doFill(px,py){
  px=clamp(px,0,st.cw-1);py=clamp(py,0,st.ch-1);
  const w=st.cw,h=st.ch,wall=st.wall;
  let idx=py*w+px;
  if(wall&&wall[idx]){ // tapped on a line: nudge to the nearest open pixel
    let found=-1;for(let r=1;r<=6&&found<0;r++)for(let dy=-r;dy<=r&&found<0;dy++)for(let dx=-r;dx<=r;dx++){const x=px+dx,y=py+dy;if(x>=0&&y>=0&&x<w&&y<h&&!wall[y*w+x]){found=y*w+x;break}}
    if(found<0)return;idx=found;
  }
  pushUndo();
  const img=pctx.getImageData(0,0,w,h),d=img.data,[nr,ng,nb]=hex2rgb(st.color);
  const tr=d[idx*4],tg=d[idx*4+1],tb=d[idx*4+2];
  if(Math.abs(tr-nr)+Math.abs(tg-ng)+Math.abs(tb-nb)<6){st.undo.pop();return}
  const tol=st.mode==='draw'?40:60;
  const ok=i=>{if(wall&&wall[i])return false;const o=i*4;return Math.abs(d[o]-tr)+Math.abs(d[o+1]-tg)+Math.abs(d[o+2]-tb)<=tol};
  const seen=new Uint8Array(w*h),stack=[idx];seen[idx]=1;let cnt=0;
  while(stack.length){
    const p=stack.pop();let x=p%w;const y=(p-x)/w;
    let l=x;while(l>0&&!seen[y*w+l-1]&&ok(y*w+l-1))l--;
    let r=x;while(r<w-1&&!seen[y*w+r+1]&&ok(y*w+r+1))r++;
    for(let xx=l;xx<=r;xx++){const q=y*w+xx;seen[q]=1;const o=q*4;d[o]=nr;d[o+1]=ng;d[o+2]=nb;d[o+3]=255;cnt++}
    for(const yy of[y-1,y+1]){if(yy<0||yy>=h)continue;
      let inRun=false;for(let xx=l;xx<=r;xx++){const q=yy*w+xx;if(!seen[q]&&ok(q)){if(!inRun){stack.push(q);seen[q]=1;inRun=true}}else inRun=false}}
  }
  pctx.putImageData(img,0,0);
  ML.sfx.collect();
}

/* ---------- save / share ---------- */
function savePic(){
  const t=document.createElement('canvas');t.width=st.cw;t.height=st.ch;const c=t.getContext('2d');
  c.drawImage(pc,0,0);c.drawImage(lc,0,0);
  t.toBlob(async blob=>{
    if(!blob)return;
    const file=new File([blob],'my-picture.png',{type:'image/png'});
    try{
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'My picture'});toast('Saved! 💖');ML.say('I saved your picture!');return}
    }catch(e){if(e&&e.name==='AbortError')return}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-picture.png';document.body.appendChild(a);a.click();a.remove();
    toast('Saved! 💖');ML.say('I saved your picture!');
  },'image/png');
}

/* ---------- colour wheel ---------- */
function openWheel(){
  const wh=$('awheel');wh.hidden=false;wh.innerHTML='';
  const card=el('div','acard wcard',null,wh);
  const [r0,g0,b0]=hex2rgb(st.color);let [h,s,v]=rgb2hsv(r0,g0,b0);if(v<.2)v=1;
  const S=Math.min(300,innerWidth-70);
  const cvs=el('canvas',null,null,card);cvs.width=cvs.height=S;cvs.id='wheelcv';
  const c=cvs.getContext('2d');
  let disc=null,discV=-1;
  function drawDisc(){
    if(discV!==v){
      const id=c.createImageData(S,S),R=S/2;
      for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=x-R+.5,dy=y-R+.5,d=Math.hypot(dx,dy),o=(y*S+x)*4;
        if(d<=R){const hh=(Math.atan2(dy,dx)*180/Math.PI+360)%360,[r,g2,b]=hsv2rgb(hh,Math.min(1,d/(R-2)),v);id.data[o]=r;id.data[o+1]=g2;id.data[o+2]=b;id.data[o+3]=255}}
      disc=id;discV=v;
    }
    c.clearRect(0,0,S,S);c.putImageData(disc,0,0);
    const R=S/2,a=h*Math.PI/180,px=R+Math.cos(a)*s*(R-2),py=R+Math.sin(a)*s*(R-2);
    c.lineWidth=5;c.strokeStyle='#fff';c.beginPath();c.arc(px,py,16,0,7);c.stroke();c.lineWidth=2;c.strokeStyle='#222';c.beginPath();c.arc(px,py,19,0,7);c.stroke();
    const rgb=hsv2rgb(h,s,v),hex=rgb2hex(...rgb);
    prev.style.background=hex;slider.style.background='linear-gradient(90deg,#000,'+rgb2hex(...hsv2rgb(h,s,1))+')';
    return hex;
  }
  function pick(e){
    const r=cvs.getBoundingClientRect(),x=(e.clientX-r.left)*S/r.width-S/2,y=(e.clientY-r.top)*S/r.height-S/2;
    h=(Math.atan2(y,x)*180/Math.PI+360)%360;s=Math.min(1,Math.hypot(x,y)/(S/2-2));drawDisc();
  }
  let down=false;
  cvs.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();down=true;try{cvs.setPointerCapture(e.pointerId)}catch(_){}pick(e)});
  cvs.addEventListener('pointermove',e=>{if(down)pick(e)});
  ['pointerup','pointercancel'].forEach(ev=>cvs.addEventListener(ev,()=>{down=false}));
  const row=el('div','wrow',null,card);
  const prev=el('div','wprev',null,row);
  const slider=el('input','wslide',null,row);slider.type='range';slider.min=0;slider.max=100;slider.value=Math.round(v*100);
  slider.addEventListener('input',()=>{v=Math.max(.02,slider.value/100);drawDisc()});
  const btns=el('div','wbtns2',null,card);
  tap(el('button','wno','✖',btns),()=>{ML.sfx.pop();wh.hidden=true});
  tap(el('button','wyes','✔',btns),()=>{
    const hex=drawDisc();st.color=hex;
    if(!PALETTE.includes(hex)&&!st.custom.includes(hex)){st.custom.unshift(hex);st.custom=st.custom.slice(0,8);saveCustom()}
    if(st.tool==='eraser')st.tool=st.mode==='draw'?'marker':'fill';
    ML.sfx.collect();wh.hidden=true;drawTray();
  });
  drawDisc();
}

g.Art={open,close};
})(window);
