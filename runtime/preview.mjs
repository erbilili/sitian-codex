import {mountFilm} from './film.mjs';
import {mountWorkFilms} from './work-films.mjs';
import {playbackStats} from './playback-stats.mjs';
import {shouldSkipIntro} from './host-reveal.mjs';
import {mountOrbits} from './orbits.mjs';

const $=selector=>document.querySelector(selector),stage=$('#scene'),status=$('#status'),report=$('#qa-report');
const cfg=await fetch('config.json').then(r=>{if(!r.ok)throw new Error('未找到播放配置');return r.json();});
const media=matchMedia('(prefers-reduced-motion: reduce)');$('#reduce').checked=!!cfg.reduceMotion||media.matches;
let bg=null,phase='startup',workStarted=false,hold=false,skipEntry=false,bench=null,hiddenDuring=false,longTasks=0,disposed=false;
const observer=typeof PerformanceObserver==='function'?new PerformanceObserver(list=>{longTasks+=list.getEntries().length;}):null;
try{observer?.observe({type:'longtask',buffered:false});}catch{}
const boot=mountFilm(window,stage,'startup.mp4',{...cfg,loop:false},finish);
const orbits=mountOrbits(window,stage,cfg);
function showBg(){
  if(!bg)return;
  if(!workStarted){bg.start({skipEntry:skipEntry||$('#reduce').checked});workStarted=true;}
  boot.show(false);bg.show(true);bg.pause(hold);
}
function finish(){
  if(bench){const s=boot.status(),wall=(performance.now()-bench.at)/1000;report.textContent=JSON.stringify({kind:'startup-playback',hiddenDuring,width:s.videoWidth,height:s.videoHeight,wallSeconds:+wall.toFixed(3),mediaSeconds:+s.currentTime.toFixed(3),...playbackStats(bench,s.quality,wall),longTasks:longTasks-bench.tasks});bench=null;}
  phase='background';showBg();
}
function replay(){hold=false;phase='startup';workStarted=false;skipEntry=false;bg?.show(false);boot.replay();orbits.replay();orbits.pause(false);$('#pause').textContent='暂停';if($('#reduce').checked)skip();}
function skip(){bench=null;skipEntry=true;bg?.skip();boot.skip();phase='background';showBg();}
function seek(value){bench=null;hold=true;phase='startup';bg?.show(false);boot.seek(value);orbits.seek(value);orbits.pause(true);$('#pause').textContent='继续';}
function seekEntry(value){if(!bg)return;bench=null;hold=true;phase='background';workStarted=true;boot.show(false);bg.seekEntry(value);orbits.seek(cfg.durationSeconds+Number(value));orbits.pause(true);$('#pause').textContent='继续';}
function reduced(){boot.setReduced($('#reduce').checked);bg?.setReduced($('#reduce').checked);orbits.setReduced($('#reduce').checked);if($('#reduce').checked)skip();}
boot.ready.then(()=>{
  if(disposed)return;boot.show(true);orbits.setReduced($('#reduce').checked);orbits.show(true);for(const id of ['replay','pause','bench','timeline'])$('#'+id).disabled=false;
  if($('#reduce').checked)skip();
  bg=mountWorkFilms(window,stage,'handoff.mp4','wallpaper.mp4',cfg);
  return bg.ready.then(()=>{if(disposed)return;for(const id of ['handoff','skip','entry-timeline'])$('#'+id).disabled=false;bg.setReduced($('#reduce').checked);if(phase==='background')showBg();});
}).catch(e=>status.textContent='影片无法加载：'+e.message);
$('#replay').onclick=replay;$('#skip').onclick=skip;
$('#handoff').onclick=()=>{bench=null;hold=false;phase='background';workStarted=true;boot.show(false);bg.start();bg.show(true);bg.pause(false);orbits.seek(cfg.durationSeconds);orbits.pause(false);$('#pause').textContent='暂停';};
$('#pause').onclick=e=>{hold=!hold;(phase==='startup'?boot:bg)?.pause(hold);orbits.pause(hold);e.target.textContent=hold?'继续':'暂停';};
$('#reduce').onchange=reduced;
const motionChange=()=>{$('#reduce').checked=!!cfg.reduceMotion||media.matches;reduced();};media.addEventListener('change',motionChange);
$('#fullscreen').onclick=()=>stage.requestFullscreen().catch(e=>status.textContent=e.message);
$('#timeline').oninput=e=>seek(e.target.value);$('#entry-timeline').oninput=e=>seekEntry(e.target.value);
document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{if(!boot.status().ready)return;seek(b.dataset.time);$('#timeline').value=b.dataset.time;});
$('#bench').onclick=()=>{replay();if($('#reduce').checked){report.textContent='减少动态已启用；关闭后可测量完整开场。';return;}const q=boot.status().quality;hiddenDuring=document.hidden;bench={at:performance.now(),frames:q?.totalVideoFrames||0,dropped:q?.droppedVideoFrames||0,tasks:longTasks};report.textContent='正在测量 10.5 秒开场，请保持页面可见…';};
const key=e=>{if(shouldSkipIntro(e,phase==='startup'?'playing':'background',bg?.status().phase)){e.preventDefault();skip();}};window.addEventListener('keydown',key);
const timer=setInterval(()=>{
  const s=(phase==='startup'?boot:bg)?.status();if(!s)return;
  if(phase==='startup'&&!hold)$('#timeline').value=s.currentTime;
  if(phase==='background'&&s.phase==='entry'&&!hold)$('#entry-timeline').value=s.currentTime;
  $('#startup-time').textContent=Number($('#timeline').value).toFixed(2)+' / 10.50 秒';$('#entry-time').textContent=Number($('#entry-timeline').value).toFixed(2)+' / 1.50 秒';
  status.textContent=s.error||`${phase==='startup'?'开场':s.phase==='entry'?'交接 · 文字渐隐':'驻守 · 无文字循环'} · ${s.currentTime.toFixed(2)} 秒 · ${s.videoWidth} × ${s.videoHeight} · ${s.reduced?'减少动态':s.paused?'暂停':'播放'} · 静音`;
},100);
const visibility=()=>{if(bench&&document.hidden)hiddenDuring=true;};document.addEventListener('visibilitychange',visibility);
window.__sitianPreview={replay,skip,status:()=>({phase,hold,boot:boot.status(),work:bg?.status(),orbits:orbits.status()})};
window.addEventListener('pagehide',()=>{disposed=true;clearInterval(timer);observer?.disconnect();boot.dispose();bg?.dispose();orbits.dispose();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motionChange);window.removeEventListener('keydown',key);delete window.__sitianPreview;},{once:true});
