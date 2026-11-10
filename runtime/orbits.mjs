// Self-contained: serialized into the appearance payload and included in consent.
// Long-period vector motion is independent of the sixteen-second film clock.
export function mountOrbits(win,container,config={}){
 const doc=win.document,ns='http://www.w3.org/2000/svg',motion=win.matchMedia('(prefers-reduced-motion: reduce)');
 const svg=doc.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1920 1080');svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('aria-hidden','true');svg.setAttribute('data-sitian-orbits','');
 Object.assign(svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'2',opacity:'0',transition:'opacity 1600ms ease'});
 const node=(tag,attrs,parent)=>{const e=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;};
 const defs=node('defs',{},svg),mask=node('mask',{id:'sitian-orbit-occlusion',maskUnits:'userSpaceOnUse',x:0,y:0,width:1920,height:1080},defs);
 node('rect',{x:0,y:0,width:1920,height:1080,fill:'white'},mask);
 const blur=node('filter',{id:'sitian-mask-soft',x:'-10%',y:'-10%',width:'120%',height:'120%'},defs);node('feGaussianBlur',{stdDeviation:16},blur);
 const protectedArea=node('g',{fill:'black',filter:'url(#sitian-mask-soft)'},mask);
 // Crown, head, streaming hair and robe silhouette: tracks remain in the sky.
 node('ellipse',{cx:1450,cy:290,rx:165,ry:305},protectedArea);
 node('path',{d:'M1920 280 Q1710 260 1570 370 Q1330 340 1170 410 Q1030 450 830 510 Q630 545 510 620 Q240 665 0 640 L0 1080 L1920 1080 Z'},protectedArea);
 // Main paths are sparse, with asymmetrical breaks and orbiting chart nodes.
 const layer=node('g',{mask:'url(#sitian-orbit-occlusion)',fill:'none',stroke:'#bba16b','stroke-width':.85},svg);
 const periods=[120,180],animations=[];
 for(let i=0;i<2;i++){
  const cx=i?1270:1030,cy=i?230:350,rx=i?820:1120,ry=i?330:455;
  const center=node('g',{transform:`translate(${cx} ${cy})`},layer);
  const ring=node('g',{'data-orbit-period':periods[i]},center);
  Object.assign(ring.style,{transformOrigin:'0px 0px',transformBox:'view-box'});
  node('ellipse',{cx:0,cy:0,rx,ry,'stroke-opacity':i?.48:.65,'stroke-dasharray':i?'590 75 960 110':'1040 75 720 48'},ring);
  for(let n=0;n<12;n++){
   const a=n*Math.PI/6+i*.22,x=rx*Math.cos(a),y=ry*Math.sin(a);
   node('circle',{cx:x,cy:y,r:n%3===0?5:2.1,fill:n%3===0?'#071017':'#dac394','stroke-opacity':.85},ring);
   if(n%3===0)node('path',{d:`M${x-8} ${y}h16 M${x} ${y-8}v16`,'stroke-opacity':.6,'stroke-width':.65},ring);
  }
  const a=ring.animate([{transform:`rotate(${i?24:-18}deg)`},{transform:`rotate(${i?-336:342}deg)`}],{duration:periods[i]*1000,iterations:Infinity,easing:'linear'});a.pause();animations.push(a);
 }
 container.appendChild(svg);
 let visible=false,paused=false,reduced=!!config.reduceMotion||motion.matches,disposed=false;
 function sync(){if(disposed)return;svg.style.opacity=visible?'.62':'0';const run=visible&&!paused&&!reduced&&!doc.hidden;for(const a of animations)run?a.play():a.pause();}
 function visibility(){sync();}
 function motionChange(){reduced=!!config.reduceMotion||motion.matches;sync();}
 doc.addEventListener('visibilitychange',visibility);motion.addEventListener('change',motionChange);
 return {
  show(value){visible=!!value;sync();},pause(value){paused=!!value;sync();},setReduced(value){reduced=!!value;sync();},
  replay(){for(const a of animations)a.currentTime=0;sync();},
  seek(seconds){for(const a of animations)a.currentTime=Math.max(0,Number(seconds)||0)*1000;sync();},
  status(){return {visible,paused,reduced,disposed,periods,elapsedSeconds:(animations[0].currentTime||0)/1000,angles:animations.map((a,i)=>(a.currentTime||0)/(periods[i]*1000)*360*(i?-1:1)),running:animations.some(a=>a.playState==='running')};},
  dispose(){if(disposed)return;disposed=true;animations.forEach(a=>a.cancel());doc.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',motionChange);svg.remove();}
 };
}
