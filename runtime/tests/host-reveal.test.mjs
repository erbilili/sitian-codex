import test from 'node:test';
import assert from 'node:assert/strict';
const {mountHostReveal,shouldSkipIntro}=await import('../integration.mjs');

// A CSS declaration boundary: exercise the real reveal lifecycle without a browser.
function fixture(){
  const values=new Map([['opacity',['.83','important']],['transition',['color 200ms','']]]);
  const root={style:{getPropertyValue:k=>values.get(k)?.[0]||'',getPropertyPriority:k=>values.get(k)?.[1]||'',
    setProperty:(k,v,p='')=>values.set(k,[v,p]),removeProperty:k=>values.delete(k)},getBoundingClientRect:()=>({width:1280})};
  let now=0,id=0;const timers=new Map();
  const win={setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id)};
  return {root,win,advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}}};
}
test('handoff fades only the owned host root then restores its previous inline values',()=>{
  assert.equal(typeof mountHostReveal,'function');const f=fixture(),reveal=mountHostReveal(f.win,f.root);
  reveal.hide();assert.equal(f.root.style.getPropertyValue('opacity'),'0');
  reveal.show();assert.match(f.root.style.getPropertyValue('transition'),/opacity 1500ms/);
  assert.equal(f.root.style.getPropertyValue('opacity'),'.83');f.advance(1499);
  assert.match(f.root.style.getPropertyValue('transition'),/opacity 1500ms/);f.advance(1);
  assert.equal(f.root.style.getPropertyValue('transition'),'color 200ms');
  assert.equal(f.root.style.getPropertyPriority('opacity'),'important');reveal.dispose();
});
test('restore during replay cancels the fade and reduced motion reveals immediately',()=>{
  assert.equal(typeof mountHostReveal,'function');const f=fixture(),reveal=mountHostReveal(f.win,f.root);
  reveal.hide();reveal.show();reveal.hide();reveal.dispose();f.advance(3000);
  assert.equal(f.root.style.getPropertyValue('opacity'),'.83');assert.equal(f.root.style.getPropertyValue('transition'),'color 200ms');
  const g=fixture(),reduced=mountHostReveal(g.win,g.root);reduced.hide();reduced.show(true);
  assert.equal(g.root.style.getPropertyValue('transition'),'color 200ms');reduced.dispose();
});
test('Escape skips startup and handoff but leaves text entry and the work loop alone',()=>{
  assert.equal(typeof shouldSkipIntro,'function');
  assert.equal(shouldSkipIntro({key:'Escape',target:{closest:()=>null}},'playing','entry'),true);
  assert.equal(shouldSkipIntro({key:'Escape',target:{closest:()=>({})}},'playing','entry'),false);
  assert.equal(shouldSkipIntro({key:'Escape',target:{closest:()=>null}},'background','entry'),true);
  assert.equal(shouldSkipIntro({key:'Escape',target:{closest:()=>null}},'background','loop'),false);
});
