import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('./timeline.mjs').catch(()=>({}));
test('title anchor survives cover cropping in standard narrow desktop windows',()=>{
  assert.equal(typeof module.titleAnchor,'function');
  for(const [width,height] of [[1920,1080],[1440,1000],[1024,768],[1000,800]]){
    const scale=Math.max(width/1920,height/1080),crop=(1920*scale-width)/2;
    assert.ok(module.titleAnchor(1920,1080).x*scale-crop>=width*.025,`${width}x${height}`);
  }
});
test('startup and handoff share the same 10.5 second boundary and final title',()=>{
  assert.equal(typeof module.sceneState,'function');
  const a=module.sceneState('startup',10.5), b=module.sceneState('handoff',0);
  assert.equal(a.time,b.time);assert.equal(a.title,b.title);assert.equal(a.titleOpacity,b.titleOpacity);
  assert.equal(a.title,'司天临位');
});
test('handoff finishes exactly on the unbranded looping frame',()=>{
  assert.equal(typeof module.sceneState,'function');
  const a=module.sceneState('handoff',1.5), b=module.sceneState('wallpaper',0);
  assert.equal(a.time,b.time);assert.equal(a.titleOpacity,0);assert.equal(b.titleOpacity,0);
  assert.equal(a.reveal,1);assert.equal(b.reveal,1);
});
test('all displacement channels are periodic with continuous seam velocity',()=>{
  assert.equal(typeof module.motionAt,'function');
  for(const key of ['clothX','clothY','hairX','hairY','breath']) {
    assert.ok(Math.abs(module.motionAt(0)[key]-module.motionAt(16)[key])<1e-9);
    const delta=.001;
    const before=(module.motionAt(16)[key]-module.motionAt(16-delta)[key])/delta;
    const after=(module.motionAt(delta)[key]-module.motionAt(0)[key])/delta;
    assert.ok(Math.abs(before-after)<.001,key);
  }
});
test('eight planned narrative phases and a quiet ending have bounded opacity',()=>{
  assert.equal(typeof module.sceneState,'function');
  const expected=['星海初醒','星轨归位','灵台启明','玉衡校准','诸契归位','诸契就绪','司天临位'];
  [0.6,1.8,3,4.2,5.4,6.3,6.9].forEach((t,i)=>assert.equal(module.sceneState('startup',t).title,expected[i]));
  for(let t=0;t<=10;t+=.025){const s=module.sceneState('startup',t);assert.ok(s.titleOpacity>=0&&s.titleOpacity<=1);assert.ok(s.reveal>=0&&s.reveal<=1);}
});
