#!/usr/bin/env node
/* Builds the offline file list. Run after changing any file:  node tools/build.js
   Writes precache.json (every file the game needs) and stamps sw.js with a version so phones pick up updates. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const SKIP=new Set(['.git','node_modules','tools','.DS_Store','README.md','.gitignore','precache.json','.github']);
const files=[];
(function walk(d){
  for(const f of fs.readdirSync(d)){
    if(SKIP.has(f)||f.startsWith('.'))continue;
    const p=path.join(d,f),st=fs.statSync(p);
    if(st.isDirectory())walk(p);
    else if(!/\.wav$/.test(f))files.push(path.relative(root,p).split(path.sep).join('/'));
  }
})(root);
// audio manifest = every recorded clip
const audioDir=path.join(root,'audio');
if(fs.existsSync(audioDir)){
  const ids=fs.readdirSync(audioDir).filter(f=>f.endsWith('.m4a')).map(f=>f.replace(/\.m4a$/,'')).sort();
  fs.writeFileSync(path.join(audioDir,'manifest.json'),JSON.stringify(ids));
  if(!files.includes('audio/manifest.json'))files.push('audio/manifest.json');
}
files.sort();
const hash=crypto.createHash('sha1');
for(const f of files)if(f!=='sw.js')hash.update(f).update(fs.readFileSync(path.join(root,f)));
const ver=hash.digest('hex').slice(0,10);
fs.writeFileSync(path.join(root,'precache.json'),JSON.stringify({version:ver,files:['./',...files]}));
let sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
sw=sw.replace(/const VERSION = '[^']*';/,"const VERSION = '"+ver+"';");
fs.writeFileSync(path.join(root,'sw.js'),sw);
console.log('Built '+files.length+' files, version '+ver+', '+(fs.existsSync(audioDir)?fs.readdirSync(audioDir).filter(f=>f.endsWith('.m4a')).length:0)+' voice clips');
