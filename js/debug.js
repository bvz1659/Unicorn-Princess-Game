/* Hidden sound check for grown-ups: open Learn & Play, then tap the "Learn & Play" title 5 times quickly.
   Shows what the phone's audio and voice are doing, and has test buttons. */
(function(g){
'use strict';
const ML=g.ML;let box=null,timer=0,taps=[];
function el(tag,txt,parent,css){const e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(css)e.style.cssText=css;if(parent)parent.appendChild(e);return e}
function lines(){
  const out=[];const ss=g.speechSynthesis;let vs=[];try{vs=ss?ss.getVoices():[]}catch(e){}
  const a=ML.audio();
  out.push('sound on: '+ML.S.sound+'   audio: '+(a?a.ac.state:'not started'));
  out.push('speechSynthesis: '+(ss?('yes, voices '+vs.length+', speaking '+ss.speaking+', pending '+ss.pending+', paused '+ss.paused):'NOT SUPPORTED'));
  const en=vs.filter(v=>/^en/i.test(v.lang)).slice(0,6).map(v=>v.name+' ('+v.lang+')').join(', ');
  out.push('english voices: '+(en||'none'));
  out.push('recorded clips: '+(g.Voice?g.Voice.have.size:0)+'   decoded: '+(g.Voice?Object.keys(g.Voice.buf).length:0));
  out.push('offline cache: '+(navigator.serviceWorker&&navigator.serviceWorker.controller?'active':'not active')+'   home screen app: '+(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches));
  out.push('---- last events ----');
  return out.concat(ML.dbgLog().slice(-8));
}
function refresh(){if(box)box.pre.textContent=lines().join('\n')}
function open(){
  if(box){close();return}
  const d=el('div',null,document.body,'position:fixed;left:8px;right:8px;bottom:8px;max-height:60vh;overflow:auto;z-index:99;background:rgba(20,10,40,.94);color:#9dffb0;border-radius:16px;padding:12px;font:12px/1.4 ui-monospace,Menlo,monospace');
  const pre=el('pre',null,d,'margin:0 0 10px;white-space:pre-wrap;word-break:break-word');
  const row=el('div',null,d,'display:flex;gap:8px;flex-wrap:wrap');
  const btn=(t,fn)=>{const b=el('button',t,row,'font:700 14px system-ui;padding:10px 14px;border-radius:12px;border:0;background:#fff;color:#4a2a80');b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ML.unlock();fn()})};
  btn('Say hello',()=>ML.say('Hello! Can you hear me?'));
  const plain=(duck)=>{try{const u=new SpeechSynthesisUtterance('This is the plain phone voice.');u.onstart=()=>ML.dbg('plain: started');u.onerror=e=>ML.dbg('plain: error '+e.error);u.onend=()=>{ML.dbg('plain: finished');ML.ttsRestore()};g.__u2=u;if(duck)ML.ttsDuck();g.speechSynthesis.cancel();setTimeout(()=>{g.speechSynthesis.speak(u);ML.dbg('plain'+(duck?' (audio released)':'')+': queued')},150)}catch(e){ML.dbg('plain threw '+e.message)}};
  btn('Plain voice test',()=>plain(false));
  btn('Voice test, audio released',()=>plain(true));
  btn('Beep',()=>{ML.tone(660,ML.now(),.4,'sine',.3);ML.dbg('beep')});
  btn('Close',close);
  box={d,pre};refresh();timer=setInterval(refresh,600);
}
function close(){if(box){clearInterval(timer);box.d.remove();box=null}}
document.addEventListener('pointerdown',e=>{
  if(!e.target.closest||!e.target.closest('.hubtitle'))return;
  const n=Date.now();taps=taps.filter(t=>n-t<3000);taps.push(n);
  if(taps.length>=5){taps=[];open()}
},true);
if(/debug/.test(location.hash))setTimeout(open,800);
g.SoundCheck={open,close};
})(window);
