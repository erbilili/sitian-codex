// Own only #root opacity/transition; restore the precise previous declarations.
export function mountHostReveal(win,host){
  const before=Object.fromEntries(['opacity','transition'].map(name=>[name,[host.style.getPropertyValue(name),host.style.getPropertyPriority(name)]]));
  let timer=0,disposed=false;
  function restore(){for(const [name,[value,priority]] of Object.entries(before))value?host.style.setProperty(name,value,priority):host.style.removeProperty(name);}
  return {
    hide(){if(disposed)return;win.clearTimeout(timer);host.style.setProperty('transition','none','important');host.style.setProperty('opacity','0','important');},
    show(immediate=false){if(disposed)return;win.clearTimeout(timer);if(immediate){restore();return;}host.getBoundingClientRect();host.style.setProperty('transition','opacity 1500ms ease','important');host.style.setProperty('opacity',before.opacity[0]||'1','important');timer=win.setTimeout(restore,1500);},
    dispose(){if(disposed)return;disposed=true;win.clearTimeout(timer);restore();}
  };
}
export function shouldSkipIntro(event,phase,workPhase){
  return event.key==='Escape'&&!event.defaultPrevented&&!event.isComposing&&!event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')&&(phase==='playing'||phase==='background'&&workPhase==='entry');
}
