import test from 'node:test';
import assert from 'node:assert/strict';
const {mountOrbits}=await import('../orbits.mjs').catch(()=>({}));
function fixture(){
 const animations=[],events=new Map();
 class Element{
  style={};children=[];attrs={};
  setAttribute(k,v){this.attrs[k]=String(v);}
  appendChild(n){this.children.push(n);n.parent=this;return n;}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
  animate(frames,options){const a={frames,options,currentTime:0,playState:'running',play(){this.playState='running';},pause(){this.playState='paused';},cancel(){this.playState='idle';}};animations.push(a);return a;}
 }
 const doc={hidden:false,createElementNS:()=>new Element(),addEventListener:(e,f)=>events.set(e,f),removeEventListener:(e)=>events.delete(e)};
 const win={document:doc,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
 return {win,container:new Element(),animations,events,advance(ms){for(const a of animations)if(a.playState==='running')a.currentTime+=ms;},hide(v){doc.hidden=v;events.get('visibilitychange')?.();}};
}
test('orbit clock continues beyond a sixteen second MP4 wrap without resetting',()=>{
 assert.equal(typeof mountOrbits,'function');const f=fixture(),c=mountOrbits(f.win,f.container);
 c.show(true);f.advance(15900);const before=c.status();f.advance(200);const after=c.status();
 assert.deepEqual(after.periods,[120,180]);assert.equal(after.elapsedSeconds,16.1);assert.ok(after.angles[0]>before.angles[0]);assert.ok(after.angles[0]<50);
});
test('orbit motion pauses for hidden pages, explicit pause and reduced motion',()=>{
 assert.equal(typeof mountOrbits,'function');const f=fixture(),c=mountOrbits(f.win,f.container);c.show(true);f.advance(1000);
 f.hide(true);f.advance(1000);assert.equal(c.status().elapsedSeconds,1);f.hide(false);f.advance(1000);assert.equal(c.status().elapsedSeconds,2);
 c.pause(true);f.advance(1000);assert.equal(c.status().elapsedSeconds,2);c.pause(false);c.setReduced(true);f.advance(1000);assert.equal(c.status().elapsedSeconds,2);
 c.setReduced(false);f.advance(1000);assert.equal(c.status().elapsedSeconds,3);
});
test('replay resets the orbit clock and dispose removes its layer and listeners',()=>{
 assert.equal(typeof mountOrbits,'function');const f=fixture(),c=mountOrbits(f.win,f.container);c.show(true);f.advance(8000);c.replay();assert.equal(c.status().elapsedSeconds,0);
 c.dispose();c.dispose();assert.equal(f.container.children.length,0);assert.equal(f.events.size,0);assert.ok(f.animations.every(a=>a.playState==='idle'));
});
