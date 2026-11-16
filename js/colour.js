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
  b.style=el('button',null,'🪄',mid);tap(b.style,()=>{ML.sfx.pop();st.pmode=(st.curMode==='line')?'photo':'line';startPhoto(true);toast(st.pmode==='line'?'Drawing style':'Photo style')});
  b.detail=el('button',null,'🔍',mid);tap(b.detail,()=>{ML.sfx.pop();st.detail=(st.detail+1)%3;startPhoto(true);toast((st.curMode==='line'?['Thin lines','Normal lines','Bold lines']:['Simple','More detail','Lots of detail'])[st.detail])});
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
    b.pic.hidden=st.mode!=='page';b.dice.hidden=st.mode!=='page';b.photo.hidden=st.mode!=='photo';b.detail.hidden=st.mode!=='photo';b.style.hidden=st.mode!=='photo'}
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
  img.onload=()=>{st.photo=img;st.detail=1;st.pmode=null;startPhoto(false)};
  img.onerror=()=>toast('Could not open that photo');
  img.src=url;
}
function startPhoto(keep){
  if(!st.photo)return;
  toast('Making your colouring page…');
  setTimeout(()=>{
    const mode=st.pmode||(isLineArt(st.photo)?'line':'photo');st.curMode=mode;
    const r=mode==='line'?drawingToLines(st.photo,st.detail):photoToLines(st.photo,st.detail);
    setupCanvas(r.cw,r.ch);
    lctx.putImageData(r.line,0,0);
    buildWall();drawTray();
    if(!keep)ML.say('Pick a colour and tap to fill!');
  },30);
}
/* ---- image helpers ---- */
function integral(m,w,h){const W1=w+1,I=new Int32Array(W1*(h+1));for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=m[y*w+x];I[(y+1)*W1+x+1]=I[y*W1+x+1]+row}}return I}
function winSum(I,W1,x0,y0,x1,y1){return I[(y1+1)*W1+x1+1]-I[y0*W1+x1+1]-I[(y1+1)*W1+x0]+I[y0*W1+x0]}
function morph(m,w,h,r,mode){
  const I=integral(m,w,h),W1=w+1,out=new Uint8Array(w*h);
  for(let y=0;y<h;y++){const y0=Math.max(0,y-r),y1=Math.min(h-1,y+r);
    for(let x=0;x<w;x++){const x0=Math.max(0,x-r),x1=Math.min(w-1,x+r),sm=winSum(I,W1,x0,y0,x1,y1);
      out[y*w+x]=mode==='dilate'?(sm>0?1:0):(sm===(x1-x0+1)*(y1-y0+1)?1:0)}}
  return out;
}
function removeSpecks(m,w,h,minArea){
  const seen=new Uint8Array(w*h),stack=new Int32Array(w*h);
  for(let s0=0;s0<w*h;s0++){
    if(!m[s0]||seen[s0])continue;
    const L=[];let sp=0;stack[sp++]=s0;seen[s0]=1;
    while(sp){const p=stack[--sp];L.push(p);const x=p%w,y=(p-x)/w;
      for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;const q=yy*w+xx;if(m[q]&&!seen[q]){seen[q]=1;stack[sp++]=q}}}}
    if(L.length<minArea)for(const p of L)m[p]=0;
  }
}
function toGray(img,long){
  const ar=(img.naturalWidth/img.naturalHeight)||1;let w,h;
  if(ar>=1){w=long;h=Math.max(8,Math.round(long/ar))}else{h=long;w=Math.max(8,Math.round(long*ar))}
  const t=document.createElement('canvas');t.width=w;t.height=h;const c=t.getContext('2d',{willReadFrequently:true});
  c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(img,0,0,w,h);
  const d=c.getImageData(0,0,w,h).data,gray=new Uint8Array(w*h);let sat=0;
  for(let i=0;i<w*h;i++){const r=d[i*4],g2=d[i*4+1],b=d[i*4+2];gray[i]=(r*299+g2*587+b*114)/1000;sat+=Math.max(r,g2,b)-Math.min(r,g2,b)}
  return{gray,w,h,sat:sat/(w*h)/255};
}
/* looks like a pencil / pen drawing (mostly white paper with dark lines)? */
function isLineArt(img){
  const {gray,sat}=toGray(img,220);let bright=0,dark=0;
  for(let i=0;i<gray.length;i++){if(gray[i]>200)bright++;else if(gray[i]<110)dark++}
  const n=gray.length;return bright/n>.7&&dark/n>.008&&dark/n<.3&&sat<.16;
}

/* DRAWING mode: keep the original lines, clean specks, close small gaps so colour does not leak */
function drawingToLines(img,detail){
  let {gray,w,h}=toGray(img,1000);
  // trim dark screenshot borders
  const rowM=y=>{let s=0;for(let x=0;x<w;x++)s+=gray[y*w+x];return s/w},colM=x=>{let s=0;for(let y=0;y<h;y++)s+=gray[y*w+x];return s/h};
  let t0=0,b0=h-1,l0=0,r0=w-1;const mxy=Math.floor(h*.12),mxx=Math.floor(w*.12);
  while(t0<mxy&&rowM(t0)<90)t0++;while(h-1-b0<mxy&&rowM(b0)<90)b0--;while(l0<mxx&&colM(l0)<90)l0++;while(w-1-r0<mxx&&colM(r0)<90)r0--;
  t0+=2;b0-=2;l0+=2;r0-=2;
  if(t0>0||l0>0||b0<h-1||r0<w-1){
    const nw=r0-l0+1,nh=b0-t0+1,ng=new Uint8Array(nw*nh);
    for(let y=0;y<nh;y++)for(let x=0;x<nw;x++)ng[y*nw+x]=gray[(y+t0)*w+x+l0];
    gray=ng;w=nw;h=nh;
  }
  // adaptive threshold against the local paper brightness
  const I=integral(gray,w,h),W1=w+1,R=Math.max(14,Math.round(Math.max(w,h)/16)),thr=[.7,.8,.88][detail];
  const m=new Uint8Array(w*h);
  for(let y=0;y<h;y++){const y0=Math.max(0,y-R),y1=Math.min(h-1,y+R);
    for(let x=0;x<w;x++){const x0=Math.max(0,x-R),x1=Math.min(w-1,x+R);
      const bg=winSum(I,W1,x0,y0,x1,y1)/((x1-x0+1)*(y1-y0+1)),v=gray[y*w+x];
      if(v<bg*thr&&v<215)m[y*w+x]=1}}
  removeSpecks(m,w,h,[30,20,12][detail]);
  const cr=[2,3,4][detail];let mm=morph(m,w,h,cr,'dilate');mm=morph(mm,w,h,cr,'erode');      // close small gaps
  if(detail>=2)mm=morph(mm,w,h,1,'dilate');                                                   // bold lines only on request
  const out=new ImageData(w,h);
  for(let i=0;i<w*h;i++){const o=i*4;out.data[o]=22;out.data[o+1]=22;out.data[o+2]=22;out.data[o+3]=mm[i]?255:0}
  return{cw:w,ch:h,line:out};
}

/* PHOTO mode: flat colour regions, smoothed, with smooth outlines between them */
function boxBlur(a,w,h,r){
  const t=new Float32Array(w*h),o=new Float32Array(w*h);
  for(let y=0;y<h;y++){let s=0;const row=y*w;for(let x=-r;x<=r;x++)s+=a[row+Math.min(w-1,Math.max(0,x))];
    for(let x=0;x<w;x++){t[row+x]=s/(2*r+1);s+=a[row+Math.min(w-1,x+r+1)]-a[row+Math.max(0,x-r)]}}
  for(let x=0;x<w;x++){let s=0;for(let y=-r;y<=r;y++)s+=t[Math.min(h-1,Math.max(0,y))*w+x];
    for(let y=0;y<h;y++){o[y*w+x]=s/(2*r+1);s+=t[Math.min(h-1,y+r+1)*w+x]-t[Math.max(0,y-r)*w+x]}}
  return o;
}
function photoToLines(img,detail){
  const P=[{s:200,k:6,min:110},{s:280,k:8,min:70},{s:360,k:10,min:50}][detail];
  const ar=(img.naturalWidth/img.naturalHeight)||1;
  let w,h;if(ar>=1){w=P.s;h=Math.max(8,Math.round(P.s/ar))}else{h=P.s;w=Math.max(8,Math.round(P.s*ar))}
  const t=document.createElement('canvas');t.width=w;t.height=h;const tc=t.getContext('2d',{willReadFrequently:true});
  tc.fillStyle='#fff';tc.fillRect(0,0,w,h);tc.drawImage(img,0,0,w,h);
  const id=tc.getImageData(0,0,w,h),d=id.data,n=w*h;
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
  const K=P.k,step=Math.max(1,Math.floor(n/6000)),samp=[];
  for(let i=0;i<n;i+=step)samp.push(i);
  samp.sort((a,b)=>(src[a*3]+src[a*3+1]+src[a*3+2])-(src[b*3]+src[b*3+1]+src[b*3+2]));
  const cen=[];for(let k=0;k<K;k++){const i=samp[Math.floor((k+.5)/K*samp.length)];cen.push([src[i*3],src[i*3+1],src[i*3+2]])}
  const near=i=>{let bi=0,bd=1e18;const r=src[i*3],gg=src[i*3+1],b=src[i*3+2];for(let k=0;k<K;k++){const c=cen[k],dd=(r-c[0])**2+(gg-c[1])**2+(b-c[2])**2;if(dd<bd){bd=dd;bi=k}}return bi};
  for(let it=0;it<7;it++){
    const sum=cen.map(()=>[0,0,0,0]);
    for(const i of samp){const k=near(i),s2=sum[k];s2[0]+=src[i*3];s2[1]+=src[i*3+1];s2[2]+=src[i*3+2];s2[3]++}
    sum.forEach((s2,k)=>{if(s2[3])cen[k]=[s2[0]/s2[3],s2[1]/s2[3],s2[2]/s2[3]]});
  }
  let lab=new Int32Array(n);for(let i=0;i<n;i++)lab[i]=near(i);
  // majority filter: removes speckle so the outlines are calm
  for(let pass=0;pass<2;pass++){
    const nl=new Int32Array(n),cnt=new Int32Array(K);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      cnt.fill(0);
      for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;cnt[lab[yy*w+xx]]++}}
      let bk=lab[y*w+x],bc=cnt[bk];for(let k=0;k<K;k++)if(cnt[k]>bc){bc=cnt[k];bk=k}
      nl[y*w+x]=bk;
    }
    lab=nl;
  }
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
  for(let guard=0;guard<8000;guard++){
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
  // boundary mask at working size, upscaled, then blurred + thresholded for smooth round lines
  const mc=document.createElement('canvas');mc.width=w;mc.height=h;const mx=mc.getContext('2d'),mi=mx.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x;
    if((x<w-1&&comp[p]!==comp[p+1])||(y<h-1&&comp[p]!==comp[p+w])){const o=p*4;mi.data[o]=22;mi.data[o+1]=22;mi.data[o+2]=22;mi.data[o+3]=255}}
  mx.putImageData(mi,0,0);
  const sc=1000/Math.max(w,h),cw=Math.round(w*sc),ch=Math.round(h*sc);
  const oc=document.createElement('canvas');oc.width=cw;oc.height=ch;const o2=oc.getContext('2d',{willReadFrequently:true});
  o2.imageSmoothingEnabled=true;o2.imageSmoothingQuality='high';o2.drawImage(mc,0,0,cw,ch);
  const out=o2.getImageData(0,0,cw,ch),od=out.data,al=new Float32Array(cw*ch);
  for(let i=0;i<cw*ch;i++)al[i]=od[i*4+3];
  const br=Math.max(2,Math.round(sc*.9));
  let bl=boxBlur(al,cw,ch,br);bl=boxBlur(bl,cw,ch,br);
  const cut=70;
  for(let i=0;i<cw*ch;i++){const o=i*4;od[o]=22;od[o+1]=22;od[o+2]=22;od[o+3]=bl[i]>cut?255:0}
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
function floodRegion(seedIdx,w,h,d,tr,tg,tb,tol,wallArr){
  const ok=i=>{if(wallArr&&wallArr[i])return false;const o=i*4;return Math.abs(d[o]-tr)+Math.abs(d[o+1]-tg)+Math.abs(d[o+2]-tb)<=tol};
  const seen=new Uint8Array(w*h),stack=[seedIdx];seen[seedIdx]=1;let cnt=0;
  while(stack.length){
    const p=stack.pop();const x=p%w,y=(p-x)/w;
    let l=x;while(l>0&&!seen[y*w+l-1]&&ok(y*w+l-1))l--;
    let r=x;while(r<w-1&&!seen[y*w+r+1]&&ok(y*w+r+1))r++;
    for(let xx=l;xx<=r;xx++){seen[y*w+xx]=1;cnt++}
    for(const yy of[y-1,y+1]){if(yy<0||yy>=h)continue;
      let inRun=false;for(let xx=l;xx<=r;xx++){const q=yy*w+xx;if(!seen[q]&&ok(q)){if(!inRun){stack.push(q);seen[q]=1;inRun=true}}else inRun=false}}
  }
  return{seen,cnt};
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
  let best=floodRegion(idx,w,h,d,tr,tg,tb,tol,wall),rUsed=0;
  // spilled across most of the page through a gap in the lines? retry treating small gaps as closed
  if(wall&&best.cnt>w*h*.4){
    for(const r of[5,10,18,28]){
      const wr=morph(wall,w,h,r,'dilate');if(wr[idx])break;
      const a=floodRegion(idx,w,h,d,tr,tg,tb,tol,wr);
      if(a.cnt<best.cnt*.6&&a.cnt<=w*h*.4){best=a;rUsed=r;break}
    }
  }
  let paint=best.seen;
  if(rUsed){ // grow back up to the real lines so no white halo is left beside the gap
    const grow=morph(best.seen,w,h,rUsed,'dilate');paint=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++){if(!grow[i]||wall[i])continue;const o=i*4;if(best.seen[i]||Math.abs(d[o]-tr)+Math.abs(d[o+1]-tg)+Math.abs(d[o+2]-tb)<=tol)paint[i]=1}
  }
  for(let i=0;i<w*h;i++)if(paint[i]){const o=i*4;d[o]=nr;d[o+1]=ng;d[o+2]=nb;d[o+3]=255}
  pctx.putImageData(img,0,0);
  ML.sfx.collect();
  if(st.mode==='photo'&&!rUsed&&best.cnt>w*h*.6)toast('It spilled! Tap ↩️, then 🔍 for different lines');
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
