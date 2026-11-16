/* Colouring page library: every picture is drawn in code as black outlines (works offline, new variation each time).
   Pictures are drawn on a 1000 x 1000 canvas by ArtLib.render(). */
(function(g){
'use strict';
const T=Math.PI*2;

function rng(seed){let a=seed|0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* painter's-algorithm pen: each new shape erases the lines behind it, then draws its own outline */
function Pen(c,lw){
  const o={c,lw:lw||8};
  c.lineJoin='round';c.lineCap='round';c.strokeStyle='#161616';
  const fin=()=>{c.save();c.globalCompositeOperation='destination-out';c.fill();c.restore();c.lineWidth=o.lw;c.stroke()};
  o.ell=(x,y,rx,ry,rot)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,T);fin()};
  o.circ=(x,y,r)=>o.ell(x,y,r,r,0);
  o.poly=pts=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();fin()};
  o.rr=(x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();fin()};
  o.path=fn=>{c.beginPath();fn(c);c.closePath();fin()};
  o.open=fn=>{c.beginPath();fn(c);c.lineWidth=o.lw;c.stroke()};
  o.dot=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,T);c.fillStyle='#161616';c.fill()};
  o.eye=(x,y,r)=>{o.circ(x,y,r);o.dot(x+r*.12,y+r*.08,r*.52);c.beginPath();c.arc(x+r*.32,y-r*.12,r*.17,0,T);c.fillStyle='#fff';c.fill()};
  o.smile=(x,y,w)=>o.open(c=>{c.arc(x,y-w*.35,w,.25,Math.PI-.25)});
  o.star=(x,y,r,rot)=>o.poly(Array.from({length:10},(_,i)=>{const a=(rot||-Math.PI/2)+i*Math.PI/5,q=i%2?r*.45:r;return[x+Math.cos(a)*q,y+Math.sin(a)*q]}));
  o.heart=(x,y,s)=>o.path(c=>{c.moveTo(x,y+s*.9);c.bezierCurveTo(x-s*1.5,y-s*.1,x-s*.9,y-s,x,y-s*.35);c.bezierCurveTo(x+s*.9,y-s,x+s*1.5,y-s*.1,x,y+s*.9)});
  o.cloud=(x,y,s)=>{o.circ(x-s*.55,y+s*.1,s*.5);o.circ(x+s*.55,y+s*.1,s*.5);o.circ(x,y-s*.2,s*.65);o.rr(x-s*.9,y+s*.15,s*1.8,s*.45,s*.22)};
  o.band=(cx,cy,ro,ri,a0,a1)=>o.path(c=>{c.arc(cx,cy,ro,a0,a1);c.arc(cx,cy,ri,a1,a0,true)});
  return o;
}

/* little decorations in the top corners */
function decor(o,r){
  const pick=Math.floor(r()*4);
  const sp=[[130,120],[870,120]];
  sp.forEach(([x,y],i)=>{
    if(pick===0)o.star(x,y,52,-Math.PI/2+r()*.5);
    else if(pick===1)o.heart(x,y,40);
    else if(pick===2)o.cloud(x,y,40);
    else{o.circ(x,y,38);o.circ(x,y,16)}
  });
}
function bubbles(o,r,n,zone){for(let i=0;i<n;i++)o.circ(zone[0]+r()*zone[2],zone[1]+r()*zone[3],14+r()*22)}
function ground(o,y){o.open(c=>{c.moveTo(60,y);c.lineTo(940,y)})}

/* ================================================================ DINOSAURS */
const stego=(o,r)=>{
  const n=5+Math.floor(r()*3);
  for(let i=0;i<n;i++){const x=300+i*(360/(n-1)),h=70+Math.sin(i/(n-1)*Math.PI)*80;o.poly([[x-40,520],[x,430-h],[x+40,520]])}
  o.path(c=>{c.moveTo(270,570);c.quadraticCurveTo(130,590,60,470);c.quadraticCurveTo(200,720,300,690)});
  o.rr(330,690,74,130,28);o.rr(610,690,74,130,28);
  o.ell(500,610,275,150);
  o.rr(430,720,76,110,28);o.rr(690,720,76,110,28);
  o.ell(805,565,100,74,-.25);
  o.eye(835,540,16);o.smile(835,610,38);
  for(let i=0;i<3;i++)o.circ(390+i*110+r()*20,580+(i%2)*50,22+r()*8);
  ground(o,860);decor(o,r);
};
const trex=(o,r)=>{
  const n=4+Math.floor(r()*3);
  for(let i=0;i<n;i++){const x=420+i*55,y=470-i*10;o.poly([[x-28,y+30],[x,y-50],[x+28,y+30]])}
  o.path(c=>{c.moveTo(330,600);c.quadraticCurveTo(160,630,70,770);c.quadraticCurveTo(260,760,360,720)});
  o.ell(430,790,70,60,0);o.ell(640,790,70,60,0);
  o.ell(540,590,230,170,-.15);
  o.path(c=>{c.moveTo(620,500);c.quadraticCurveTo(700,420,740,360);c.lineTo(820,480);c.quadraticCurveTo(740,560,650,610)});
  o.ell(760,360,135,100,.1);
  o.eye(740,320,17);
  o.open(c=>{c.moveTo(670,400);c.lineTo(880,420)});
  for(let i=0;i<4;i++)o.poly([[690+i*40,404+i*4],[708+i*40,454+i*4],[726+i*40,408+i*4]]);
  o.ell(660,600,30,20,.9);
  for(let i=0;i<3;i++)o.circ(460+i*90,560+(i%2)*60,20+r()*10);
  ground(o,860);decor(o,r);
};
const dinoEgg=(o,r)=>{
  o.circ(500,400,170);
  const sp=Math.floor(r()*3)+3;for(let i=0;i<sp;i++){const x=380+i*(240/(sp-1));o.poly([[x-22,265],[x,205],[x+22,265]])}
  o.eye(430,380,28);o.eye(570,380,28);o.smile(500,470,52);
  o.circ(380,445,22);o.circ(620,445,22);
  o.path(c=>{c.moveTo(220,570);[[300,500],[380,570],[460,500],[540,570],[620,500],[700,570],[780,500]].forEach(p=>c.lineTo(p[0],p[1]));
    c.lineTo(800,570);c.bezierCurveTo(800,750,670,860,500,860);c.bezierCurveTo(330,860,200,750,220,570)});
  for(let i=0;i<5;i++)o.circ(330+r()*340,640+r()*150,22+r()*16);
  ground(o,890);o.star(150,200,48);o.star(850,230,40);
};

/* ================================================================ ANIMALS */
const cat=(o,r)=>{
  o.path(c=>{c.moveTo(640,760);c.bezierCurveTo(840,780,900,620,820,540);c.bezierCurveTo(800,600,780,640,690,640)});
  o.ell(500,740,190,190);
  o.ell(500,770,100,110);
  o.ell(420,890,55,32);o.ell(580,890,55,32);
  o.poly([[310,330],[340,160],[470,250]]);o.poly([[690,330],[660,160],[530,250]]);
  o.ell(500,400,200,170);
  o.poly([[345,300],[355,225],[420,270]]);o.poly([[655,300],[645,225],[580,270]]);
  o.eye(420,390,36);o.eye(580,390,36);
  o.poly([[475,452],[525,452],[500,484]]);
  o.open(c=>{c.moveTo(500,484);c.lineTo(500,505);c.moveTo(500,505);c.quadraticCurveTo(470,540,440,510);c.moveTo(500,505);c.quadraticCurveTo(530,540,560,510)});
  [-1,1].forEach(s=>{for(let i=0;i<3;i++)o.open(c=>{c.moveTo(500+s*85,470+i*12);c.lineTo(500+s*215,430+i*40)})});
  for(let i=0;i<3;i++)o.open(c=>{c.moveTo(470+i*30,230);c.lineTo(470+i*30,275)});
  decor(o,r);
};
const dog=(o,r)=>{
  o.ell(500,780,170,170);o.ell(420,905,50,30);o.ell(580,905,50,30);
  o.ell(500,430,180,160);
  o.ell(315,410,66,150,.25);o.ell(685,410,66,150,-.25);
  o.ell(500,510,100,76);o.ell(500,468,36,25);o.dot(500,468,20);
  o.path(c=>{c.moveTo(470,555);c.quadraticCurveTo(500,640,530,555)});
  o.eye(430,385,28);o.eye(570,385,28);
  o.ell(425,375,52,58,0);
  o.open(c=>{c.moveTo(500,493);c.lineTo(500,545)});
  o.rr(380,605,240,40,20);o.circ(500,670,26);
  decor(o,r);
};
const elephant=(o,r)=>{
  o.ell(500,830,240,130);o.rr(300,880,100,70,30);o.rr(600,880,100,70,30);
  o.circ(280,430,150);o.circ(720,430,150);o.circ(280,430,85);o.circ(720,430,85);
  o.circ(500,440,200);
  o.path(c=>{c.moveTo(440,540);c.quadraticCurveTo(425,720,495,790);c.quadraticCurveTo(540,830,590,775);c.quadraticCurveTo(545,740,560,540)});
  o.eye(425,400,26);o.eye(575,400,26);
  o.ell(405,540,18,50,.3);o.ell(595,540,18,50,-.3);
  for(let i=0;i<4;i++)o.open(c=>{c.moveTo(455+i*3,610+i*40);c.lineTo(540-i*5,610+i*40)});
  decor(o,r);
};
const bunny=(o,r)=>{
  o.ell(500,780,190,180);o.ell(420,910,56,30);o.ell(580,910,56,30);
  o.ell(405,210,52,165,-.12);o.ell(595,210,52,165,.12);o.ell(405,220,24,110,-.12);o.ell(595,220,24,110,.12);
  o.circ(500,430,175);
  o.eye(430,410,28);o.eye(570,410,28);
  o.heart(500,470,24);
  o.open(c=>{c.moveTo(500,500);c.lineTo(500,525);c.moveTo(500,525);c.quadraticCurveTo(470,555,440,530);c.moveTo(500,525);c.quadraticCurveTo(530,555,560,530)});
  o.rr(478,545,22,38,8);o.rr(502,545,22,38,8);
  o.ell(375,480,28,18);o.ell(625,480,28,18);
  const carrot=r()<.7;
  if(carrot){o.poly([[430,700],[500,860],[560,700]]);o.poly([[455,700],[430,640],[470,670]]);o.poly([[500,700],[500,625],[520,690]])}
  decor(o,r);
};

/* ================================================================ MERMAIDS */
const mermaid=(o,r)=>{
  const hair=r()<.5?1:0;
  o.ell(500,290,(hair?170:150),(hair?240:180));
  o.ell(500,720,95,200);
  o.open(c=>{c.moveTo(380,640);c.quadraticCurveTo(430,690,380,760)});
  o.ell(440,925,95,42,-.55);o.ell(560,925,95,42,.55);
  o.path(c=>{c.moveTo(430,440);c.lineTo(570,440);c.lineTo(590,540);c.lineTo(410,540)});
  o.ell(372,500,30,100,.45);o.ell(628,500,30,100,-.45);
  o.ell(467,470,40,30,0);o.ell(533,470,40,30,0);
  o.circ(500,290,100);
  o.eye(463,285,19);o.eye(537,285,19);o.smile(500,345,26);
  o.open(c=>{c.moveTo(435,255);c.quadraticCurveTo(500,200,565,255)});
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)o.open(c=>{c.arc(455+j*45,640+i*80,22,.1,Math.PI-.1)});
  o.star(500,175,26);
  bubbles(o,r,5,[110,180,160,520]);bubbles(o,r,3,[730,300,160,400]);
  o.star(160,780,36);
};
const shells=(o,r)=>{
  o.path(c=>{c.moveTo(200,640);c.bezierCurveTo(150,360,350,230,500,230);c.bezierCurveTo(650,230,850,360,800,640);c.bezierCurveTo(700,700,300,700,200,640)});
  for(let i=0;i<5;i++){const a=Math.PI+.35+i*(Math.PI-.7)/4;o.open(c=>{c.moveTo(500,690);c.lineTo(500+Math.cos(a)*290,690+Math.sin(a)*400)})}
  o.rr(420,690,160,70,25);
  o.star(220,820,92);o.circ(220,820,18);
  o.path(c=>{c.moveTo(720,800);c.bezierCurveTo(720,700,880,700,880,800);c.bezierCurveTo(880,880,760,900,740,850)});
  o.open(c=>{c.arc(800,800,38,0,4)});
  bubbles(o,r,6,[100,100,800,150]);
  o.open(c=>{c.moveTo(60,930);for(let x=60;x<940;x+=90)c.quadraticCurveTo(x+45,880,x+90,930)});
};

/* ================================================================ UNICORNS */
const unicorn=(o,r)=>{
  o.cloud(220,230,70);o.cloud(790,200,60);
  [1,2,3,4,5].forEach((k,i)=>{const col=['','','','','',''];o.band(500,640,330-i*34,300-i*34,Math.PI,Math.PI*2)});
  o.path(c=>{c.moveTo(250,600);c.bezierCurveTo(120,560,70,700,110,820);c.bezierCurveTo(160,720,200,720,270,700)});
  o.rr(300,670,72,190,30);o.rr(560,670,72,190,30);
  o.ell(450,620,230,125);
  o.rr(400,690,72,190,30);o.rr(650,690,72,190,30);
  o.path(c=>{c.moveTo(580,540);c.lineTo(690,320);c.lineTo(790,380);c.lineTo(690,600)});
  o.ell(770,330,100,70,-.45);
  o.poly([[735,285],[800,100],[795,290]]);
  for(let i=0;i<2;i++)o.open(c=>{c.moveTo(752+i*12,235-i*40);c.lineTo(790+i*8,245-i*40)});
  o.poly([[700,280],[690,215],[740,255]]);
  o.eye(795,325,17);
  for(let i=0;i<4;i++)o.circ(610+i*18-i*6,330+i*68,34);
  o.star(160,420,30);o.star(840,590,28);o.heart(880,170,28);
  ground(o,900);
};
const castle=(o,r)=>{
  o.cloud(180,170,60);o.cloud(830,210,52);
  o.rr(300,420,400,420,10);
  [[210,400],[720,400]].forEach(([x,y])=>{o.rr(x,y+40,110,400,8);o.poly([[x-20,y+50],[x+55,y-90],[x+130,y+50]])});
  o.poly([[430,420],[500,230],[570,420]]);
  o.open(c=>{c.moveTo(500,230);c.lineTo(500,150)});o.poly([[500,150],[580,180],[500,210]]);
  o.path(c=>{c.moveTo(430,840);c.lineTo(430,690);c.arc(500,690,70,Math.PI,0);c.lineTo(570,840)});
  [[265,540],[775,540],[390,560],[610,560]].forEach(([x,y])=>o.circ(x,y,30));
  for(let i=0;i<5;i++)o.rr(300+i*80,380,40,50,4);
  o.star(150,420,36);o.heart(860,860,30);
  ground(o,880);
};

/* ================================================================ OCEAN */
const fish=(o,r)=>{
  for(let i=0;i<3;i++)o.path(c=>{const x=130+i*80;c.moveTo(x,960);c.bezierCurveTo(x-40,880,x+40,820,x,740);c.bezierCurveTo(x+50,820,x+60,900,x+30,960)});
  o.path(c=>{c.moveTo(730,520);c.lineTo(900,380);c.lineTo(880,520);c.lineTo(900,660);c.closePath()});
  o.path(c=>{c.moveTo(420,340);c.quadraticCurveTo(500,200,620,330)});
  o.ell(480,520,270,170);
  o.path(c=>{c.moveTo(470,620);c.quadraticCurveTo(440,740,560,730);c.quadraticCurveTo(540,670,560,610)});
  o.eye(330,480,32);o.smile(300,560,32);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)o.open(c=>{c.arc(470+i*60,470+j*55+(i%2)*25,26,Math.PI*1.1,Math.PI*1.9)});
  bubbles(o,r,5,[120,150,200,300]);
  o.star(820,820,40);
};
const octopus=(o,r)=>{
  const n=6;
  for(let i=0;i<n;i++){const a=-1.0+i*(2.0/(n-1)),x=500+a*190;o.ell(x+Math.sin(a)*60,720,45,175,a*.55)}
  o.ell(500,380,225,200);
  o.eye(420,380,40);o.eye(580,380,40);o.smile(500,470,52);
  for(let i=0;i<4;i++)o.circ(360+i*95,260+(i%2)*28,18+r()*8);
  for(let i=0;i<n;i++){const a=-1.0+i*(2.0/(n-1));o.circ(500+a*190+Math.sin(a)*90,700+r()*60,13);o.circ(500+a*190+Math.sin(a)*100,790+r()*30,11)}
  bubbles(o,r,6,[110,120,220,300]);bubbles(o,r,3,[730,500,160,300]);
};
const turtle=(o,r)=>{
  o.ell(250,610,70,48,.35);
  o.path(c=>{c.moveTo(780,640);c.lineTo(870,680);c.lineTo(790,700)});
  o.ell(360,780,60,50,0);o.ell(640,780,60,50,0);o.ell(330,520,55,40,0);o.ell(700,520,55,40,0);
  o.path(c=>{c.moveTo(240,660);c.bezierCurveTo(230,330,770,330,780,660);c.closePath()});
  const hex=(x,y,s)=>o.poly(Array.from({length:6},(_,i)=>[x+Math.cos(i*Math.PI/3+Math.PI/6)*s,y+Math.sin(i*Math.PI/3+Math.PI/6)*s]));
  hex(510,520,72);hex(380,570,56);hex(640,570,56);hex(450,420,46);hex(580,420,46);
  o.ell(190,560,92,78,0);o.eye(165,540,15);o.smile(190,610,28);
  bubbles(o,r,4,[100,150,200,250]);
  o.open(c=>{c.moveTo(60,900);for(let x=60;x<940;x+=90)c.quadraticCurveTo(x+45,860,x+90,900)});
  o.star(850,230,34);
};

/* ================================================================ SPACE */
const rocket=(o,r)=>{
  o.star(150,200,34);o.star(850,300,28);o.star(180,640,24);o.star(830,780,34);
  o.path(c=>{c.moveTo(400,640);c.lineTo(300,830);c.lineTo(500,740);c.lineTo(700,830);c.lineTo(600,640)});
  o.path(c=>{c.moveTo(500,120);c.bezierCurveTo(360,260,350,520,400,700);c.lineTo(600,700);c.bezierCurveTo(650,520,640,260,500,120)});
  o.path(c=>{c.moveTo(500,120);c.bezierCurveTo(430,190,400,250,395,300);c.lineTo(605,300);c.bezierCurveTo(600,250,570,190,500,120)});
  o.circ(500,440,72);o.circ(500,440,38);
  o.circ(500,610,26);
  o.path(c=>{c.moveTo(430,710);c.quadraticCurveTo(420,820,500,930);c.quadraticCurveTo(580,820,570,710)});
  o.path(c=>{c.moveTo(465,710);c.quadraticCurveTo(460,780,500,840);c.quadraticCurveTo(540,780,535,710)});
};
const planet=(o,r)=>{
  [[160,170],[840,200],[230,860],[820,830],[150,560]].forEach((p,i)=>o.star(p[0],p[1],24+r()*20));
  o.open(c=>{c.ellipse(500,520,330,90,-.35,Math.PI*1.0,Math.PI*2)});
  o.circ(500,500,210);
  for(let i=0;i<3;i++)o.open(c=>{c.arc(500,500,210,.4+i*.35,2.4-i*.35-.2)});
  o.ell(500,520,330,90,-.35);
  o.path(c=>{c.ellipse(500,520,330,90,-.35,0,Math.PI);c.ellipse(500,520,250,60,-.35,Math.PI,0,true)});
  o.circ(420,420,28);o.circ(560,440,18);o.circ(470,350,14);
  o.circ(850,640,60);o.circ(865,630,18);
};
const alien=(o,r)=>{
  o.open(c=>{c.moveTo(420,200);c.quadraticCurveTo(380,120,330,110)});o.circ(325,110,24);
  o.open(c=>{c.moveTo(580,200);c.quadraticCurveTo(620,120,670,110)});o.circ(675,110,24);
  o.ell(500,740,140,170);o.ell(350,730,28,100,.5);o.ell(650,730,28,100,-.5);
  o.ell(430,910,50,28);o.ell(570,910,50,28);
  o.ell(500,400,210,230);
  o.ell(405,380,70,100,.35);o.ell(595,380,70,100,-.35);
  o.dot(412,385,40);o.dot(588,385,40);
  o.ell(500,520,70,28,0);o.smile(500,560,45);
  o.circ(500,610,22);o.circ(500,680,22);
  o.star(160,300,34);o.star(850,400,30);o.circ(850,820,60);
};

/* ================================================================ VEHICLES */
const car=(o,r)=>{
  o.cloud(220,200,70);o.cloud(780,170,56);
  o.path(c=>{c.moveTo(300,520);c.lineTo(380,360);c.lineTo(650,360);c.lineTo(730,520)});
  o.rr(130,500,740,190,60);
  o.path(c=>{c.moveTo(335,500);c.lineTo(395,385);c.lineTo(490,385);c.lineTo(490,500)});
  o.path(c=>{c.moveTo(520,500);c.lineTo(520,385);c.lineTo(640,385);c.lineTo(700,500)});
  o.circ(790,570,30);o.rr(160,555,70,30,12);
  [290,700].forEach(x=>{o.circ(x,700,92);o.circ(x,700,42);o.dot(x,700,12)});
  o.star(500,610,30);
  ground(o,812);
};
const train=(o,r)=>{
  o.circ(215,330,36);o.circ(270,250,48);o.circ(350,160,56);
  o.rr(170,420,70,130,10);o.path(c=>{c.moveTo(150,420);c.lineTo(260,420);c.lineTo(290,380);c.lineTo(120,380);c.closePath()});
  o.rr(90,520,350,170,34);o.rr(360,420,140,270,20);o.rr(380,450,100,90,16);
  o.rr(520,550,300,140,26);o.rr(560,575,90,70,12);o.rr(690,575,90,70,12);
  o.open(c=>{c.moveTo(500,630);c.lineTo(520,630)});
  [[190,720,60],[340,730,48],[430,730,40],[600,730,48],[750,730,48]].forEach(([x,y,rad])=>{o.circ(x,y,rad);o.dot(x,y,10)});
  o.circ(110,600,20);
  ground(o,810);o.open(c=>{for(let x=80;x<940;x+=60){c.moveTo(x,810);c.lineTo(x-10,850)}});
  decor(o,r);
};

/* ================================================================ GARDEN */
const flower=(o,r)=>{
  const n=5+Math.floor(r()*4);
  o.path(c=>{c.moveTo(480,560);c.lineTo(480,900);c.lineTo(520,900);c.lineTo(520,560)});
  o.ell(400,740,100,40,-.6);o.ell(610,690,100,40,.6);
  for(let i=0;i<n;i++){const a=i*T/n;o.ell(500+Math.cos(a)*130,400+Math.sin(a)*130,84,52,a)}
  o.circ(500,400,72);o.circ(500,400,26);
  o.cloud(180,170,50);o.circ(850,160,60);for(let i=0;i<8;i++)o.open(c=>{const a=i*T/8;c.moveTo(850+Math.cos(a)*76,160+Math.sin(a)*76);c.lineTo(850+Math.cos(a)*105,160+Math.sin(a)*105)});
  ground(o,900);
  o.ell(220,850,40,24,0);o.ell(790,860,50,28,0);
};
const butterfly=(o,r)=>{
  o.ell(330,370,190,150,-.4);o.ell(670,370,190,150,.4);
  o.ell(360,640,130,110,.5);o.ell(640,640,130,110,-.5);
  o.circ(310,340,56);o.circ(690,340,56);o.circ(330,650,40);o.circ(670,650,40);
  o.circ(300,340,22);o.circ(700,340,22);
  o.ell(500,520,30,190,0);o.circ(500,320,38);
  o.eye(488,315,9);o.eye(512,315,9);
  o.open(c=>{c.moveTo(488,290);c.quadraticCurveTo(450,200,400,190);c.moveTo(512,290);c.quadraticCurveTo(550,200,600,190)});
  o.circ(397,188,14);o.circ(603,188,14);
  o.heart(160,820,34);o.star(850,820,34);o.heart(850,160,28);o.star(150,180,30);
};
const ladybug=(o,r)=>{
  o.ell(500,830,320,70,0);
  o.open(c=>{c.moveTo(420,300);c.quadraticCurveTo(360,200,300,180);c.moveTo(580,300);c.quadraticCurveTo(640,200,700,180)});
  o.circ(295,178,16);o.circ(705,178,16);
  [-1,1].forEach(s=>[480,580,680].forEach((y,i)=>o.open(c=>{c.moveTo(500+s*190,y);c.lineTo(500+s*(260+i*10),y+(i-1)*50)})));
  o.ell(500,300,110,80,0);o.eye(465,290,16);o.eye(535,290,16);o.smile(500,330,28);
  o.circ(500,560,250);
  o.open(c=>{c.moveTo(500,310);c.lineTo(500,810)});
  [[400,480],[620,470],[380,620],[630,640],[440,720],[570,730]].forEach(([x,y])=>o.circ(x,y,36));
  o.star(150,200,30);o.heart(860,230,30);
};

const CATS=[
  {id:'dino',name:'Dinosaurs',emoji:'🦖',items:[{name:'Stegosaurus',draw:stego},{name:'T-Rex',draw:trex},{name:'Dino egg',draw:dinoEgg}]},
  {id:'animals',name:'Animals',emoji:'🐱',items:[{name:'Kitty',draw:cat},{name:'Puppy',draw:dog},{name:'Elephant',draw:elephant},{name:'Bunny',draw:bunny}]},
  {id:'mermaid',name:'Mermaids',emoji:'🧜‍♀️',items:[{name:'Mermaid',draw:mermaid},{name:'Seashells',draw:shells}]},
  {id:'magic',name:'Unicorns',emoji:'🦄',items:[{name:'Unicorn',draw:unicorn},{name:'Castle',draw:castle}]},
  {id:'ocean',name:'Ocean',emoji:'🐠',items:[{name:'Fish',draw:fish},{name:'Octopus',draw:octopus},{name:'Turtle',draw:turtle}]},
  {id:'space',name:'Space',emoji:'🚀',items:[{name:'Rocket',draw:rocket},{name:'Planet',draw:planet},{name:'Alien',draw:alien}]},
  {id:'vehicles',name:'Vehicles',emoji:'🚗',items:[{name:'Car',draw:car},{name:'Train',draw:train}]},
  {id:'garden',name:'Garden',emoji:'🌸',items:[{name:'Flower',draw:flower},{name:'Butterfly',draw:butterfly},{name:'Ladybug',draw:ladybug}]}
];

/* draw one picture into a canvas (any size). seed makes the variation repeatable */
function render(canvas,item,seed,lw){
  const c=canvas.getContext('2d');
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);
  c.save();c.scale(canvas.width/1000,canvas.height/1000);
  item.draw(Pen(c,lw||8),rng(seed));
  c.restore();
}
g.ArtLib={cats:CATS,render,rng};
})(window);
