/* The host: a little unicorn who lives in the top bar of every game and reacts to what she does.
   She breathes, blinks, talks while a voice line plays, hops and giggles when she is right, wobbles her head when she tries
   again, and dances when she wins. Drawn with code (no image files), so it works offline.
   Also: hand-drawn icons for the game tiles (replacing the plain emoji). */
(function(g){
'use strict';
const TAU=Math.PI*2;
const H={t:0,mood:'idle',moodT:0,oy:0,vy:0,tilt:0,tiltV:0,spin:0,party:0,blinkT:2.5,blink:0,sp:[],cv:null,cx:null,acc:null,talk:0};
const lerp=(a,b,k)=>a+(b-a)*k;
const star=(c,x,y,r,rot)=>{c.save();c.translate(x,y);c.rotate(rot||0);c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?r*.38:r;c.lineTo(Math.cos(a)*q,Math.sin(a)*q)}c.closePath();c.fill();c.restore()};

H.attach=function(){
  const cv=document.getElementById('ghost');if(!cv)return false;
  H.cv=cv;const d=Math.min(3,window.devicePixelRatio||1),s=60;cv.width=Math.round(s*d);cv.height=Math.round(s*d);cv.style.width=s+'px';cv.style.height=s+'px';
  H.cx=cv.getContext('2d');H.k=cv.width/120;return true;
};
H.start=function(gameId){H.mood='idle';H.moodT=0;H.oy=0;H.vy=0;H.tilt=0;H.tiltV=0;H.party=0;H.sp=[];H.acc=gameId==='clinic'?'doctor':null;if(!H.cv)H.attach()};
H.cheer=function(){H.mood='happy';H.moodT=1.1;H.vy=-260;for(let i=0;i<5;i++)H.sp.push({x:60+(Math.random()*70-35),y:50+(Math.random()*40-20),vx:(Math.random()-.5)*40,vy:-30-Math.random()*40,l:.9,r:5+Math.random()*4,c:['#ffe66d','#ff8fc7','#8fd0ff','#fff'][i%4]})};
H.oops=function(){H.mood='sad';H.moodT=1.0;H.tiltV=-5;H.tilt=-.05};
H.winDance=function(){H.mood='happy';H.moodT=6;H.party=5};

function mouth(c,mood,open){
  c.lineCap='round';c.strokeStyle='#5a2a52';c.fillStyle='#7a1e3a';c.lineWidth=3;
  if(open>.05){const h=3+open*9;c.beginPath();c.ellipse(0,0,6+open*2,h,0,0,TAU);c.fill();c.fillStyle='#ff8fa8';c.beginPath();c.ellipse(0,h*.45,4,h*.5,0,0,TAU);c.fill();return}
  c.beginPath();
  if(mood==='sad'){c.arc(0,6,6,Math.PI*1.2,Math.PI*1.8);c.stroke()}
  else{c.arc(0,-2,7,.2*Math.PI,.8*Math.PI);c.stroke()}
}

H.frame=function(dt){
  const cx=H.cx;if(!cx)return;
  H.t+=dt;
  // physics: hop, wobble, mood timers
  H.vy+=900*dt;H.oy+=H.vy*dt;if(H.oy>0){H.oy=0;H.vy=0}
  if(H.party>0){H.party-=dt;if(H.oy===0)H.vy=-210;H.spin=Math.sin(H.t*7)*.22;if(Math.random()<dt*14)H.sp.push({x:60+(Math.random()*90-45),y:60+(Math.random()*60-30),vx:(Math.random()-.5)*50,vy:-20-Math.random()*50,l:.9,r:4+Math.random()*5,c:['#ffe66d','#ff8fc7','#8fd0ff','#c9a8ff','#fff'][(Math.random()*5)|0]})}
  else H.spin*=.9;
  H.tiltV+=(-H.tilt*60-H.tiltV*5)*dt;H.tilt+=H.tiltV*dt;
  if(H.moodT>0){H.moodT-=dt;if(H.moodT<=0)H.mood='idle'}
  H.blinkT-=dt;if(H.blinkT<=0){H.blink=.14;H.blinkT=2.5+Math.random()*3}
  if(H.blink>0)H.blink-=dt;
  const talking=!!(g.Voice&&g.Voice.speaking&&g.Voice.speaking());
  H.talk=lerp(H.talk,talking?(Math.sin(H.t*16)*.5+.5)*(.55+.45*Math.sin(H.t*5.3)):0,Math.min(1,dt*20));

  const c=cx,k=H.k;
  c.setTransform(k,0,0,k,0,0);c.clearRect(0,0,120,120);
  const bob=Math.sin(H.t*2.2)*1.6,breathe=1+Math.sin(H.t*2.2)*.012;
  c.save();c.translate(60,70+bob+H.oy*.25);c.rotate(H.tilt+H.spin);c.scale(breathe,1/breathe*1.0);
  // mane (behind): rainbow tufts that sway
  const sway=Math.sin(H.t*2.6)*2;
  [['#ff8fc7',-30,-4,15],['#c9a8ff',-36,14,14],['#8fd0ff',-30,30,12],['#ff8fc7',30,-6,13],['#c9a8ff',35,12,12]].forEach(m=>{c.fillStyle=m[0];c.beginPath();c.ellipse(m[1]+(m[1]<0?-sway:sway)*.6,m[2],m[3],m[3]*1.18,0,0,TAU);c.fill()});
  // ears
  for(const sx of[-1,1]){c.fillStyle='#fff';c.strokeStyle='#f2b6d6';c.lineWidth=2.5;c.beginPath();c.moveTo(sx*17,-24);c.lineTo(sx*28,-46);c.lineTo(sx*5,-30);c.closePath();c.fill();c.stroke();c.fillStyle='#ffc4e1';c.beginPath();c.moveTo(sx*17,-27);c.lineTo(sx*24,-40);c.lineTo(sx*10,-30);c.closePath();c.fill()}
  // horn
  const hg=c.createLinearGradient(0,-70,0,-26);hg.addColorStop(0,'#fff3a8');hg.addColorStop(1,'#ffc94a');
  c.fillStyle=hg;c.strokeStyle='#e8a82a';c.lineWidth=2;c.beginPath();c.moveTo(-8,-27);c.lineTo(0,-70);c.lineTo(8,-27);c.closePath();c.fill();c.stroke();
  c.strokeStyle='rgba(232,168,42,.8)';c.lineWidth=2;for(let i=0;i<3;i++){const y=-34-i*10,w=7-i*2;c.beginPath();c.moveTo(-w,y+3);c.lineTo(w,y-3);c.stroke()}
  // head
  const gr=c.createRadialGradient(-8,-14,4,0,0,40);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#ffe3f1');
  c.fillStyle=gr;c.strokeStyle='#f2b6d6';c.lineWidth=3;c.beginPath();c.ellipse(0,0,35,31,0,0,TAU);c.fill();c.stroke();
  // forelock curl
  c.fillStyle='#ff8fc7';c.beginPath();c.ellipse(-9,-26,10,7,-.5,0,TAU);c.fill();c.fillStyle='#c9a8ff';c.beginPath();c.ellipse(5,-27,8,6,.3,0,TAU);c.fill();
  // doctor cap
  if(H.acc==='doctor'){c.fillStyle='#fff';c.strokeStyle='#ff6fa8';c.lineWidth=2.5;c.beginPath();c.ellipse(0,-31,17,7,0,0,TAU);c.fill();c.stroke();c.fillStyle='#ff6fa8';c.fillRect(-1.6,-37,3.2,10);c.fillRect(-5,-33.4,10,3.2)}
  // eyes
  const happy=H.mood==='happy',sad=H.mood==='sad',blinking=H.blink>0;
  for(const sx of[-1,1]){
    const ex=sx*13,ey=-1;
    if(happy||blinking){c.strokeStyle='#3b2260';c.lineWidth=3;c.lineCap='round';c.beginPath();
      if(happy)c.arc(ex,ey+2,6,Math.PI*1.1,Math.PI*1.9);else{c.moveTo(ex-6,ey+1);c.lineTo(ex+6,ey+1)}c.stroke()}
    else{
      c.fillStyle='#fff';c.beginPath();c.ellipse(ex,ey,8.5,9.5,0,0,TAU);c.fill();
      c.fillStyle='#3b2260';c.beginPath();c.ellipse(ex+(sad?0:.8),ey+(sad?2.2:1),5.6,6.6,0,0,TAU);c.fill();
      c.fillStyle='#fff';c.beginPath();c.arc(ex+2.4,ey-2,2,0,TAU);c.fill();c.beginPath();c.arc(ex-1.2,ey+3,1,0,TAU);c.fill();
      if(sad){c.strokeStyle='#3b2260';c.lineWidth=2;c.beginPath();c.moveTo(ex-7*sx,ey-12);c.lineTo(ex+5*sx,ey-9);c.stroke()}
    }
    c.fillStyle='rgba(255,120,160,.5)';c.beginPath();c.ellipse(sx*23,ey+11,6,4,0,0,TAU);c.fill();
  }
  // nose + mouth
  c.fillStyle='rgba(255,140,170,.6)';c.beginPath();c.arc(-3,12,1.4,0,TAU);c.arc(3,12,1.4,0,TAU);c.fill();
  c.save();c.translate(0,19);mouth(c,H.mood,happy&&H.talk<.05?.75:H.talk);c.restore();
  c.restore();
  // sparkles
  for(let i=H.sp.length-1;i>=0;i--){const s=H.sp[i];s.l-=dt;if(s.l<=0){H.sp.splice(i,1);continue}s.x+=s.vx*dt;s.y+=s.vy*dt;c.globalAlpha=Math.min(1,s.l*2);c.fillStyle=s.c;star(c,s.x,s.y,s.r,H.t*3+i);c.globalAlpha=1}
};

/* ---------------- tile icons (100 x 100 drawings) ---------------- */
const I={};
const grad=(c,y0,y1,a,b)=>{const q=c.createLinearGradient(0,y0,0,y1);q.addColorStop(0,a);q.addColorStop(1,b);return q};
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
const shine=(c,x,y,w,h,rot)=>{c.save();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(x,y,w,h,rot||0,0,TAU);c.fill();c.restore()};
const out=(c,col,w)=>{c.lineJoin='round';c.lineCap='round';c.lineWidth=w||5;c.strokeStyle=col};
const shape=(c,t,x,y,r,a,b)=>{c.save();c.translate(x,y);c.beginPath();
  if(t==='circle')c.arc(0,0,r,0,TAU);else if(t==='square')rr(c,-r,-r,2*r,2*r,r*.22);else if(t==='triangle'){c.moveTo(0,-r);c.lineTo(r*.95,r*.8);c.lineTo(-r*.95,r*.8);c.closePath()}
  c.fillStyle=grad(c,-r,r,a,b);c.fill();out(c,'#fff',4.5);c.stroke();shine(c,-r*.3,-r*.45,r*.45,r*.18,-.5);c.restore()};
I.sorter=c=>{shape(c,'circle',29,66,19,'#8fd0ff','#4aa8ff');shape(c,'square',70,66,18,'#ffd36b','#ffa94d');shape(c,'triangle',50,28,19,'#ff8fc7','#ff4f9a');
  c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(50,86,2,0,TAU);c.fill()};
I.bubbles=c=>{[[40,58,28],[72,36,16],[74,74,13]].forEach(b=>{c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.arc(b[0],b[1],b[2],0,TAU);c.fill();out(c,'#fff',4);c.stroke();
  c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=4;c.beginPath();c.arc(b[0],b[1],b[2]*.7,Math.PI*1.05,Math.PI*1.5);c.stroke()})};
I.build=c=>{shape(c,'square',50,68,22,'#8fd0ff','#4aa8ff');shape(c,'triangle',50,30,19,'#ff8fc7','#ff4f9a');
  c.fillStyle='#ffe66d';c.beginPath();c.arc(50,66,7,0,TAU);c.fill();out(c,'#fff',3);c.stroke();
  shape(c,'square',20,74,10,'#c9a8ff','#8a5cff');shape(c,'square',80,74,10,'#c9a8ff','#8a5cff')};
I.trace=c=>{c.save();c.translate(50,50);c.rotate(-.7);
  c.fillStyle=grad(c,-12,12,'#ffe66d','#ffc94a');rr(c,-34,-11,56,22,4);c.fill();out(c,'#fff',4);c.stroke();
  c.fillStyle='#ffd7b0';c.beginPath();c.moveTo(22,-11);c.lineTo(40,0);c.lineTo(22,11);c.closePath();c.fill();c.stroke();
  c.fillStyle='#3b2260';c.beginPath();c.moveTo(34,-4);c.lineTo(40,0);c.lineTo(34,4);c.closePath();c.fill();
  c.fillStyle='#ff8fc7';rr(c,-44,-11,12,22,4);c.fill();c.stroke();c.restore();
  c.setLineDash([2,9]);out(c,'#fff',5);c.beginPath();c.moveTo(14,82);c.quadraticCurveTo(40,60,86,86);c.stroke();c.setLineDash([])};
I.memory=c=>{c.save();c.translate(36,52);c.rotate(-.2);c.fillStyle='#fff';rr(c,-20,-28,40,56,7);c.fill();out(c,'#c9a8ff',4);c.stroke();c.fillStyle='#ff6fa8';c.beginPath();c.moveTo(0,10);c.bezierCurveTo(-18,-3,-10,-16,0,-6);c.bezierCurveTo(10,-16,18,-3,0,10);c.fill();c.restore();
  c.save();c.translate(64,50);c.rotate(.18);c.fillStyle=grad(c,-28,28,'#a98aff','#7a4ee0');rr(c,-20,-28,40,56,7);c.fill();out(c,'#fff',4);c.stroke();c.fillStyle='#ffe66d';star(c,0,0,12,0);c.restore()};
I.count=c=>{c.fillStyle=grad(c,25,85,'#ff7a7a','#e03a4e');c.beginPath();c.moveTo(50,35);c.bezierCurveTo(20,20,8,60,28,78);c.bezierCurveTo(38,90,46,84,50,84);c.bezierCurveTo(54,84,62,90,72,78);c.bezierCurveTo(92,60,80,20,50,35);c.fill();out(c,'#fff',4);c.stroke();
  shine(c,34,52,6,12,.4);c.strokeStyle='#7a4a2a';c.lineWidth=5;c.beginPath();c.moveTo(50,35);c.quadraticCurveTo(50,24,56,16);c.stroke();
  c.fillStyle='#6fd36f';c.beginPath();c.ellipse(64,22,13,6,-.5,0,TAU);c.fill();out(c,'#fff',3);c.stroke()};
I.feed=c=>{c.save();c.translate(50,56);c.rotate(.6);c.fillStyle=grad(c,-30,34,'#ffb35c','#ff7a1f');c.beginPath();c.moveTo(-14,-22);c.lineTo(14,-22);c.lineTo(0,40);c.closePath();c.fill();out(c,'#fff',4);c.stroke();
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2.5;[[-8,-8,6],[-6,6,5],[-3,18,3]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[0]+l[2],l[1]);c.stroke()});
  c.fillStyle='#5fd16a';[-.5,0,.5].forEach(a=>{c.save();c.translate(0,-22);c.rotate(a);c.beginPath();c.ellipse(0,-14,6,15,0,0,TAU);c.fill();out(c,'#fff',3);c.stroke();c.restore()});c.restore()};
I.train=c=>{c.fillStyle=grad(c,30,70,'#6fb7ff','#3a86ff');rr(c,14,42,50,28,6);c.fill();out(c,'#fff',4);c.stroke();
  c.fillStyle=grad(c,24,70,'#ff8fc7','#ff4f9a');rr(c,56,28,28,42,6);c.fill();c.stroke();
  c.fillStyle='#fff';rr(c,62,34,16,14,3);c.fill();c.fillStyle='#ffe66d';rr(c,22,26,12,18,3);c.fill();out(c,'#fff',3);c.stroke();
  c.fillStyle='#ffd36b';[28,48,72].forEach(x=>{c.beginPath();c.arc(x,74,9,0,TAU);c.fill();out(c,'#fff',3.5);c.stroke();c.fillStyle='#3b2260';c.beginPath();c.arc(x,74,2.5,0,TAU);c.fill();c.fillStyle='#ffd36b'});
  c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(26,16,6,0,TAU);c.arc(34,9,4.5,0,TAU);c.fill();
  c.fillStyle='#fff';c.font='900 18px system-ui,sans-serif';c.textAlign='center';c.fillText('1',39,62)};
I.balloons=c=>{[[40,44,24,'#ff6f91','#e0306a'],[66,52,18,'#8fd0ff','#4aa8ff']].forEach(b=>{c.fillStyle=grad(c,b[1]-b[2]*1.2,b[1]+b[2]*1.2,b[3],b[4]);c.beginPath();c.ellipse(b[0],b[1],b[2]*.88,b[2]*1.1,0,0,TAU);c.fill();out(c,'#fff',4);c.stroke();shine(c,b[0]-b[2]*.3,b[1]-b[2]*.45,b[2]*.22,b[2]*.38,.4);
  c.fillStyle=b[4];c.beginPath();c.moveTo(b[0]-4,b[1]+b[2]*1.1);c.lineTo(b[0]+4,b[1]+b[2]*1.1);c.lineTo(b[0],b[1]+b[2]*1.1+6);c.closePath();c.fill();
  c.strokeStyle='#fff';c.lineWidth=2.5;c.beginPath();c.moveTo(b[0],b[1]+b[2]*1.1+6);c.quadraticCurveTo(b[0]+8,b[1]+b[2]*1.1+16,b[0]-2,92);c.stroke()})};
I.add=c=>{c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.arc(50,50,38,0,TAU);c.fill();
  c.fillStyle='#fff';rr(c,43,22,14,56,6);c.fill();rr(c,22,43,56,14,6);c.fill();c.fillStyle='#ffe66d';star(c,78,24,8,.3);c.fillStyle='#ff8fc7';star(c,22,78,6,.2)};
I.clinic=c=>{c.fillStyle='#fff';rr(c,14,34,72,50,10);c.fill();out(c,'#ff6fa8',4);c.stroke();rr(c,36,22,28,16,6);out(c,'#ff6fa8',5);c.stroke();
  c.fillStyle='#ff4f9a';rr(c,44,44,12,32,3);c.fill();rr(c,34,54,32,12,3);c.fill()};
I.draw=c=>{c.save();c.translate(52,48);c.rotate(.7);c.fillStyle=grad(c,-8,8,'#ffe66d','#ffc94a');rr(c,-6,-40,12,46,4);c.fill();out(c,'#fff',3.5);c.stroke();c.fillStyle='#c9c9d8';rr(c,-7,2,14,10,3);c.fill();c.stroke();
  c.fillStyle='#ff4f9a';c.beginPath();c.moveTo(-7,12);c.quadraticCurveTo(0,40,7,12);c.closePath();c.fill();c.stroke();c.restore();
  c.fillStyle='#ff4f9a';c.beginPath();c.ellipse(28,82,13,6,-.2,0,TAU);c.fill();c.fillStyle='#8fd0ff';c.beginPath();c.ellipse(52,86,9,5,.1,0,TAU);c.fill();c.fillStyle='#ffe66d';c.beginPath();c.ellipse(74,82,8,5,0,0,TAU);c.fill()};
I.page=c=>{[['#ff6f91',34,-.25],['#4aa8ff',58,.12]].forEach(k=>{c.save();c.translate(k[1],54);c.rotate(k[2]);c.fillStyle=k[0];rr(c,-9,-26,18,50,3);c.fill();out(c,'#fff',3.5);c.stroke();
  c.fillStyle='#fff';c.fillRect(-9,-10,18,14);c.fillStyle=k[0];c.fillRect(-9,-6,18,2.5);c.beginPath();c.moveTo(-9,-26);c.lineTo(0,-42);c.lineTo(9,-26);c.closePath();c.fill();c.stroke();c.restore()});
  c.fillStyle='#ffe66d';[[80,22],[18,24]].forEach(s=>star(c,s[0],s[1],7,.3))};
I.photo=c=>{c.fillStyle=grad(c,28,80,'#fff','#e6efff');rr(c,12,32,76,52,12);c.fill();out(c,'#fff',3);c.stroke();rr(c,34,22,24,14,5);c.fill();
  c.fillStyle=grad(c,40,76,'#6fb7ff','#5a4bd6');c.beginPath();c.arc(50,58,19,0,TAU);c.fill();out(c,'#cfd8ff',4);c.stroke();c.fillStyle='#3b2260';c.beginPath();c.arc(50,58,9,0,TAU);c.fill();shine(c,43,50,5,3,-.6);
  c.fillStyle='#ff6fa8';c.beginPath();c.arc(78,44,3.5,0,TAU);c.fill()};
I.book=c=>{c.fillStyle='#ff9f4d';rr(c,14,24,72,58,8);c.fill();out(c,'#fff',4);c.stroke();c.fillStyle='#fff';rr(c,22,32,56,42,5);c.fill();
  c.fillStyle='#ffe66d';star(c,40,52,9,0);c.fillStyle='#ff8fc7';star(c,62,46,7,.4);c.fillStyle='#8fd0ff';star(c,58,66,6,.2)};

/* make a small canvas holding one of the icons (null if there is none) */
H.icon=function(name,size){
  const fn=I[name];if(!fn)return null;
  const d=Math.min(3,window.devicePixelRatio||1),cv=document.createElement('canvas');cv.width=cv.height=Math.round(size*d);cv.style.width=cv.style.height=size+'px';cv.className='ticon';cv.setAttribute('aria-hidden','true');
  const c=cv.getContext('2d');c.scale(cv.width/100,cv.width/100);c.lineJoin='round';c.lineCap='round';
  try{fn(c)}catch(e){return null}
  return cv;
};
g.Host=H;
})(window);
