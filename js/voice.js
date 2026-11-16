/* Plays your recorded lines (audio/<id>.m4a). Lines without a recording fall back to the phone's own voice.
   Works fully offline: the clips are cached by the service worker. */
(function(g){
  const V={have:new Set(),buf:{},loading:{},src:[],token:0,gain:null};

  function out(){const a=g.ML&&g.ML.audio&&g.ML.audio();return a||null}

  V.init=async function(){
    try{const r=await fetch('audio/manifest.json',{cache:'no-cache'});V.have=new Set(await r.json())}catch(e){V.have=new Set()}
  };

  function decode(ac,ab){return new Promise((ok,no)=>{const p=ac.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)})}
  async function load(id){
    if(V.buf[id])return V.buf[id];
    if(V.loading[id])return V.loading[id];
    const a=out();if(!a)return null;
    return V.loading[id]=(async()=>{
      try{const r=await fetch('audio/'+id+'.m4a');const b=await decode(a.ac,await r.arrayBuffer());V.buf[id]=b;return b}
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
    V.src=[];
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
    if(!V.gain||V.gain.context!==a.ac){V.gain=a.ac.createGain();V.gain.gain.value=1.6;V.gain.connect(a.out||a.ac.destination)}
    let t=a.ac.currentTime+.03;
    bufs.forEach((b,i)=>{
      const s=a.ac.createBufferSource();s.buffer=b;s.connect(V.gain);s.start(t);V.src.push(s);
      t+=b.duration+(i<ids.length-1?.04:0);
      if(i===bufs.length-1&&done)s.onended=()=>{if(my===V.token)done()};
    });
    return true;
  };

  /* say a sentence: returns true if it was spoken from recordings */
  V.say=function(text){
    const ids=resolve(text);
    if(!ids)return false;
    V.sayIds(ids);
    return true;
  };

  g.Voice=V;
})(window);
