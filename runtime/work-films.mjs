import {mountFilm} from './film.mjs';
// Playback-only: no blend between character frames and no work-time canvas rendering.
export function mountWorkFilms(win,container,entrySource,loopSource,config={},makeFilm=mountFilm,onFatal=()=>{}){
  const motion=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let phase='waiting',visible=false,paused=false,disposed=false,reduced=!!config.reduceMotion||!!motion?.matches;
  const loop=makeFilm(win,container,loopSource,{...config,loop:true},()=>{},onFatal);
  const entry=makeFilm(win,container,entrySource,{...config,loop:false},finishEntry,onFatal);
  function sync(){
    if(disposed)return;entry.show(visible&&phase==='entry');loop.show(visible&&phase==='loop');
    entry.pause(paused);loop.pause(paused);
  }
  function finishEntry(){if(disposed||phase!=='entry')return;phase='loop';sync();}
  function setReduced(value){reduced=!!value;entry.setReduced(value);loop.setReduced(value);if(reduced)finishEntry();sync();}
  function motionChange(){setReduced(!!config.reduceMotion||!!motion.matches);}
  motion?.addEventListener?.('change',motionChange);
  const ready=Promise.all([entry.ready,loop.ready]).then(()=>{if(!disposed)sync();});
  return {ready,
    start({skipEntry=false}={}){if(disposed)return;entry.show(false);loop.show(false);loop.replay({show:false});entry.replay({show:false});phase=reduced||skipEntry?'loop':'entry';sync();},
    skip(){if(disposed)return;phase='loop';sync();},
    show(value){visible=!!value;sync();},pause(value){paused=!!value;sync();},
    setReduced,
    seekEntry(value){if(disposed)return;phase='entry';const duration=entry.status().duration||Number(config.workEntrySeconds)||1.5;entry.seek(Math.max(0,Math.min(duration-.01,Number(value)||0)));paused=true;visible=true;sync();},
    status(){const active=phase==='loop'?loop:entry;return {...active.status(),phase,paused,disposed,entry:entry.status(),loopFilm:loop.status()};},
    dispose(){if(disposed)return;disposed=true;motion?.removeEventListener?.('change',motionChange);entry.dispose();loop.dispose();}
  };
}
