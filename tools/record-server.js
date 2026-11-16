#!/usr/bin/env node
/* Local recording helper. Run:  node tools/record-server.js
   Then open http://localhost:8766/tools/recorder.html in Chrome or Safari on this Mac.
   Recordings are converted to small .m4a files in audio/ and the game picks them up automatically.
   Only listens on this computer (127.0.0.1). Needs macOS (uses the built-in afconvert). */
const http=require('http'),fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const root=path.join(__dirname,'..'),audio=path.join(root,'audio'),PORT=8766;
fs.mkdirSync(audio,{recursive:true});
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.m4a':'audio/mp4','.wav':'audio/wav'};

function rebuild(){try{cp.execFileSync('node',[path.join(__dirname,'build.js')],{cwd:root,stdio:'ignore'})}catch(e){}}
function listClips(){return fs.readdirSync(audio).filter(f=>f.endsWith('.m4a')).map(f=>f.replace(/\.m4a$/,''))}

http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&u.pathname==='/api/clips'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(listClips()))}
  if(req.method==='POST'&&u.pathname==='/api/save'){
    const id=u.searchParams.get('id')||'';
    if(!/^[A-Za-z0-9_]+$/.test(id)){res.statusCode=400;return res.end('bad id')}
    const chunks=[];req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      const wav=path.join(os.tmpdir(),'ml_'+id+'.wav'),out=path.join(audio,id+'.m4a');
      fs.writeFileSync(wav,Buffer.concat(chunks));
      try{
        cp.execFileSync('afconvert',['-f','m4af','-d','aac','-b','56000','-c','1',wav,out]);
        fs.unlinkSync(wav);rebuild();
        res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,count:listClips().length}));
      }catch(e){res.statusCode=500;res.end('convert failed: '+e.message)}
    });
    return;
  }
  if(req.method==='POST'&&u.pathname==='/api/delete'){
    const id=u.searchParams.get('id')||'';
    if(/^[A-Za-z0-9_]+$/.test(id)){try{fs.unlinkSync(path.join(audio,id+'.m4a'));rebuild()}catch(e){}}
    return res.end('ok');
  }
  if(req.method==='GET'){
    let p=path.normalize(decodeURIComponent(u.pathname));if(p==='/'||p==='\\')p='/index.html';
    const f=path.join(root,p);
    if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end('not found')}
    res.setHeader('content-type',MIME[path.extname(f)]||'application/octet-stream');res.setHeader('cache-control','no-store');
    return fs.createReadStream(f).pipe(res);
  }
  res.statusCode=405;res.end();
}).listen(PORT,'127.0.0.1',()=>{
  console.log('\nRecorder ready:  http://localhost:'+PORT+'/tools/recorder.html');
  console.log('Press Ctrl+C when you are finished.\n');
});
