import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

test('preview serves only the lightweight Sitian player, simulated host and bounded local video ranges',async()=>{
  const child=spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('..',import.meta.url)),windowsHide:true,stdio:['ignore','pipe','pipe']});
  let err='';child.stderr.on('data',data=>err+=data);const exited=once(child,'exit');
  try{
    const url=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error('preview startup timeout: '+err)),10000);child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});child.once('exit',code=>{clearTimeout(timeout);reject(new Error('preview exited '+code+': '+err));});});
    assert.equal((await fetch(url+'/host-reveal.mjs')).status,200);
    assert.equal((await fetch(url+'/test-host.html')).status,200);
    assert.equal((await fetch(url+'/scene.mjs')).status,404);
    assert.equal((await fetch(url+'/assets/startup-audio.m4a')).status,404);
    assert.equal((await fetch(url+'/save-export',{method:'POST'})).status,405);
    const range=await fetch(url+'/startup.mp4',{headers:{range:'bytes=0-31'}});
    assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,32);
    assert.equal((await fetch(url+'/wallpaper.mp4',{headers:{range:'bytes=999999999-'}})).status,416);
    const payload=await fetch(url+'/test-payload.mjs');assert.equal(payload.status,200);
    const code=await payload.text();assert.doesNotThrow(()=>new Function(code));
  }finally{child.kill();await exited;}
});
