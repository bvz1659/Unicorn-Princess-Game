/* Plays your recorded lines (audio/<id>.m4a). Lines without a recording fall back to the phone's own voice.
   Works fully offline: the clips are cached by the service worker. */
(function(g){
  const V={have:new Set(),buf:{},loading:{},src:[],token:0,gain:null,busyUntil:0,nrm:{},bus:null,lastReact:'',lastReactAt:0};

  function out(){const a=g.ML&&g.ML.audio&&g.ML.audio();return a||null}

  /* ---- production polish ----
     Every voice line goes through: rumble filter -> warmth + presence + air EQ -> gentle compressor (evens out loud/soft clips)
     -> small "room" reverb -> limiter. Each clip is also levelled to the same loudness when it loads. */
  function impulse(ac){
    const sr=ac.sampleRate,len=Math.floor(sr*1.0),buf=ac.createBuffer(2,len,sr),pre=Math.floor(sr*.012);
    for(let c=0;c<2;c++){const d=buf.getChannelData(c);let lp=0;for(let i=pre;i<len;i++){const t=(i-pre)/(len-pre);lp+=((Math.random()*2-1)-lp)*.45;d[i]=lp*Math.pow(1-t,3.4)}}
    return buf;
  }
  function bus(a){
    if(V.gain&&V.bus&&V.bus.ctx===a.ac)return V.gain;
    const ac=a.ac,dest=a.out||ac.destination,f=(type,hz,gain,q)=>{const n=ac.createBiquadFilter();n.type=type;n.frequency.value=hz;if(gain!=null)n.gain.value=gain;if(q)n.Q.value=q;return n};
    try{
      const inp=ac.createGain(),hp=f('highpass',90),warm=f('lowshelf',220,3),mud=f('peaking',450,-1.5,1),pres=f('peaking',3200,1.5,.8),air=f('highshelf',7000,2);
      const comp=ac.createDynamicsCompressor();comp.threshold.value=-24;comp.knee.value=20;comp.ratio.value=3.5;comp.attack.value=.004;comp.release.value=.18;
      const make=ac.createGain();make.gain.value=1.25;
      const lim=ac.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.06;
      const conv=ac.createConvolver();conv.buffer=impulse(ac);const wet=ac.createGain();wet.gain.value=.13;
      inp.connect(hp);hp.connect(warm);warm.connect(mud);mud.connect(pres);pres.connect(air);air.connect(comp);comp.connect(make);
      make.connect(lim);make.connect(conv);conv.connect(wet);wet.connect(lim);lim.connect(dest);
      V.gain=inp;V.bus={ctx:ac};
    }catch(e){const gn=ac.createGain();gn.gain.value=1.6;gn.connect(dest);V.gain=gn;V.bus={ctx:ac}}   // if anything is unsupported, play it plain
    return V.gain;
  }
  /* level every clip to the same loudness (ignores the silent bits) so numbers and words sit evenly together */
  function levelOf(b){
    const d=b.getChannelData(0),W=Math.max(1,Math.floor(b.sampleRate*.01)),n=Math.floor(d.length/W),e=[];let mx=0;
    for(let k=0;k<n;k++){let t=0;for(let i=k*W;i<(k+1)*W;i++)t+=d[i]*d[i];e.push(t/W);mx=Math.max(mx,e[k])}
    let sum=0,c=0;for(const x of e)if(x>mx*.1){sum+=x;c++}
    const rms=Math.sqrt(c?sum/c:mx)||.1;
    return Math.min(1.9,Math.max(.6,.17/rms));
  }

  V.init=async function(){
    try{const r=await fetch('audio/manifest.json',{cache:'no-cache'});V.have=new Set(await r.json())}catch(e){V.have=new Set()}
  };

  function decode(ac,ab){return new Promise((ok,no)=>{const p=ac.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)})}
  async function load(id){
    if(V.buf[id])return V.buf[id];
    if(V.loading[id])return V.loading[id];
    const a=out();if(!a)return null;
    return V.loading[id]=(async()=>{
      try{const r=await fetch('audio/'+id+'.m4a');const b=await decode(a.ac,await r.arrayBuffer());V.buf[id]=b;V.nrm[id]=levelOf(b);return b}
      catch(e){V.have.delete(id);return null}
    })();
  }
  V.preload=async function(){
    if(!out())return;
    const ids=[...V.have];let i=0;
    const worker=async()=>{while(i<ids.length)await load(ids[i++])};
    await Promise.all([worker(),worker(),worker()]);
  };

  /* numbers -> clip ids ("three hundred and forty five") */
  function numIds(n){
    n=Math.floor(n);if(n<0)return null;
    if(n<=20)return['n'+n];
    if(n<100){const o=n%10,t=n-o;return o?['n'+t,'n'+o]:['n'+t]}
    if(n<1000){const h=Math.floor(n/100),r=n%100,a=['n'+h,'hundred'];if(r)a.push('and',...numIds(r));return a}
    return null;
  }
  V.numIds=numIds;

  /* turn a sentence into clip ids, or null if we do not have every clip */
  function resolve(text){
    let ids=null,m;
    const t=String(text).trim();
    if((m=/^you have (\d+) stars!?$/i.exec(t))){const n=numIds(+m[1]);if(n)ids=['you_have',...n,'stars']}
    else if((m=/^you caught (\d+) stars!? great job!?$/i.exec(t))){const n=numIds(+m[1]);if(n)ids=['you_caught',...n,'stars','great_job']}
    else if((m=/^(\d+) stars!?$/i.exec(t))){const n=numIds(+m[1]);if(n)ids=[...n,'stars']}
    else if((m=/^([A-Za-z]+) is so happy!?$/.exec(t))&&g.PHRASE_BY_TEXT[g.phraseNorm(m[1])])ids=[g.PHRASE_BY_TEXT[g.phraseNorm(m[1])],'is_so_happy'];
    else{const id=g.PHRASE_BY_TEXT[g.phraseNorm(t)];if(id)ids=[id]}
    if(ids&&ids.every(i=>V.have.has(i)))return ids;
    return null;
  }
  V.resolve=resolve;
  V.has=id=>V.have.has(id);

  V.stop=function(){
    V.token++;
    for(const s of V.src){try{s.stop()}catch(e){}}
    V.src=[];V.busyUntil=0;
  };

  /* play a list of clip ids back to back; resolves when finished */
  V.sayIds=async function(ids,done){
    const a=out();if(!a)return false;
    if(!ids.every(i=>V.have.has(i)))return false;
    V.stop();const my=V.token;
    try{if(g.speechSynthesis)g.speechSynthesis.cancel()}catch(e){}
    const bufs=await Promise.all(ids.map(load));
    if(my!==V.token)return true;
    if(bufs.some(b=>!b))return false;
    const dst=bus(a);
    let t=a.ac.currentTime+.03;
    bufs.forEach((b,i)=>{
      const s=a.ac.createBufferSource();s.buffer=b;
      const fg=a.ac.createGain(),f=Math.min(.012,b.duration/4),N=V.nrm[ids[i]]||1;
      fg.gain.setValueAtTime(0,t);fg.gain.linearRampToValueAtTime(N,t+f);fg.gain.setValueAtTime(N,t+b.duration-f);fg.gain.linearRampToValueAtTime(0,t+b.duration);
      s.connect(fg);fg.connect(dst);s.start(t);V.src.push(s);
      t+=b.duration+(i<ids.length-1?.04:0);
      if(i===bufs.length-1&&done)s.onended=()=>{if(my===V.token)done()};
    });
    V.busyUntil=t;
    return true;
  };

  /* little reactions: giggles, cheers, gasps. Played after any spoken line finishes, never on top of it.
     returns true if one was lined up. o={chance,delay(ms),rate} (rate>1 makes a higher "pet" voice) */
  const GROUPS={happy:['giggle1','giggle2','giggle3','yay1','yay2'],cheer:['cheer','yay1','yay2'],oops:['uhoh'],yum:['mmm'],cuddle:['aww','giggle1'],wow:['gasp','sparkle'],laugh:['giggle1','giggle2','giggle3']};
  function playLater(id,o){
    setTimeout(async()=>{
      const a=out();if(!a)return;const b=await load(id);if(!b)return;
      const start=Math.max(a.ac.currentTime+.02,V.busyUntil+.1)+(o.after||0);if(start-a.ac.currentTime>3.5)return;
      const dst=bus(a),rate=(o.rate||1)*(0.97+Math.random()*.06),dur=b.duration/rate,f=Math.min(.012,dur/4),N=(V.nrm[id]||1)*(o.vol||1);
      const s=a.ac.createBufferSource(),fg=a.ac.createGain();s.buffer=b;s.playbackRate.value=rate;
      fg.gain.setValueAtTime(0,start);fg.gain.linearRampToValueAtTime(N,start+f);fg.gain.setValueAtTime(N,start+dur-f);fg.gain.linearRampToValueAtTime(0,start+dur);
      s.connect(fg);fg.connect(dst);s.start(start);
    },o.delay==null?350:o.delay);
  }
  V.react=function(group,o){
    o=o||{};const S=g.ML&&g.ML.S;
    if(!S||!S.sound||(o.chance!=null&&Math.random()>o.chance))return false;
    const list=(GROUPS[group]||[]).filter(i=>V.have.has(i));if(!list.length)return false;
    const nowMs=Date.now();if(nowMs-V.lastReactAt<2200)return false;   // never a pile-up of giggles
    const pool=list.length>1?list.filter(i=>i!==V.lastReact):list,id=pool[Math.floor(Math.random()*pool.length)];
    V.lastReact=id;V.lastReactAt=nowMs;playLater(id,o);return true;
  };

  /* silly pet voices: each friend has its own pitch (from its name) and "talks" by babbling pitched-up giggles, cheers and aws.
     kind 'name' = the friend says its own name in its funny voice. */
  const BABBLE=['giggle1','giggle2','giggle3','yay1','yay2','aww','gasp','cheer'];
  const PITCH=[.72,.8,1.3,1.45,1.6,1.8];
  function petRate(a){const k=String((a&&(a.name||a.e))||'x');let h=0;for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;return PITCH[h%PITCH.length]}
  V.petVoice=function(a,kind){
    const S=g.ML&&g.ML.S;if(!S||!S.sound)return false;
    const nowMs=Date.now();if(nowMs-(V.lastPetAt||0)<700)return false;
    const r=petRate(a);let ids;
    if(kind==='name'){const id='name_'+String((a&&a.name)||'').toLowerCase();ids=V.have.has(id)?[id]:null}
    if(!ids){const pool=BABBLE.filter(i=>V.have.has(i));if(!pool.length)return false;
      const x=pool[Math.floor(Math.random()*pool.length)],y=pool[Math.floor(Math.random()*pool.length)];ids=Math.random()<.5?[x]:[x,y]}
    V.lastPetAt=nowMs;
    ids.forEach((id,i)=>playLater(id,{rate:r*(i?1.12:1),after:i*.18,delay:kind==='name'?900:0,vol:.9}));
    return true;
  };
  /* how long (seconds) a list of clips takes to speak; 0 if they are not loaded yet */
  V.dur=function(ids){let t=0;for(const i of ids){const b=V.buf[i];if(!b)return 0;t+=b.duration+.04}return t};
  V.speaking=function(){const a=out();return !!a&&a.ac.currentTime<V.busyUntil};

  /* say a sentence: returns true if it was spoken from recordings */
  V.say=function(text){
    const ids=resolve(text);
    if(!ids)return false;
    V.sayIds(ids);
    return true;
  };

  g.Voice=V;
})(window);
