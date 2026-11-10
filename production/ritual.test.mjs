import test from 'node:test';
import assert from 'node:assert/strict';
import * as timeline from './timeline.mjs';
test('ritual keeps completed steps while highlighting the current one',()=>{
 const a=timeline.sceneState('startup',3.2);
 assert.equal(a.ritual?.length,3);
 assert.deepEqual(a.ritual.map(x=>x.title),['星海初醒','星轨归位','灵台启明']);
 assert.deepEqual(a.ritual.map(x=>x.completed),[true,true,false]);
 assert.equal(a.ritual[0].opacity,1);
 assert.ok(timeline.sceneState('startup',5.7).ritual.some(x=>x.title==='星海初醒'));
});
test('all seven ritual steps remain complete before the welcome appears',()=>{
 const a=timeline.sceneState('startup',7.8);
 assert.equal(a.ritual?.length,7);assert.ok(a.ritual.every(x=>x.completed));
 assert.equal(a.ritualOpacity,1);assert.ok(a.welcome.every(x=>x.opacity===0));
});
test('welcome appears after the ritual and accumulates its three lines',()=>{
 const a=timeline.sceneState('startup',9.35),b=timeline.sceneState('startup',10.4);
 assert.equal(a.ritualOpacity,0);assert.equal(a.welcome[0].text,'司天阁');
 assert.equal(a.welcome[0].opacity,1);assert.ok(a.welcome[1].opacity>0);assert.equal(a.welcome[2].opacity,0);
 assert.deepEqual(b.welcome.map(x=>x.text),['司天阁','星轨已定，万象待启。','欢迎回来。']);
 assert.ok(b.welcome.every(x=>x.opacity===1));
});
test('12 second intro has a continuous welcome handoff then clean loop',()=>{
 assert.deepEqual(timeline.DURATION,{startup:10.5,handoff:1.5,wallpaper:16});
 const a=timeline.sceneState('startup',10.5),b=timeline.sceneState('handoff',0);
 assert.deepEqual(a,b);assert.ok(b.welcome.every(x=>x.opacity===1));
 for(const s of [timeline.sceneState('handoff',1.5),timeline.sceneState('wallpaper',0)]){
  assert.equal(s.time,12);assert.equal(s.ritualOpacity,0);assert.ok(s.welcome.every(x=>x.opacity===0));assert.equal(s.reveal,1);
 }
});
