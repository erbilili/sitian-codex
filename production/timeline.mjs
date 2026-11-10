export const DURATION={startup:10.5,handoff:1.5,wallpaper:16};
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const titleAnchor=(width,height)=>({x:width*.17,y:height*.43});
export const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
export const STAGES=[
  [0,1.2,'星海初醒','AWAKENING CODEX'],
  [1.2,2.4,'星轨归位','INITIALIZING WORKSPACE'],
  [2.4,3.6,'灵台启明','RESTORING CONTEXT'],
  [3.6,4.8,'玉衡校准','ENVIRONMENT · TOOLS · CONTEXT'],
  [4.8,6,'诸契归位','CODEX · SKILLS · WORKSPACE'],
  [6,6.6,'诸契就绪','PREPARING SYSTEM'],
  [6.6,7.2,'司天临位','CODEX SYSTEM READY'],
];
export function motionAt(time){const p=time*Math.PI*2/16;return {
  clothX:Math.sin(p)*.004+Math.sin(p*2)*.0008,
  clothY:(Math.cos(p)-1)*.0018,
  hairX:Math.sin(p*2)*.0025,
  hairY:Math.sin(p)*.001,
  breath:Math.sin(p*2)*.05,
};}
export function sceneState(mode,seconds){
  const time=mode==='handoff'?10.5+seconds:mode==='wallpaper'?12+seconds:seconds;
  const stage=STAGES.find(x=>time>=x[0]&&time<x[1])||STAGES.at(-1);
  const first=smooth(stage[0],stage[0]+.24,time);
  const last=stage===STAGES.at(-1)?1-smooth(10.5,12,time):1-smooth(stage[1]-.18,stage[1],time);
  const ritualOpacity=mode==='wallpaper'?0:1-smooth(8.2,8.6,time);
  const ritual=STAGES.filter(x=>time>=x[0]).map((x,index)=>({index,title:x[2],english:x[3],completed:time>=x[1],opacity:smooth(x[0],x[0]+.3,time)}));
  const welcome=['司天阁','星轨已定，万象待启。','欢迎回来。'].map((text,index)=>({text,opacity:mode==='wallpaper'?0:smooth(8.6+index*.5,9.1+index*.5,time)*(1-smooth(10.5,12,time))}));
  return {time,title:stage[2],english:stage[3],titleOpacity:mode==='wallpaper'?0:clamp(first*last),ritual,ritualOpacity,welcome,
    reveal:smooth(1.2,7.2,time),motion:motionAt(time-12),isLoop:mode==='wallpaper'};
}
