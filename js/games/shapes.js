/* SHAPE games: sorter, bubbles, build, trace, memory */
(function(g){
'use strict';
const Stage=g.Stage;
const ALL=['circle','square','triangle','star','heart','diamond','rectangle','oval'];

/* ---------------------------------------------------------------- 1. Shape Sorter */
Stage.register({id:'sorter',cat:'shapes',name:'Shape Sorter',icon:'🧩',color:['#ff9ab5','#ff6b9d'],levels:4,stickers:['🐰','🐱','🐶','🦊'],
create(A){
  const D=A.Draw,LV=[ALL.slice(0,3),ALL.slice(0,4),ALL.slice(0,6),ALL];
  let holes=[],pieces=[],placed=0,wrong=0,order=null;
  const drag=A.drag(()=>pieces.slice().sort((a,b)=>(a.z||0)-(b.z||0)),{
    pick:it=>{A.sfx.pop();A.say(it.t)},
    drop:(it)=>{
      const h=holes.find(h=>h.t===it.t&&!h.done);
      if(h&&Math.hypot(it.x-h.x,it.y-h.y)<h.r*1.6){
        h.done=true;it.locked=true;it.placed=true;A.tween(it,{x:h.x,y:h.y,r:h.r},250,{ease:A.easeBack});
        A.good();A.burst(h.x,h.y,14);placed++;A.progress(placed,pieces.length);
        if(placed===pieces.length)A.later(900,()=>A.win({stars:3}));
      }else{
        const near=holes.some(h=>!h.done&&Math.hypot(it.x-h.x,it.y-h.y)<h.r*1.5);
        A.oops();if(near&&(++wrong%2===1))A.say('try_again');
        A.tween(it,{x:it.hx,y:it.hy},300,{ease:A.easeBack});
      }
    }});
  function layout(){
    const W=A.W,H=A.H,types=LV[A.level],n=types.length;
    const cols=n<=4?n:(n===6?3:4),rows=Math.ceil(n/cols),cw=W/cols;
    const r=Math.min(cw*.36,H*.085,60);
    if(!order)order=A.shuffle(types);
    const rowH=Math.min(r*2.5,(H*.38)/rows);
    holes=order.map((t,i)=>{const o=holes[i]||{};return{t,x:cw*(i%cols+.5),y:H*.2+Math.floor(i/cols)*rowH+r,r,done:o.done||false}});
    const pt=pieces.length?pieces.map(p=>p.t):A.shuffle(types);
    const pc=n<=4?n:(n===6?3:4),pr=Math.ceil(n/pc),pw=W/pc;
    const old=pieces;
    pieces=pt.map((t,i)=>{const o=old.find(p=>p.t===t);
      const hx=pw*(i%pc+.5)+(i%2?6:-6),hy=H*.7+Math.floor(i/pc)*Math.min(r*2.4,H*.12);
      const p=o||{t,x:hx,y:hy,placed:false,locked:false};p.hx=hx;p.hy=hy;
      if(p.placed){const h=holes.find(h=>h.t===t);p.x=h.x;p.y=h.y;p.r=h.r}else{p.r=r;if(!p.drag){p.x=hx;p.y=hy}}
      return p});
  }
  return{
    dbg:()=>({holes,pieces}),
    init(){layout();A.progress(0,pieces.length);A.setPrompt(()=>A.say('drag_home'));A.say('drag_home')},
    resize:layout,
    update(){},
    down(x,y){drag.down(x,y)},move(x,y){drag.move(x,y)},up(x,y){drag.up(x,y)},
    draw(c){
      D.bgFill(c,A.W,A.H,'sky',A.t);
      c.fillStyle='rgba(255,255,255,.55)';c.beginPath();D.rrect(c,8,A.H*.12,A.W-16,A.H*.42,28);c.fill();
      for(const h of holes)if(!h.done)D.drawShape(c,h.t,h.x,h.y,h.r,{silhouette:true});
      c.fillStyle='rgba(255,255,255,.35)';c.beginPath();D.rrect(c,8,A.H*.6,A.W-16,A.H*.36,28);c.fill();
      const arr=pieces.slice().sort((a,b)=>(a.z||0)-(b.z||0));
      arr.forEach((p,i)=>{
        if(p.drag){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(p.x+6,p.y+p.r*.9,p.r*.9,p.r*.3,0,0,7);c.fill()}
        D.drawShape(c,p.t,p.x,p.y,p.r*(p.drag?1.12:1),{face:p.drag?'wow':'happy',t:A.t+i,rot:p.locked?0:Math.sin(A.t*2+i)*.06});
      });
    }
  };
}});

/* ---------------------------------------------------------------- 2. Shape Bubbles */
Stage.register({id:'bubbles',cat:'shapes',name:'Pop the Shape',icon:'🫧',color:['#7fdcff','#4aa8ff'],levels:3,stickers:['🐸','🐢','🐳','🦆'],
create(A){
  const D=A.Draw,LV=[{types:ALL.slice(0,3),need:5},{types:ALL.slice(0,5),need:7},{types:ALL,need:9}];
  const cfg=LV[A.level];let bubs=[],target=null,got=0,spawn=0,lock=false;
  function newTarget(){
    const o=cfg.types.filter(t=>t!==target);target=A.pick(o);
    A.say('pop_the',target);
  }
  function mk(type){const r=A.rnd(44,60);return{t:type,x:A.rnd(r+6,A.W-r-6),y:A.H+r,r,vy:-A.rnd(55,80)-A.level*14,ph:A.rnd(0,6),wob:0,pop:0}}
  return{
    dbg:()=>({bubs,target}),
    init(){A.progress(0,cfg.need);A.setPrompt(()=>A.say('pop_the',target));newTarget();for(let i=0;i<5;i++){const b=mk(A.pick(cfg.types));b.y=A.rnd(A.H*.3,A.H);bubs.push(b)}},
    update(dt){
      spawn-=dt;
      if(spawn<=0&&bubs.length<8){spawn=.7;bubs.push(mk(Math.random()<.4?target:A.pick(cfg.types)))}
      if(!bubs.some(b=>b.t===target&&b.pop===0)&&bubs.length<12)bubs.push(mk(target));
      for(let i=bubs.length-1;i>=0;i--){const b=bubs[i];b.y+=b.vy*dt;b.ph+=dt;b.wob=Math.max(0,b.wob-dt*2);if(b.y<-b.r-10)bubs.splice(i,1)}
    },
    down(x,y){
      if(lock)return;
      for(let i=bubs.length-1;i>=0;i--){const b=bubs[i],bx=b.x+Math.sin(b.ph*1.5)*14;
        if(Math.hypot(bx-x,b.y-y)<b.r*1.15){
          if(b.t===target){
            bubs.splice(i,1);A.burst(bx,b.y,16,['#fff','#bfeaff','#ffd1f0']);A.good();got++;A.progress(got,cfg.need);A.say(b.t);
            if(got>=cfg.need){lock=true;A.later(900,()=>A.win({stars:3}))}else A.later(700,newTarget);
          }else{b.wob=1;A.oops();if(Math.random()<.5)A.say('try_again')}
          return;
        }}
    },
    draw(c){
      D.bgFill(c,A.W,A.H,'sky',A.t);
      for(const b of bubs){
        const bx=b.x+Math.sin(b.ph*1.5)*14,w=Math.sin(b.wob*20)*b.wob*8;
        c.save();c.translate(bx+w,b.y);
        const gr=c.createRadialGradient(-b.r*.3,-b.r*.35,b.r*.1,0,0,b.r);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(.6,'rgba(190,235,255,.35)');gr.addColorStop(1,'rgba(130,200,255,.55)');
        c.fillStyle=gr;c.beginPath();c.arc(0,0,b.r,0,7);c.fill();c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=3;c.stroke();
        D.drawShape(c,b.t,0,0,b.r*.55,{face:'happy',t:A.t});
        c.restore();
      }
      // target card
      const cx=A.W/2,cy=Math.max(120,A.H*.13);
      D.pill(c,cx,cy,Math.min(260,A.W*.7),84,'rgba(255,255,255,.92)','#ff9ed2');
      c.font='800 30px '+D.FONT;c.fillStyle='#b44bd6';c.textAlign='center';c.textBaseline='middle';c.fillText('Pop',cx-52,cy);
      D.drawShape(c,target,cx+42,cy,30+Math.sin(A.t*4)*2,{face:'happy',t:A.t});
    }
  };
}});

/* ---------------------------------------------------------------- 3. Build with shapes */
const PICS=[
  {name:'ice cream',slots:[{t:'triangle',x:0,y:.38,r:.4,rot:Math.PI},{t:'circle',x:0,y:-.06,r:.3},{t:'circle',x:0,y:-.42,r:.22},{t:'heart',x:0,y:-.68,r:.1}]},
  {name:'house',slots:[{t:'square',x:0,y:.25,r:.45},{t:'triangle',x:0,y:-.5,r:.46},{t:'rectangle',x:0,y:.46,r:.16,rot:Math.PI/2},{t:'circle',x:-.2,y:.18,r:.09},{t:'circle',x:.2,y:.18,r:.09}]},
  {name:'rocket',slots:[{t:'oval',x:0,y:.05,r:.4,rot:Math.PI/2},{t:'triangle',x:0,y:-.65,r:.29},{t:'triangle',x:-.36,y:.38,r:.17,rot:-.5},{t:'triangle',x:.36,y:.38,r:.17,rot:.5},{t:'circle',x:0,y:-.05,r:.13},{t:'star',x:0,y:.66,r:.13,rot:Math.PI}]},
  {name:'castle',slots:[{t:'rectangle',x:0,y:.22,r:.46},{t:'square',x:-.52,y:.14,r:.2},{t:'square',x:.52,y:.14,r:.2},{t:'triangle',x:-.52,y:-.2,r:.2},{t:'triangle',x:.52,y:-.2,r:.2},{t:'rectangle',x:0,y:.4,r:.13,rot:Math.PI/2},{t:'star',x:0,y:-.24,r:.12}]}
];
Stage.register({id:'build',cat:'shapes',name:'Build with Shapes',icon:'🏰',color:['#ffd36b','#ff9f4d'],levels:4,stickers:['🦁','🐯','🐻','🐼'],
create(A){
  const D=A.Draw,pic=PICS[A.level%PICS.length];
  let slots=[],pieces=[],S=100,cx=0,cy=0,placed=0,topM=84;
  const drag=A.drag(()=>pieces.slice().sort((a,b)=>(a.z||0)-(b.z||0)),{
    pick:it=>{A.sfx.pop();A.say(it.t)},
    drop:it=>{
      let best=null,bd=1e9;
      for(const s of slots){if(s.done||s.t!==it.t)continue;const d=Math.hypot(it.x-s.x,it.y-s.y);if(d<bd){bd=d;best=s}}
      if(best&&bd<Math.max(best.r*1.3,76)){
        best.done=true;it.locked=true;it.placed=true;A.tween(it,{x:best.x,y:best.y,r:best.r,rot:best.rot||0},260,{ease:A.easeBack});
        A.good();A.burst(best.x,best.y,12);placed++;A.progress(placed,pieces.length);
        if(placed===pieces.length)finish();
      }else{A.oops();A.tween(it,{x:it.hx,y:it.hy},300,{ease:A.easeBack})}
    }});
  function finish(){
    pieces.forEach((p,i)=>A.later(i*120,()=>A.burst(p.x,p.y,6)));
    A.say('hooray');
    A.later(1100,()=>A.win({stars:3}));
  }
  function layout(){
    const W=A.W,H=A.H;cx=W/2;
    // keep the whole picture below the top bar (buttons + host) and above the pieces tray
    const bar=document.getElementById('gtop');topM=Math.max(84,(bar?bar.getBoundingClientRect().bottom:70)+12);
    const bot=H*.55,avail=bot-topM-14;let mn=1e9,mx=-1e9;
    for(const q of pic.slots){const e=q.r*(q.t==='circle'||q.t==='star'?1.08:1.16);mn=Math.min(mn,q.y-e);mx=Math.max(mx,q.y+e)}
    S=Math.min(W*.46,avail/(mx-mn));cy=topM+7+(-mn)*S+(avail-(mx-mn)*S)/2;
    slots=pic.slots.map((s,i)=>({t:s.t,x:cx+s.x*S,y:cy+s.y*S,r:s.r*S,rot:s.rot||0,done:slots[i]?slots[i].done:false}));
    const n=slots.length,cols=n<=4?n:4,cell=W/cols;
    const order=pieces.length?pieces.map(p=>p.i):A.shuffle(slots.map((s,i)=>i));
    const old=pieces;
    pieces=order.map((si,k)=>{
      const s=slots[si],hx=cell*(k%cols+.5),hy=H*.66+Math.floor(k/cols)*Math.min(H*.14,cell*.9);
      const o=old.find(p=>p.i===si),tr=Math.min(s.r,cell*.36);
      const p=o||{i:si,t:s.t,x:hx,y:hy,rot:s.rot,placed:false};
      p.hx=hx;p.hy=hy;p.rot=s.rot;
      if(p.placed){p.x=s.x;p.y=s.y;p.r=s.r}else{p.r=tr;if(!p.drag){p.x=hx;p.y=hy}}
      return p});
  }
  return{
    dbg:()=>({slots,pieces}),
    init(){layout();A.progress(0,pieces.length);A.setPrompt(()=>A.say('build_it'));A.say('build_it')},
    resize:layout,
    down(x,y){drag.down(x,y)},move(x,y){drag.move(x,y)},up(x,y){drag.up(x,y)},
    update(){},
    draw(c){
      D.bgFill(c,A.W,A.H,'warm',A.t);
      c.fillStyle='rgba(255,255,255,.6)';c.beginPath();D.rrect(c,10,topM-4,A.W-20,A.H*.55-topM+8,30);c.fill();
      for(const s of slots)if(!s.done)D.drawShape(c,s.t,s.x,s.y,s.r,{silhouette:true,rot:s.rot});
      c.fillStyle='rgba(255,255,255,.35)';c.beginPath();D.rrect(c,10,A.H*.58,A.W-20,A.H*.38,30);c.fill();
      const arr=pieces.slice().sort((a,b)=>(a.z||0)-(b.z||0)),all=placed===pieces.length;
      arr.forEach((p,i)=>D.drawShape(c,p.t,p.x,p.y,p.r*(p.drag?1.12:1),{rot:p.rot,face:all?'happy':(p.drag?'wow':null),t:A.t+i}));
    }
  };
}});

/* ---------------------------------------------------------------- 4. Trace it */
const DIGITS={
  0:[[.5,.05],[.78,.18],[.84,.5],[.78,.82],[.5,.95],[.22,.82],[.16,.5],[.22,.18],[.5,.05]],
  1:[[.3,.24],[.55,.05],[.55,.95]],
  2:[[.2,.24],[.32,.1],[.52,.05],[.72,.12],[.8,.28],[.7,.46],[.2,.92],[.84,.92]],
  3:[[.2,.14],[.5,.05],[.76,.16],[.72,.36],[.46,.48],[.74,.62],[.8,.8],[.52,.95],[.2,.86]],
  4:[[.68,.05],[.14,.66],[.9,.66],'|',[.68,.05],[.68,.95]],
  5:[[.78,.06],[.28,.06],[.24,.46],[.5,.4],[.74,.5],[.8,.7],[.62,.92],[.4,.95],[.2,.86]],
  6:[[.7,.08],[.42,.24],[.26,.54],[.26,.8],[.46,.95],[.7,.88],[.76,.68],[.56,.52],[.3,.62]],
  7:[[.18,.08],[.82,.08],[.4,.95]],
  8:[[.5,.05],[.28,.1],[.26,.3],[.5,.48],[.74,.3],[.72,.1],[.5,.05],'|',[.5,.48],[.22,.64],[.2,.84],[.5,.95],[.8,.84],[.78,.64],[.5,.48]],
  9:[[.74,.34],[.66,.12],[.46,.05],[.26,.14],[.24,.36],[.42,.5],[.66,.44],[.74,.34],[.7,.64],[.54,.88],[.3,.95]]
};
function catmull(pts,seg){
  const out=[];
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
    for(let k=0;k<seg;k++){const t=k/seg,t2=t*t,t3=t2*t;
      out.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}
  }
  out.push(pts[pts.length-1]);return out;
}
function densify(poly,step){
  const out=[poly[0]];
  for(let i=1;i<poly.length;i++){
    const a=poly[i-1],b=poly[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(d/step));
    for(let k=1;k<=n;k++)out.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);
  }
  return out;
}
function shapePoly(t,R){
  const P=[];
  switch(t){
    case'circle':case'oval':{const rx=t==='oval'?R*1.15:R,ry=t==='oval'?R*.72:R;for(let i=0;i<=72;i++){const a=-Math.PI/2+i/72*Math.PI*2;P.push([Math.cos(a)*rx,Math.sin(a)*ry])}break}
    case'square':{const h=R*.86;P.push([-h,-h],[h,-h],[h,h],[-h,h],[-h,-h]);break}
    case'rectangle':{const w=R*1.12,h=R*.66;P.push([-w,-h],[w,-h],[w,h],[-w,h],[-w,-h]);break}
    case'triangle':P.push([0,-R],[R*1.04,R*.8],[-R*1.04,R*.8],[0,-R]);break;
    case'diamond':P.push([0,-R],[R*.74,0],[0,R],[-R*.74,0],[0,-R]);break;
    case'star':for(let i=0;i<=10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?R*.5:R;P.push([Math.cos(a)*q,Math.sin(a)*q])}break;
    case'heart':for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;P.push([16*Math.pow(Math.sin(a),3)*R/17,-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*R/17+R*.1])}break;
  }
  return[P];
}
function digitStrokes(n,bw,bh){
  const raw=DIGITS[n],strokes=[];let cur=[];
  for(const p of raw){if(p==='|'){strokes.push(cur);cur=[]}else cur.push(p)}
  strokes.push(cur);
  return strokes.map(s=>{const sm=s.length>2?catmull(s,6):s;return sm.map(p=>[(p[0]-.5)*bw,(p[1]-.5)*bh])});
}
Stage.register({id:'trace',cat:'shapes',name:'Trace It',icon:'✏️',color:['#9be8a0','#4cc78a'],levels:4,stickers:['🦋','🐞','🐝','🐌'],
create(A){
  const D=A.Draw;
  const POOLS=[['circle','square','triangle'],['star','heart','rectangle','diamond','oval'],[1,2,3,4,5],[6,7,8,9,0]];
  const rounds=3;let round=0,target=null,strokes=[],si=0,pi=0,tracing=false,B=200,cx=0,cy=0,tol=34,trail=[],doneSet=[],finished=false;
  function build(){
    const W=A.W,H=A.H;B=Math.min(W*.78,H*.46);cx=W/2;cy=H*.48;tol=Math.max(34,B*.1);
    let polys;
    if(typeof target==='number')polys=digitStrokes(target,B*.62,B*.95);else polys=shapePoly(target,B*.46);
    strokes=polys.map(p=>densify(p,Math.max(9,B*.045)).map(q=>[q[0]+cx,q[1]+cy]));
    if(!tracing){si=0;pi=0}
  }
  function nextTarget(){
    const pool=POOLS[A.level].filter(x=>x!==target);target=A.pick(pool);si=0;pi=0;trail=[];tracing=false;finished=false;build();
    A.say('trace_the',typeof target==='number'?'n'+target:target);
  }
  function say(){A.say('trace_the',typeof target==='number'?'n'+target:target)}
  function pos(){return strokes[si][pi]}
  function advance(x,y){
    const st=strokes[si];
    for(let k=pi;k<Math.min(st.length,pi+4);k++){
      if(Math.hypot(st[k][0]-x,st[k][1]-y)<tol){
        pi=k+1;
        if(pi>=st.length-1){
          pi=st.length;
          if(si<strokes.length-1){si++;pi=0;tracing=false;A.sfx.pop()}
          else completeShape();
        }
        return;
      }
    }
  }
  function completeShape(){
    finished=true;tracing=false;A.good();round++;A.progress(round,rounds);
    A.burst(cx,cy,24);A.say(typeof target==='number'?'n'+target:target);
    if(round>=rounds)A.later(1100,()=>A.win({stars:3}));else A.later(1400,nextTarget);
  }
  return{
    dbg:()=>({strokes,tol,si,pi}),
    init(){A.progress(0,rounds);A.setPrompt(say);nextTarget()},
    resize(){build()},
    update(){},
    down(x,y){
      if(finished)return;
      const p=strokes[si][Math.min(pi,strokes[si].length-1)];
      if(Math.hypot(p[0]-x,p[1]-y)<tol*2.4){tracing=true;trail.push({x,y,t:A.t});advance(x,y)}
    },
    move(x,y){if(tracing&&!finished){trail.push({x,y,t:A.t});if(trail.length>40)trail.shift();advance(x,y);if(Math.random()<.35)A.sp(x,y,{life:.6,max:.6,c:A.pick(A.RB),sz:A.rnd(7,12),vr:4,gy:60})}},
    up(){tracing=false},
    draw(c){
      D.bgFill(c,A.W,A.H,'meadow',A.t);
      c.fillStyle='rgba(255,255,255,.75)';c.beginPath();D.rrect(c,10,A.H*.14,A.W-20,A.H*.68,36);c.fill();
      c.lineCap='round';c.lineJoin='round';
      strokes.forEach((st,k)=>{
        // dotted guide
        c.beginPath();st.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
        c.setLineDash([2,Math.max(14,B*.07)]);c.lineWidth=Math.max(10,B*.06);c.strokeStyle='rgba(120,90,180,.55)';c.stroke();c.setLineDash([]);
        // coloured progress
        const upto=k<si||finished?st.length:(k===si?pi:0);
        if(upto>1){c.lineWidth=Math.max(14,B*.085);
          for(let i=1;i<upto;i++){c.strokeStyle='hsl('+((i*7+k*60)%360)+',85%,60%)';c.beginPath();c.moveTo(st[i-1][0],st[i-1][1]);c.lineTo(st[i][0],st[i][1]);c.stroke()}}
      });
      if(!finished){
        const p=strokes[si][Math.min(pi,strokes[si].length-1)],b=1+Math.sin(A.t*6)*.12;
        c.fillStyle='#38c76a';c.beginPath();c.arc(p[0],p[1],tol*.8*b,0,7);c.fill();c.lineWidth=5;c.strokeStyle='#fff';c.stroke();
        c.fillStyle='#fff';c.beginPath();c.moveTo(p[0]-6,p[1]-9);c.lineTo(p[0]+10,p[1]);c.lineTo(p[0]-6,p[1]+9);c.fill();
      }else if(typeof target!=='number'){D.drawShape(c,target,cx,cy,B*.2,{face:'happy',t:A.t})}
    }
  };
}});

/* ---------------------------------------------------------------- 5. Memory match */
Stage.register({id:'memory',cat:'shapes',name:'Memory Match',icon:'🃏',color:['#c9a8ff','#8a5cff'],levels:4,stickers:['🦄','🐴','🦓','🦒'],
create(A){
  const D=A.Draw;
  const LV=[{pairs:3,mode:'shape'},{pairs:4,mode:'shape'},{pairs:6,mode:'num'},{pairs:8,mode:'shape'}];
  const cfg=LV[A.level];let cards=[],first=null,busy=false,matched=0,cw=80,ch=100;
  function make(){
    const list=[];
    if(cfg.mode==='shape'){A.shuffle(ALL).slice(0,cfg.pairs).forEach(t=>{list.push({k:'shape',v:t,id:t},{k:'shape',v:t,id:t})})}
    else{for(let n=1;n<=cfg.pairs;n++)list.push({k:'num',v:n,id:'n'+n},{k:'dots',v:n,id:'n'+n})}
    cards=A.shuffle(list).map(c=>Object.assign(c,{state:'down',flip:0}));
  }
  function layout(){
    const n=cards.length,cols={6:3,8:4,12:3,16:4}[n]||4,rows=Math.ceil(n/cols);
    const gap=10;cw=Math.min((A.W-24-gap*(cols-1))/cols,(A.H*.74-gap*(rows-1))/rows*.82,120);ch=cw*1.2;
    const tw=cols*cw+(cols-1)*gap,th=rows*ch+(rows-1)*gap,x0=(A.W-tw)/2,y0=A.H*.14+(A.H*.8-th)/2;
    cards.forEach((c,i)=>{c.x=x0+(i%cols)*(cw+gap)+cw/2;c.y=y0+Math.floor(i/cols)*(ch+gap)+ch/2});
  }
  function speak(c){A.say(c.k==='shape'?c.v:'n'+c.v)}
  return{
    dbg:()=>({cards,cw,ch}),
    init(){make();layout();A.progress(0,cfg.pairs);A.setPrompt(()=>A.say('make_pairs'));A.say('make_pairs')},
    resize:layout,update(){},
    down(x,y){
      if(busy)return;
      const c=cards.find(c=>c.state==='down'&&Math.abs(c.x-x)<cw/2&&Math.abs(c.y-y)<ch/2);if(!c)return;
      c.state='up';A.tween(c,{flip:1},230);A.sfx.pop();speak(c);
      if(!first){first=c;return}
      const a=first,b=c;first=null;busy=true;
      A.later(650,()=>{
        if(a.id===b.id){a.state=b.state='done';A.good();A.burst(a.x,a.y,10);A.burst(b.x,b.y,10);matched++;A.progress(matched,cfg.pairs);busy=false;
          if(matched===cfg.pairs)A.later(700,()=>A.win({stars:3}))}
        else{A.oops();A.tween(a,{flip:0},230);A.tween(b,{flip:0},230,{done:()=>{a.state=b.state='down';busy=false}})}
      });
    },
    draw(c){
      D.bgFill(c,A.W,A.H,'lilac',A.t);
      for(const cd of cards){
        const sx=Math.abs(1-2*cd.flip),front=cd.flip>.5;
        c.save();c.translate(cd.x,cd.y);c.scale(Math.max(.02,sx),1);
        if(cd.state==='done'){c.globalAlpha=.55}
        c.beginPath();D.rrect(c,-cw/2,-ch/2,cw,ch,cw*.16);
        if(!front){
          const gr=c.createLinearGradient(0,-ch/2,0,ch/2);gr.addColorStop(0,'#ff8fcf');gr.addColorStop(1,'#a96bff');c.fillStyle=gr;c.fill();c.lineWidth=5;c.strokeStyle='#fff';c.stroke();
          c.fillStyle='rgba(255,255,255,.8)';D.star4(c,0,0,cw*.24,A.t*.5);
        }else{
          c.fillStyle='#fff';c.fill();c.lineWidth=5;c.strokeStyle='#ffb3e1';c.stroke();
          if(cd.k==='shape')D.drawShape(c,cd.v,0,0,cw*.32,{face:'happy',t:A.t});
          else if(cd.k==='num')D.drawNum(c,cd.v,0,0,cw*.7,'#ff6fb5');
          else{const n=cd.v,cols=n<=2?n:n<=4?2:3,rows=Math.ceil(n/cols),sz=cw*.2;
            for(let i=0;i<n;i++){const col=i%cols,row=Math.floor(i/cols),w=Math.min(cols,n-row*cols);
              c.fillStyle=['#ff6b6b','#4dabf7','#51cf66'][row%3];c.beginPath();c.arc((col-(w-1)/2)*sz*1.7,(row-(rows-1)/2)*sz*1.7,sz*.7,0,7);c.fill()}}
        }
        c.restore();
      }
    }
  };
}});
})(window);
