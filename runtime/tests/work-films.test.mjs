import test from 'node:test';import assert from 'node:assert/strict';
import {mountFilm} from '../film.mjs';import {fixture} from './film-fixture.mjs';
const module=await import('../work-films.mjs').catch(()=>({}));
async function setup(reduced=false,systemReduced=false,onFatal=()=>{}){
  const clips={};
  const makeFilm=(_w,_c,source,config,done,fatal)=>{const f=fixture();clips[source]=f;return mountFilm(f.win,f.container,source,config,done,fatal);};
  const media=new EventTarget();media.matches=systemReduced;
  const work=module.mountWorkFilms({matchMedia:()=>media}, {}, 'entry.mp4','loop.mp4',{reduceMotion:reduced},makeFilm,onFatal);
  Object.values(clips).forEach(f=>f.load());await work.ready;return {work,clips,media};
}
// Catches repeating the branded entry on each loop or running both videos at once.
test('work entry runs once and then only the clean background loops',async()=>{
  assert.equal(typeof module.mountWorkFilms,'function');const {work,clips}=await setup();
  work.show(true);work.start();assert.equal(work.status().phase,'entry');
  assert.equal(clips['entry.mp4'].video.paused,false);assert.equal(clips['loop.mp4'].video.paused,true);
  clips['entry.mp4'].video.dispatchEvent(new Event('ended'));assert.equal(work.status().phase,'loop');
  assert.equal(clips['entry.mp4'].video.paused,true);assert.equal(clips['loop.mp4'].video.paused,false);
  clips['loop.mp4'].video.dispatchEvent(new Event('ended'));assert.equal(work.status().phase,'loop');
  assert.equal(clips['entry.mp4'].video.paused,true);work.dispose();
});
test('replay resets the transition but pause and hide never reset its progress',async()=>{
  assert.equal(typeof module.mountWorkFilms,'function');const {work,clips}=await setup();work.show(true);work.start();
  clips['entry.mp4'].frame(.75);work.pause(true);assert.equal(work.status().currentTime,.75);
  assert.equal(clips['entry.mp4'].video.paused,true);work.pause(false);work.show(false);
  assert.equal(clips['entry.mp4'].video.paused,true);work.show(true);assert.equal(work.status().currentTime,.75);
  clips['entry.mp4'].video.dispatchEvent(new Event('ended'));clips['loop.mp4'].frame(7);work.start();
  assert.equal(work.status().phase,'entry');assert.equal(work.status().currentTime,0);assert.equal(clips['loop.mp4'].video.currentTime,0);
  work.dispose();
});
test('reduced motion bypasses branded entry and disposal removes both film controllers',async()=>{
  assert.equal(typeof module.mountWorkFilms,'function');const {work,clips}=await setup(true);work.show(true);work.start();
  assert.equal(work.status().phase,'loop');assert.equal(clips['entry.mp4'].video.paused,true);assert.equal(work.status().paused,false);
  assert.equal(clips['loop.mp4'].video.paused,true);work.dispose();assert.equal(work.status().disposed,true);
});
test('system reduced-motion setting bypasses the entry rather than freezing its title',async()=>{
  const {work}=await setup(false,true);work.show(true);work.start();assert.equal(work.status().phase,'loop');work.dispose();
});
test('entry checkpoints pause at a bounded fade time without running the loop film',async()=>{
  const {work,clips}=await setup();assert.equal(typeof work.seekEntry,'function');
  work.seekEntry(.75);assert.equal(work.status().phase,'entry');assert.equal(work.status().currentTime,.75);assert.equal(work.status().paused,true);
  assert.equal(clips['loop.mp4'].video.paused,true);work.seekEntry(30);assert.ok(work.status().currentTime<1.5);work.dispose();
});
test('a completed entry can be scrubbed and resumed into the clean loop again',async()=>{
  const {work,clips}=await setup();work.show(true);work.start();clips['entry.mp4'].video.dispatchEvent(new Event('ended'));
  work.seekEntry(.75);work.pause(false);assert.equal(clips['entry.mp4'].video.paused,false);
  clips['entry.mp4'].video.dispatchEvent(new Event('ended'));assert.equal(work.status().phase,'loop');work.dispose();
});

test('skip starts a clean loop directly and skips an already playing handoff',async()=>{
  const {work,clips}=await setup();work.show(true);work.start({skipEntry:true});
  assert.equal(work.status().phase,'loop');assert.equal(clips['entry.mp4'].video.paused,true);
  work.start();assert.equal(work.status().phase,'entry');work.skip();
  assert.equal(work.status().phase,'loop');assert.equal(clips['loop.mp4'].video.paused,false);
  work.dispose();
});

test('entry seeking uses the decoded handoff duration when it differs from the default',async()=>{
  const {work,clips}=await setup();clips['entry.mp4'].video.duration=2.25;
  work.seekEntry(2);assert.equal(work.status().currentTime,2);work.seekEntry(30);
  assert.ok(work.status().currentTime>2.2&&work.status().currentTime<2.25);work.dispose();
});

test('a system reduced-motion change during handoff reveals the clean static loop',async()=>{
  const {work,clips,media}=await setup();work.show(true);work.start();
  media.matches=true;media.dispatchEvent(new Event('change'));
  assert.equal(work.status().phase,'loop');assert.equal(clips['entry.mp4'].video.paused,true);
  assert.equal(clips['loop.mp4'].video.paused,true);assert.equal(work.status().reduced,true);work.dispose();
});

test('resetting work films never requests playback for the inactive decoder',async()=>{
  const {work,clips}=await setup();let loopPlays=0,entryPlays=0;
  clips['loop.mp4'].video.play=async()=>{loopPlays++;clips['loop.mp4'].video.paused=false;};
  clips['entry.mp4'].video.play=async()=>{entryPlays++;clips['entry.mp4'].video.paused=false;};
  work.show(true);work.start();assert.equal(loopPlays,0);assert.ok(entryPlays>0);
  work.dispose();
  const direct=await setup();let unwanted=0;direct.clips['entry.mp4'].video.play=async()=>{unwanted++;};
  direct.work.show(true);direct.work.start({skipEntry:true});assert.equal(unwanted,0);direct.work.dispose();
});

test('late handoff and loop decode failures propagate through the work controller',async()=>{
  for(const file of ['entry.mp4','loop.mp4']){
    const failures=[],{work,clips}=await setup(false,false,error=>failures.push(error.message));work.show(true);work.start();
    clips[file].video.dispatchEvent(new Event('error'));await Promise.resolve();
    assert.equal(failures.length,1);assert.match(failures[0],/decode failed/);work.dispose();
  }
});
