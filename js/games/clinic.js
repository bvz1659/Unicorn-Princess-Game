/* Dr. Unicorn's clinic: help a poorly animal friend with shapes and numbers. */
(function(g){
'use strict';
const Stage=g.Stage;
const ALL=['circle','square','triangle','star','heart','diamond','rectangle','oval'];
const COLORS=['#ff6b6b','#ffa94d','#ffd43b','#51cf66','#4dabf7','#9775fa','#f783ac'];
const PETS=['🐰','🐱','🐶','🐻','🐼','🐨'];

Stage.register({id:'clinic',cat:'more',name:'Dr. Unicorn',icon:'🩺',color:['#ff9ec8','#ff6fa8'],levels:3,stickers:['🧸','🩹','🌡️','🏥'],
create(A){
  const D=A.Draw;
  const pet=A.pick(PETS),total=3;
  const pool=A.level===0?['bandage','temp','heart']:['bandage','temp','heart','pills'];
  const order=A.shuffle(pool).slice(0,total);
  let idx=0,task=null,hop=0,fin=false;
  const px=()=>A.W/2,py=()=>A.H*.34;

  /* --- helpers --- */
  function drawPill(c,x,y,s,rot){c.save();c.translate(x,y);c.rotate(rot||-.5);
    c.beginPath();D.rrect(c,-s,-s*.5,s,s,s*.5);c.fillStyle='#ff6b8a';c.fill();
    c.beginPath();D.rrect(c,0,-s*.5,s,s,s*.5);c.fillStyle='#fff';c.fill();
    c.lineWidth=3;c.strokeStyle='#e04870';c.beginPath();D.rrect(c,-s,-s*.5,s*2,s,s*.5);c.stroke();c.restore()}
  function next(){
    idx++;A.progress(idx,total);hop=1;A.good();A.burst(px(),py(),18);
    if(idx>=total){fin=true;A.say('feel_better');A.later(400,()=>A.burst(px()-60,py()-80,16));A.later(1800,()=>A.win({stars:3}))}
    else A.later(1100,start);
  }

  /* --- tasks --- */
  function bandage(){
    const t=A.pick(ALL.slice(0,A.level===0?3:A.level===1?5:8)),opts=A.shuffle([t,...A.shuffle(ALL.filter(x=>x!==t)).slice(0,2)]);
    let pcs=[],owie={x:0,y:0,r:40},done=false;
    const drag=A.drag(()=>pcs,{pick:it=>A.sfx.pop(),drop:it=>{
      if(it.t===t&&Math.hypot(it.x-owie.x,it.y-owie.y)<owie.r*2.2){it.locked=true;done=true;A.tween(it,{x:owie.x,y:owie.y,r:owie.r},220,{ease:A.easeBack});A.say(t);next()}
      else{A.oops();A.say('try_again');A.tween(it,{x:it.hx,y:it.hy},300,{ease:A.easeBack})}}});
    function lay(){owie.x=px()+Math.min(46,A.W*.1);owie.y=py()+Math.min(40,A.H*.05);owie.r=Math.min(34,A.W*.08);
      pcs=opts.map((s,i)=>{const o=pcs[i],hx=A.W/2+(i-1)*Math.min(120,A.W*.3),hy=A.H*.8;return Object.assign(o||{t:s,r:0,locked:false},{hx,hy,r:o&&o.locked?o.r:Math.min(46,A.W*.11),x:o&&(o.locked||o.drag)?o.x:hx,y:o&&(o.locked||o.drag)?o.y:hy})})}
    lay();
    return{lay,say:()=>A.say('not_well','need_bandage',t),down:(x,y)=>drag.down(x,y),move:(x,y)=>drag.move(x,y),up:(x,y)=>drag.up(x,y),
      draw(c){
        if(!done)D.drawShape(c,t,owie.x,owie.y,owie.r,{silhouette:true,color:null});
        c.fillStyle='rgba(255,255,255,.55)';c.beginPath();D.rrect(c,10,A.H*.68,A.W-20,A.H*.28,26);c.fill();
        pcs.forEach((p,i)=>D.drawShape(c,p.t,p.x,p.y,p.r*(p.drag?1.12:1),{face:p.locked?'happy':null,t:A.t+i}));
      }};
  }
  function pills(){
    const need=1+Math.floor(Math.random()*(A.level>=2?5:3));let got=0,pcs=[],lock=false;
    const drag=A.drag(()=>pcs.filter(p=>!p.locked),{pick:()=>A.sfx.pop(),drop:it=>{
      const near=Math.hypot(it.x-px(),it.y-(py()+30))<Math.min(110,A.W*.28);
      if(near&&got<need){got++;it.locked=true;A.tween(it,{x:px()-18+got*10,y:py()+34,s:.1},260);A.say(...A.numWords(got));A.burst(px(),py()+30,6);if(got===need){lock=true;A.later(700,next)}}
      else if(near){A.oops();A.say('too_many');A.tween(it,{x:it.hx,y:it.hy},300)}
      else A.tween(it,{x:it.hx,y:it.hy},300,{ease:A.easeBack})}});
    function lay(){const n=Math.min(9,need+2),cols=Math.min(5,n),cell=Math.min(66,(A.W-40)/cols);
      const old=pcs;pcs=[];for(let i=0;i<n;i++){const o=old[i],hx=A.W/2+((i%cols)-(cols-1)/2)*cell,hy=A.H*.8+Math.floor(i/cols)*cell*.7;
        pcs.push(Object.assign(o||{locked:false,s:1,r:cell*.4},{hx,hy,r:cell*.4,x:o&&(o.locked||o.drag)?o.x:hx,y:o&&(o.locked||o.drag)?o.y:hy}))}}
    lay();
    return{lay,say:()=>A.say('not_well','i_need','n'+need,'i_pills'),down:(x,y)=>{if(!lock)drag.down(x,y)},move:(x,y)=>drag.move(x,y),up:(x,y)=>drag.up(x,y),
      draw(c){
        c.fillStyle='rgba(255,255,255,.55)';c.beginPath();D.rrect(c,10,A.H*.68,A.W-20,A.H*.28,26);c.fill();
        D.pill(c,A.W-62,py()-10,84,84,'rgba(255,255,255,.95)','#ff8ac4');D.drawNum(c,need,A.W-62,py()-8,62,'#ff6b6b');
        for(const p of pcs)drawPill(c,p.x,p.y,p.r*(p.s||1)*(p.drag?1.2:1),-.5);
      }};
  }
  function heart(){
    const need=2+Math.floor(Math.random()*(A.level+3));let cnt=0,pulse=0,lock=false;
    const hr=()=>Math.min(46,A.W*.11),hx=()=>px()-Math.min(30,A.W*.07),hy=()=>py()+Math.min(36,A.H*.045);
    return{lay(){},say:()=>A.say('listen_heart','tap_the','heart','n'+need,'times'),
      down(x,y){if(lock)return;if(Math.hypot(x-hx(),y-hy())<hr()*1.8){cnt++;pulse=1;A.sfx.boing();A.say(...A.numWords(cnt));A.burst(hx(),hy(),8,['#ff6fb5','#fff']);if(cnt>=need){lock=true;A.later(700,next)}}},
      move(){},up(){},
      draw(c){
        pulse=Math.max(0,pulse-.05);
        const s=hr()*(1+.1*Math.sin(A.t*5)+pulse*.45);
        D.drawShape(c,'heart',hx(),hy(),s,{face:null});
        D.em(c,'🩺',hx()+hr()*1.5,hy()+hr()*.9,hr()*1.6);
        D.pill(c,A.W-62,py()-10,84,84,'rgba(255,255,255,.95)','#ff8ac4');D.drawNum(c,need,A.W-62,py()-8,62,'#ff6b6b');
        for(let i=0;i<need;i++){c.fillStyle=i<cnt?'#ff6fb5':'rgba(255,111,181,.25)';c.beginPath();c.arc(A.W/2+(i-(need-1)/2)*34,A.H*.7,12,0,7);c.fill()}
      }};
  }
  function temp(){
    const v=1+Math.floor(Math.random()*(A.level>=1?9:5));let lock=false,btns=null;
    const vals=(()=>{const s=new Set([v]);while(s.size<3)s.add(1+Math.floor(Math.random()*(A.level>=1?9:5)));return A.shuffle([...s])})();
    function lay(){const w=Math.min(104,(A.W-40)/3-10);btns=vals.map((n,i)=>({n,x:A.W/2+(i-1)*(w+14),y:A.H*.82,w,shake:0,pop:0}))}
    lay();
    return{lay,say:()=>{A.say('check_temp');const V=window.Voice,hd=V&&V.has&&V.has('check_temp')?(V.dur(['check_temp'])||1.5):0;A.later(Math.max(1500,hd*1000+350),()=>A.say(...A.numWords(v)))},
      down(x,y){if(lock)return;for(const b of btns)if(Math.abs(b.x-x)<b.w/2+6&&Math.abs(b.y-y)<b.w/2+6){
        if(b.n===v){lock=true;b.pop=1;A.say(...A.numWords(v));A.later(900,next)}else{b.shake=1;A.tween(b,{shake:0},400);A.oops();A.say('try_again')}return}},
      move(){},up(){},
      draw(c){
        // thermometer display
        const tx=A.W-Math.min(80,A.W*.2),ty=py();
        c.fillStyle='#fff';c.beginPath();D.rrect(c,tx-26,ty-70,52,120,26);c.fill();c.lineWidth=5;c.strokeStyle='#ff8ac4';c.stroke();
        c.fillStyle='#ff4d6d';c.beginPath();c.arc(tx,ty+38,20,0,7);c.fill();c.fillRect(tx-6,ty-50,12,86);
        D.pill(c,tx,ty-96,76,56,'#fff','#ff8ac4');D.drawNum(c,v,tx,ty-95,44,'#ff6b6b');
        for(const [i,b] of btns.entries()){
          c.save();c.translate(b.x+Math.sin(b.shake*30)*b.shake*8,b.y-b.pop*12);
          c.beginPath();D.rrect(c,-b.w/2,-b.w/2,b.w,b.w,b.w*.24);c.fillStyle=b.pop?'#b9f5c8':'#fff';c.fill();c.lineWidth=6;c.strokeStyle=COLORS[(i*2+1)%7];c.stroke();
          D.drawNum(c,b.n,0,0,b.w*.7,COLORS[(i*2+1)%7]);c.restore();
        }
      }};
  }
  const B={bandage,pills,heart,temp};
  function start(){task=B[order[idx]]();task.say()}

  return{
    dbg:()=>({task,idx,order}),
    init(){A.progress(0,total);A.setPrompt(()=>task&&task.say());A.say('clinic_hello');{const V=window.Voice,hd=V&&V.has&&V.has('clinic_hello')?(V.dur(['clinic_hello'])||3.6):0;A.later(Math.max(2300,hd*1000+450),start)}},
    resize(){if(task&&task.lay)task.lay()},
    update(dt){hop=Math.max(0,hop-dt*1.4)},
    down(x,y){if(task&&!fin)task.down(x,y)},move(x,y){if(task&&!fin)task.move(x,y)},up(x,y){if(task&&!fin)task.up(x,y)},
    draw(c){
      D.bgFill(c,A.W,A.H,'clinic',A.t);
      // bed
      c.fillStyle='rgba(0,0,0,.1)';c.beginPath();c.ellipse(px(),py()+70,Math.min(170,A.W*.42),24,0,0,7);c.fill();
      c.fillStyle='#fff';c.beginPath();D.rrect(c,px()-Math.min(160,A.W*.4),py()+36,Math.min(320,A.W*.8),44,22);c.fill();c.lineWidth=5;c.strokeStyle='#ffb3d9';c.stroke();
      // patient
      const sz=Math.min(150,A.W*.38),bounce=fin?Math.abs(Math.sin(A.t*10))*24:Math.sin(hop*Math.PI)*20;
      D.em(c,pet,px(),py()-bounce,sz);
      const mood=fin?'😊':['🤒','🤕','🥺'][Math.min(2,idx)];
      c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.arc(px()-sz*.55,py()-sz*.55,28,0,7);c.fill();c.lineWidth=4;c.strokeStyle='#ffb3d9';c.stroke();D.em(c,mood,px()-sz*.55,py()-sz*.55,34);
      // little doctor hat for the unicorn doctor
      if(task&&!fin)task.draw(c);
    }
  };
}});
})(window);
