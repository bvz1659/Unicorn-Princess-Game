/* Learn & Play hub: game tiles (shapes first, numbers next) and the sticker book. */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const ML=g.ML,Stage=g.Stage;
const Hub={};
const SECTIONS=[
  {cat:'shapes',icon:'🔷',title:'Shapes'},
  {cat:'numbers',icon:'🔢',title:'Numbers'},
  {cat:'colour',icon:'🎨',title:'Colouring'},
  {cat:'more',icon:'🩺',title:'More fun'}
];
Hub.extras=[
  {icon:'🖌️',name:'Free Draw',color:['#ffb36b','#ff6f91'],go:()=>Art.open('draw')},
  {icon:'🖍️',name:'Colouring Pages',color:['#a0e7a0','#3fc48a'],go:()=>Art.open('page')},
  {icon:'📷',name:'My Photo',color:['#8fd3ff','#6a8dff'],go:()=>Art.open('photo')}
];
function el(tag,cls,txt,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(parent)parent.appendChild(e);return e}
function tap(b,fn){b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ML.unlock();fn(e)})}

Hub.open=function(){
  const S=ML.S;
  if(S.scene&&S.scene!=='games')return;
  S.scene='games';S.build=false;
  $('hub').hidden=false;
  render();
  ML.say('What shall we play?');
};
Hub.close=function(){
  $('hub').hidden=true;
  if(ML.S.scene==='games')ML.S.scene='';
  if(g.Voice)g.Voice.stop();
};

function render(){
  const S=ML.S,body=$('hubBody');body.innerHTML='';
  $('hubStars').textContent='⭐ '+S.stars;
  const all=Stage.stickerList(),have=(S.stickers||[]).length;
  const book=el('button','tile book',null,body);
  el('span','ticon','📒',book);el('span','tname','My stickers',book);el('span','tlv',have+' / '+all.length,book);
  tap(book,()=>{ML.sfx.pop();renderBook()});
  for(const sec of SECTIONS){
    const ids=Stage.order.filter(id=>Stage.reg[id].cat===sec.cat);
    if(!ids.length&&sec.cat!=='colour')continue;
    el('div','hsec',sec.icon+'  '+sec.title,body);
    const grid=el('div','hgrid',null,body);
    if(sec.cat==='colour'){
      for(const x of Hub.extras){const b=el('button','tile',null,grid);b.style.background='linear-gradient(145deg,'+x.color[0]+','+x.color[1]+')';el('span','ticon',x.icon,b);el('span','tname',x.name,b);tap(b,()=>{ML.sfx.pop();x.go()})}
      continue;
    }
    for(const id of ids){
      const d=Stage.reg[id],lv=Stage.lvOf(id);
      const b=el('button','tile',null,grid);
      b.style.background='linear-gradient(145deg,'+d.color[0]+','+d.color[1]+')';
      el('span','ticon',d.icon,b);el('span','tname',d.name,b);
      el('span','tlv','●'.repeat(lv+1)+'○'.repeat(Math.max(0,d.levels-lv-1)),b);
      tap(b,()=>{ML.sfx.pop();Stage.open(id)});
    }
  }
}

function renderBook(){
  const S=ML.S,body=$('hubBody');body.innerHTML='';
  const all=Stage.stickerList(),mine=new Set(S.stickers||[]);
  const back=el('button','tile book',null,body);el('span','ticon','⬅️',back);el('span','tname','Back',back);
  tap(back,()=>{ML.sfx.pop();render()});
  el('div','hsec','📒  '+mine.size+' / '+all.length,body);
  const grid=el('div','sgrid',null,body);
  for(const s of all){const c=el('div','stk'+(mine.has(s.id)?' got':''),mine.has(s.id)?s.emoji:'❔',grid)}
  ML.say('Look at all your stickers!');
}

$('hubX').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ML.sfx.pop();Hub.close()});
$('learnBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ML.unlock();ML.sfx.pop();Hub.open()});

g.Hub=Hub;
})(window);
