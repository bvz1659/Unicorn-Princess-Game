/* NUMBER games: count, feed, train, balloons, add */
(function(g){
'use strict';
const Stage=g.Stage;
const COLORS=['#ff6b6b','#ffa94d','#ffd43b','#51cf66','#4dabf7','#9775fa','#f783ac'];

/* shared: 3 big answer buttons along the bottom */
function answerButtons(A,values,correct,onRight,onWrong){
  const D=A.Draw,btns=[];
  const layout=()=>{const n=values.length,w=Math.min(110,(A.W-40)/n-10);values.forEach((v,i)=>{const b=btns[i]||(btns[i]={v,pop:0,shake:0});b.x=A.W/2+(i-(n-1)/2)*(w+14);b.y=A.H*.84;b.w=w;b.v=v})};
  layout();
  return{
    layout,list:btns,
    down(x,y){
      for(const b of btns)if(Math.abs(b.x-x)<b.w/2+6&&Math.abs(b.y-y)<b.w/2+6){
        if(b.v===correct){b.pop=1;A.tween(b,{pop:0},500);onRight(b)}else{b.shake=1;A.tween(b,{shake:0},400);onWrong(b)}
        return true}
      return false;
    },
    draw(c){
      btns.forEach((b,i)=>{
        c.save();c.translate(b.x+Math.sin(b.shake*30)*b.shake*8,b.y-b.pop*14);c.scale(1+b.pop*.12,1+b.pop*.12);
        c.fillStyle='rgba(0,0,0,.16)';c.beginPath();D.rrect(c,-b.w/2+3,-b.w/2+7,b.w,b.w,b.w*.24);c.fill();
        c.beginPath();D.rrect(c,-b.w/2,-b.w/2,b.w,b.w,b.w*.24);c.fillStyle=b.pop>0?'#b9f5c8':'#fff';c.fill();c.lineWidth=6;c.strokeStyle=COLORS[(i*2+1)%7];c.stroke();
        D.drawNum(c,b.v,0,0,b.w*.7,COLORS[(i*2+1)%7]);c.restore();
      });
    }
  };
}
function distract(correct,max,min){const s=new Set([correct]);let g=0;while(s.size<3&&g++<50){const v=correct+Math.floor(Math.random()*5)-2;if(v>=(min||1)&&v<=max)s.add(v)}let k=1;while(s.size<3){if(!s.has(k))s.add(k);k++}return A_shuffle([...s])}
function A_shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------------------------------------------------------------- 1. Count with me */
Stage.register({id:'count',cat:'numbers',name:'Count with Me',icon:'🍎',color:['#ff9a8b','#ff6a88'],levels:4,stickers:['🐥','🐤','🦜','🦉'],
create(A){
  const D=A.Draw,LV=[[3,5],[5,8],[7,10],[10,14]],rounds=3,EM=['🍎','⭐','🦋','🐰','🌸','🍓','🐥','🍪'];
  let round=0,n=0,emoji='',items=[],cnt=0,phase='count',btns=null,big=0,bigN=0;
  function newRound(){
    const [lo,hi]=LV[A.level];n=lo+Math.floor(Math.random()*(hi-lo+1));emoji=A.pick(EM);cnt=0;phase='count';btns=null;bigN=0;
    const sz=n<=6?76:n<=10?62:52,W=A.W,H=A.H,m=sz*.7+8;items=[];
    let tries=0;
    while(items.length<n&&tries++<4000){
      const x=A.rnd(m,W-m),y=A.rnd(H*.2,H*.72);
      if(items.every(o=>Math.hypot(o.x-x,o.y-y)>sz*1.02))items.push({x,y,sz,counted:0,hop:0,ph:A.rnd(0,6)});
    }
    if(items.length<n)for(let i=items.length;i<n;i++)items.push({x:A.rnd(m,W-m),y:A.rnd(H*.2,H*.72),sz,counted:0,hop:0,ph:A.rnd(0,6)});
    A.say(round===0?'lets_count':'tap_to_count');
  }
  function ask(){
    phase='answer';A.say('how_many');
    btns=answerButtons(A,distract(n,Math.max(6,n+2),1),n,b=>{
      A.good();A.say(...A.numWords(n));A.burst(A.W/2,A.H*.5,20);bigN=n;big=0;
      round++;A.progress(round,rounds);phase='done';
      if(round>=rounds)A.later(1200,()=>A.win({stars:3}));else A.later(1500,newRound);
    },()=>{A.oops();A.say('try_again')});
  }
  return{
    dbg:()=>({items,phase,n,btns:btns&&btns.list}),
    init(){A.progress(0,rounds);A.setPrompt(()=>A.say(phase==='count'?'tap_to_count':'how_many'));newRound()},
    resize(){if(btns)btns.layout()},
    update(){},
    down(x,y){
      if(phase==='count'){
        for(const it of items)if(!it.counted&&Math.hypot(it.x-x,it.y-it.sz*.1-y)<it.sz*.62){
          cnt++;it.counted=cnt;it.hop=1;A.tween(it,{hop:0},400);A.chime(cnt);A.say(...A.numWords(cnt));A.burst(it.x,it.y,6,['#fff','#ffe66d']);
          if(cnt===n)A.later(900,ask);return}
      }else if(phase==='answer'&&btns)btns.down(x,y);
    },
    draw(c){
      D.bgFill(c,A.W,A.H,'sky',A.t);
      for(const it of items){
        const y=it.y-Math.sin(it.hop*Math.PI)*28+(it.counted?0:Math.sin(A.t*2+it.ph)*3);
        c.fillStyle='rgba(0,60,0,.15)';c.beginPath();c.ellipse(it.x,it.y+it.sz*.38,it.sz*.34,it.sz*.1,0,0,7);c.fill();
        D.em(c,emoji,it.x,y,it.sz);
        if(it.counted){c.fillStyle='rgba(255,255,255,.92)';c.beginPath();c.arc(it.x+it.sz*.3,y-it.sz*.34,it.sz*.24,0,7);c.fill();D.drawNum(c,it.counted,it.x+it.sz*.3,y-it.sz*.34,it.sz*.34,'#ff6fb5')}
      }
      if(phase==='answer'&&btns)btns.draw(c);
      if(phase==='done'||bigN){D.drawNum(c,bigN,A.W/2,A.H*.14,A.H*.14,'#ff6fb5')}
    }
  };
}});

/* ---------------------------------------------------------------- 2. Feed me */
const FEEDS=[['🐰','🥕','i_carrots'],['🐱','🐟','i_fish'],['🐻','🍪','i_cookies'],['🐵','🍌','i_bananas'],['🦄','🍎','i_apples']];
Stage.register({id:'feed',cat:'numbers',name:'Feed the Animals',icon:'🥕',color:['#ffd86b','#ffa94d'],levels:4,stickers:['🐰','🐻','🐵','🐱'],
create(A){
  const D=A.Draw,LV=[3,5,7,10],rounds=3;
  let round=0,need=0,pet,food,fid,got=0,items=[],plate={x:0,y:0,rx:90,ry:34},eat=0,lock=false;
  const drag=A.drag(()=>items.filter(i=>!i.locked).sort((a,b)=>(a.z||0)-(b.z||0)),{
    pick:it=>{A.sfx.pop()},
    drop:it=>{
      const near=Math.abs(it.x-plate.x)<plate.rx*1.2&&Math.abs(it.y-plate.y)<plate.ry*2.6;
      if(near&&got<need){
        got++;it.locked=true;const k=got-1,cols=Math.min(need,5),px=plate.x+(k%cols-(Math.min(need,cols)-1)/2)*Math.min(44,plate.rx*1.6/cols),py=plate.y-Math.floor(k/cols)*26-8;
        A.tween(it,{x:px,y:py,s:.62},220,{ease:A.easeBack});A.chime(got);A.say(...A.numWords(got));
        if(got===need)A.later(700,eatIt);
      }else if(near){A.oops();A.say('too_many');A.tween(it,{x:it.hx,y:it.hy},300)}
      else A.tween(it,{x:it.hx,y:it.hy},300,{ease:A.easeBack});
    }});
  function newRound(){
    need=1+Math.floor(Math.random()*LV[A.level]);if(need<1)need=1;
    [pet,food,fid]=A.pick(FEEDS);got=0;eat=0;lock=false;
    const total=Math.min(12,need+3),W=A.W,H=A.H,cols=Math.min(6,total),rows=Math.ceil(total/cols),cell=Math.min(70,(W-40)/cols);
    items=[];for(let i=0;i<total;i++){const hx=W/2+((i%cols)-(cols-1)/2)*cell,hy=H*.78+Math.floor(i/cols)*cell*.9;items.push({x:hx,y:hy,hx,hy,r:cell*.45,s:1})}
    layout();
    A.say('give_me','n'+need,fid);
  }
  function layout(){plate.x=A.W/2;plate.y=A.H*.55;plate.rx=Math.min(110,A.W*.28)}
  function eatIt(){
    lock=true;items.filter(i=>i.locked).forEach((it,k)=>A.later(k*90,()=>{A.tween(it,{x:A.W/2,y:A.H*.27,s:.2},380);A.sfx.pop()}));
    A.later(need*90+500,()=>{eat=1;A.good();A.say('yum');A.react('yum',{chance:.7,delay:500});A.burst(A.W/2,A.H*.27,18);round++;A.progress(round,rounds);
      if(round>=rounds)A.later(1100,()=>A.win({stars:3}));else A.later(1400,newRound)});
  }
  return{
    dbg:()=>({items,plate,need,got}),
    init(){A.progress(0,rounds);A.setPrompt(()=>A.say('give_me','n'+need,fid));newRound()},
    resize(){layout()},
    update(dt){if(eat>0)eat=Math.max(0,eat-dt*1.2)},
    down(x,y){if(!lock)drag.down(x,y)},move(x,y){drag.move(x,y)},up(x,y){drag.up(x,y)},
    draw(c){
      D.bgFill(c,A.W,A.H,'meadow',A.t);
      // animal + sign
      const ax=A.W/2,ay=A.H*.24,hop=Math.abs(Math.sin(A.t*(eat>0?12:2)))*(eat>0?20:4);
      D.em(c,pet,ax,ay-hop,Math.min(150,A.W*.36));
      D.pill(c,Math.min(A.W-70,ax+A.W*.3),ay+10,84,84,'rgba(255,255,255,.95)','#ffa94d');D.drawNum(c,need,Math.min(A.W-70,ax+A.W*.3),ay+12,62,'#ff6b6b');
      // plate
      c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(plate.x+4,plate.y+10,plate.rx,plate.ry,0,0,7);c.fill();
      c.fillStyle='#fff';c.beginPath();c.ellipse(plate.x,plate.y,plate.rx,plate.ry,0,0,7);c.fill();c.lineWidth=6;c.strokeStyle='#ffb3d9';c.stroke();
      c.fillStyle='#ffe3f1';c.beginPath();c.ellipse(plate.x,plate.y,plate.rx*.78,plate.ry*.7,0,0,7);c.fill();
      // tray
      c.fillStyle='rgba(255,255,255,.55)';c.beginPath();D.rrect(c,10,A.H*.68,A.W-20,A.H*.28,26);c.fill();
      for(const it of items.slice().sort((a,b)=>(a.z||0)-(b.z||0)))if(!(it.locked&&eat>0&&false))D.em(c,food,it.x,it.y-(it.drag?10:0),(it.r*2.1)*(it.s||1)*(it.drag?1.15:1));
    }
  };
}});

/* ---------------------------------------------------------------- 3. Number train */
Stage.register({id:'train',cat:'numbers',name:'Number Train',icon:'🚂',color:['#8fe3ff','#4ab8ff'],levels:4,stickers:['🐘','🦏','🐪','🦛'],
create(A){
  const D=A.Draw,LV=[{n:4,given:0},{n:6,given:0},{n:8,given:3},{n:10,given:5}];
  const cfg=LV[A.level];let slots=[],pieces=[],cw=70,placed=0,need=0,go=0,going=false,givenSet=null;
  const drag=A.drag(()=>pieces.filter(p=>!p.locked).sort((a,b)=>(a.z||0)-(b.z||0)),{
    pick:it=>{A.sfx.pop();A.say(...A.numWords(it.v))},
    drop:it=>{
      const s=slots.find(s=>s.v===it.v&&!s.filled);
      if(s&&Math.abs(it.x-s.x)<cw*.9&&Math.abs(it.y-s.y)<cw*.9){
        s.filled=true;it.locked=true;A.tween(it,{x:s.x,y:s.y},200,{ease:A.easeBack});A.good();A.burst(s.x,s.y,10);placed++;A.progress(placed,need);
        if(placed===need)A.later(500,depart);
      }else{A.oops();A.tween(it,{x:it.hx,y:it.hy},300,{ease:A.easeBack})}
    }});
  function layout(){
    const W=A.W,H=A.H,n=cfg.n,perRow=n>6?5:n;cw=Math.min(78,(W-30)/perRow-8);
    const rows=Math.ceil(n/perRow);
    slots=[];for(let i=0;i<n;i++){const row=Math.floor(i/perRow),col=i%perRow,cnt=Math.min(perRow,n-row*perRow);
      const old=slots[i];slots.push({v:i+1,x:W/2+(col-(cnt-1)/2)*(cw+8),y:H*.2+row*(cw+34)+cw*.5,given:false,filled:false})}
    if(!givenSet){
      givenSet=new Set();while(givenSet.size<cfg.given)givenSet.add(1+Math.floor(Math.random()*n));
      A.shuffle(slots.filter(s=>!givenSet.has(s.v)).map(s=>s.v)).forEach(v=>pieces.push({v,x:0,y:0,r:cw*.5,locked:false}));
    }
    slots.forEach(s=>{if(givenSet.has(s.v)){s.given=true;s.filled=true}});
    // refresh slot states & positions for existing
    const fill=pieces.filter(p=>p.locked).map(p=>p.v);slots.forEach(s=>{if(fill.includes(s.v))s.filled=true});
    const cols=Math.min(pieces.length,5),pw=Math.min(cw+12,(W-30)/cols);
    pieces.forEach((p,i)=>{p.hx=W/2+((i%cols)-(cols-1)/2)*pw;p.hy=H*.66+Math.floor(i/cols)*(cw+14);p.r=cw*.5;
      if(p.locked){const s=slots.find(s=>s.v===p.v);p.x=s.x;p.y=s.y}else if(!p.drag){p.x=p.hx;p.y=p.hy}});
    need=pieces.length;
  }
  function depart(){
    going=true;A.sfx.fanfare();
    slots.forEach((s,i)=>A.later(i*430,()=>{A.say(...A.numWords(s.v));A.burst(s.x,s.y,8);s.hl=1;A.tween(s,{hl:0},380)}));
    A.later(slots.length*430+300,()=>{go=0;A.tween(trainX,{x:A.W+400},1400,{ease:A.easeIO});A.later(1500,()=>A.win({stars:3}))});
  }
  const trainX={x:0};
  return{
    dbg:()=>({slots,pieces}),
    init(){layout();A.progress(0,need);A.setPrompt(()=>A.say('put_in_order'));A.say('put_in_order')},
    resize:layout,update(){},
    down(x,y){if(!going)drag.down(x,y)},move(x,y){drag.move(x,y)},up(x,y){drag.up(x,y)},
    draw(c){
      D.bgFill(c,A.W,A.H,'sky',A.t);
      c.save();c.translate(trainX.x,0);
      // track
      c.fillStyle='#8a6a4a';const ty=slots[0]?slots[slots.length>5?Math.min(4,slots.length-1):0].y+cw*.5+14:0;
      slots.forEach((s,i)=>{
        const lift=(s.hl||0)*12;
        c.save();c.translate(s.x,s.y-lift);
        c.beginPath();D.rrect(c,-cw/2,-cw/2,cw,cw,cw*.2);
        if(s.filled){c.fillStyle=COLORS[i%7];c.fill();c.lineWidth=5;c.strokeStyle='#fff';c.stroke();D.drawNum(c,s.v,0,0,cw*.66,'#ffffff')}
        else{c.fillStyle='rgba(70,40,120,.2)';c.fill();c.setLineDash([10,8]);c.lineWidth=4;c.strokeStyle='rgba(255,255,255,.9)';c.stroke();c.setLineDash([])}
        c.fillStyle='#4a3a6a';for(const wx of[-cw*.28,cw*.28]){c.beginPath();c.arc(wx,cw*.5+2,cw*.1,0,7);c.fill()}
        c.restore();
        if(i<slots.length-1&&Math.floor(i/(slots.length>6?5:slots.length))===Math.floor((i+1)/(slots.length>6?5:slots.length))){c.fillStyle='#6a5a8a';c.fillRect(s.x+cw/2,s.y+cw*.15,8,6)}
      });
      c.restore();
      c.fillStyle='rgba(255,255,255,.5)';c.beginPath();D.rrect(c,10,A.H*.6,A.W-20,A.H*.36,26);c.fill();
      for(const p of pieces){if(p.locked){c.save();c.translate(trainX.x,0)}
        else c.save();
        c.translate(p.x,p.y);const sc=p.drag?1.12:1;c.scale(sc,sc);
        c.beginPath();D.rrect(c,-cw/2,-cw/2,cw,cw,cw*.2);c.fillStyle=COLORS[(p.v-1)%7];c.fill();c.lineWidth=5;c.strokeStyle='#fff';c.stroke();D.drawNum(c,p.v,0,0,cw*.66,'#ffffff');
        c.restore()}
    }
  };
}});

/* ---------------------------------------------------------------- 4. Balloon pop */
Stage.register({id:'balloons',cat:'numbers',name:'Balloon Pop',icon:'🎈',color:['#ff9ed2','#ff6fb5'],levels:4,stickers:['🐙','🦑','🐠','🦀'],
create(A){
  const D=A.Draw,LV=[{max:5,mode:'name',need:5},{max:5,mode:'order'},{max:10,mode:'name',need:6},{max:10,mode:'order'}];
  const cfg=LV[A.level];let balloons=[],target=1,got=0,spawn=0,lock=false;
  const total=cfg.mode==='order'?cfg.max:cfg.need;
  function mk(v){const r=A.rnd(46,58);return{v,x:A.rnd(r+8,A.W-r-8),y:A.H+r+20,r,vy:-A.rnd(45,70),ph:A.rnd(0,6),col:COLORS[Math.floor(Math.random()*7)],wob:0}}
  function sayTarget(){A.say('pop_number','n'+target)}
  function newTarget(){const o=[];for(let i=1;i<=cfg.max;i++)if(i!==target)o.push(i);target=A.pick(o);sayTarget()}
  return{
    dbg:()=>({balloons,target}),
    init(){
      A.progress(0,total);A.setPrompt(sayTarget);
      if(cfg.mode==='order')target=1;else target=A.pick(Array.from({length:cfg.max},(_,i)=>i+1));
      sayTarget();
      for(let i=0;i<5;i++){const b=mk(Math.ceil(Math.random()*cfg.max));b.y=A.rnd(A.H*.4,A.H);balloons.push(b)}
    },
    update(dt){
      spawn-=dt;
      if(spawn<=0&&balloons.length<8){spawn=.8;balloons.push(mk(Math.ceil(Math.random()*cfg.max)))}
      if(!balloons.some(b=>b.v===target)&&balloons.length<12)balloons.push(mk(target));
      for(let i=balloons.length-1;i>=0;i--){const b=balloons[i];b.y+=b.vy*dt;b.ph+=dt;b.wob=Math.max(0,b.wob-dt*2);if(b.y<-b.r*2)balloons.splice(i,1)}
    },
    down(x,y){
      if(lock)return;
      for(let i=balloons.length-1;i>=0;i--){const b=balloons[i],bx=b.x+Math.sin(b.ph*1.3)*12;
        if(Math.hypot(bx-x,b.y-y)<b.r*1.2){
          if(b.v===target){
            balloons.splice(i,1);A.burst(bx,b.y,18,[b.col,'#fff']);A.good();A.say(...A.numWords(b.v));got++;A.progress(got,total);
            if(cfg.mode==='order'){target++;if(target>cfg.max){lock=true;A.later(900,()=>A.win({stars:3}))}else A.later(650,sayTarget)}
            else if(got>=total){lock=true;A.later(900,()=>A.win({stars:3}))}else A.later(650,newTarget);
          }else{b.wob=1;A.oops();if(Math.random()<.5)A.say('try_again')}
          return}}
    },
    draw(c){
      D.bgFill(c,A.W,A.H,'sky',A.t);
      for(const b of balloons){
        const bx=b.x+Math.sin(b.ph*1.3)*12+Math.sin(b.wob*20)*b.wob*8;
        c.strokeStyle='rgba(120,100,160,.6)';c.lineWidth=2;c.beginPath();c.moveTo(bx,b.y+b.r*1.1);c.quadraticCurveTo(bx+8,b.y+b.r*1.9,bx-4,b.y+b.r*2.6);c.stroke();
        c.save();c.translate(bx,b.y);
        const gr=c.createRadialGradient(-b.r*.3,-b.r*.4,b.r*.1,0,0,b.r*1.1);gr.addColorStop(0,'#fff');gr.addColorStop(.25,b.col);gr.addColorStop(1,D.shade(b.col));
        c.fillStyle=gr;c.beginPath();c.ellipse(0,0,b.r,b.r*1.18,0,0,7);c.fill();
        c.fillStyle=D.shade(b.col);c.beginPath();c.moveTo(0,b.r*1.14);c.lineTo(-7,b.r*1.34);c.lineTo(7,b.r*1.34);c.fill();
        D.drawNum(c,b.v,0,-2,b.r*1.05,'#ffffff');
        c.restore();
      }
      // target card
      const cx=A.W/2,cy=Math.max(118,A.H*.13);
      D.pill(c,cx,cy,Math.min(280,A.W*.74),80,'rgba(255,255,255,.92)','#ff9ed2');
      c.font='800 28px '+D.FONT;c.fillStyle='#b44bd6';c.textAlign='center';c.textBaseline='middle';c.fillText('Pop',cx-60,cy);
      D.drawNum(c,target,cx+34,cy+2,56,'#ff6fb5');
    }
  };
}});

/* ---------------------------------------------------------------- 5. Add it up */
Stage.register({id:'add',cat:'numbers',name:'Add It Up',icon:'➕',color:['#a0f0b8','#4cc78a'],levels:4,stickers:['🐹','🐭','🐿️','🦔'],
create(A){
  const D=A.Draw,rounds=3,EM=['🍎','⭐','🍓','🐥','🍪','🌸'];
  let round=0,a=0,b=0,op='+',ans=0,emoji='',btns=null,phase='ask',merge=0,gl=[],gr=[];
  const cfgOf=()=>[{max:5,ops:['+']},{max:10,ops:['+']},{max:5,ops:['-']},{max:10,ops:['+','-']}][A.level];
  function grid(n,cx,cy,sz){const out=[],cols=n<=3?n:n<=6?3:3,rows=Math.ceil(n/cols);
    for(let i=0;i<n;i++){const col=i%cols,row=Math.floor(i/cols),w=Math.min(cols,n-row*cols);out.push({x:cx+(col-(w-1)/2)*sz*1.12,y:cy+(row-(rows-1)/2)*sz*1.12,sz,hop:0})}return out}
  function newRound(){
    const cfg=cfgOf();op=A.pick(cfg.ops);emoji=A.pick(EM);
    if(op==='+'){a=1+Math.floor(Math.random()*(cfg.max-1));b=1+Math.floor(Math.random()*(cfg.max-a));ans=a+b}
    else{a=2+Math.floor(Math.random()*(cfg.max-1));b=1+Math.floor(Math.random()*(a-1));ans=a-b}
    phase='ask';merge=0;
    const sz=Math.min(56,A.W*.11);
    gl=grid(a,A.W*.2,A.H*.3,sz);gr=grid(b,A.W*.62,A.H*.3,sz);
    if(op==='-')gr.forEach(it=>it.cross=true);
    btns=answerButtons(A,distract(ans,cfg.max,0),ans,right,()=>{A.oops();A.say('try_again')});
    sayEq();
  }
  function sayEq(){A.say('n'+a,op==='+'?'plus':'minus','n'+b,'equals')}
  function right(){
    A.good();phase='done';
    const all=[...gl,...(op==='+'?gr:[])];
    if(op==='-'){gr.forEach(it=>A.tween(it,{sz:0},400))}
    const keep=op==='+'?all:gl.slice(0,ans);
    let k=0;
    (op==='+'?all:gl).forEach((it,i)=>A.later(i*340,()=>{it.hop=1;A.tween(it,{hop:0},300);if(op==='+'||i<ans){k++;A.say(...A.numWords(k));A.chime(k)}else A.sfx.pop()}));
    A.later((op==='+'?all.length:gl.length)*340+300,()=>{A.burst(A.W/2,A.H*.4,24);round++;A.progress(round,rounds);if(round>=rounds)A.later(800,()=>A.win({stars:3}));else A.later(600,newRound)});
  }
  return{
    dbg:()=>({ans,phase,btns:btns&&btns.list,a,b}),
    init(){A.progress(0,rounds);A.setPrompt(sayEq);A.say('lets_add');A.later(1500,newRound)},
    resize(){if(btns)btns.layout()},update(){},
    down(x,y){if(phase==='ask'&&btns)btns.down(x,y)},
    draw(c){
      D.bgFill(c,A.W,A.H,'pink',A.t);
      if(!btns)return;
      c.fillStyle='rgba(255,255,255,.7)';c.beginPath();D.rrect(c,10,A.H*.14,A.W-20,A.H*.36,30);c.fill();
      const drawG=(g,crossAll)=>g.forEach((it,i)=>{if(it.sz<=1)return;const y=it.y-Math.sin(it.hop*Math.PI)*16;D.em(c,emoji,it.x,y,it.sz);
        if(it.cross&&phase==='ask'){c.strokeStyle='rgba(255,60,90,.9)';c.lineWidth=5;c.beginPath();c.moveTo(it.x-it.sz*.4,y-it.sz*.4);c.lineTo(it.x+it.sz*.4,y+it.sz*.4);c.moveTo(it.x+it.sz*.4,y-it.sz*.4);c.lineTo(it.x-it.sz*.4,y+it.sz*.4);c.stroke()}});
      drawG(gl);drawG(gr);
      D.drawNum(c,op==='+'?'+':'−',A.W*.41,A.H*.3,A.W*.14,'#4dabf7');
      D.drawNum(c,'=',A.W*.84,A.H*.3,A.W*.1,'#ff9f1c');
      if(phase==='done')D.drawNum(c,ans,A.W*.84,A.H*.4,A.W*.14,'#ff6fb5');
      if(phase==='ask')D.drawNum(c,'?',A.W*.84,A.H*.4,A.W*.14,'#ff6fb5');
      D.drawNum(c,a,A.W*.2,A.H*.18,A.W*.1,'#ff6fb5');D.drawNum(c,b,A.W*.62,A.H*.18,A.W*.1,'#ff6fb5');
      if(phase==='ask')btns.draw(c);
    }
  };
}});
})(window);
