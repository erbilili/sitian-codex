import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig,delayRender,continueRender,cancelRender,staticFile} from 'remotion';
// The mjs renderer is shared by the frame-accurate production preview and exports.
import {createRenderer} from './renderer.mjs';

function Scene({mode}:{mode:'startup'|'handoff'|'wallpaper'}){
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),canvas=useRef<HTMLCanvasElement>(null);
 const [handle]=useState(()=>delayRender('Load Sitian artwork and font'));
 const [renderer,setRenderer]=useState<any>(null);const released=useRef(false);
 useEffect(()=>{let disposed=false,instance:any;
  const font=new FontFace('SitianFangSong',`url(${staticFile('simfang.ttf')})`);
  Promise.all([font.load(),createRenderer(canvas.current!,{art:staticFile('sitian-clean.png'),sky:staticFile('starfield-clean.png')})]).then(([loaded,r])=>{
   document.fonts.add(loaded);instance=r;if(disposed){r.dispose();return;}setRenderer(r);
  }).catch(cancelRender);
  return()=>{disposed=true;instance?.dispose();};
 },[]);
 useLayoutEffect(()=>{if(!renderer)return;renderer.render(mode,frame/fps);if(!released.current){released.current=true;continueRender(handle);}},[renderer,frame,fps,mode,handle]);
 return <canvas ref={canvas} width={width} height={height} style={{width:'100%',height:'100%',display:'block',background:'#02070b'}}/>;
}
const Root=()=> <>
 <Composition id="SitianStartup" component={Scene} durationInFrames={315} fps={30} width={1920} height={1080} defaultProps={{mode:'startup' as const}}/>
 <Composition id="SitianHandoff" component={Scene} durationInFrames={45} fps={30} width={1920} height={1080} defaultProps={{mode:'handoff' as const}}/>
 <Composition id="SitianWallpaper" component={Scene} durationInFrames={480} fps={30} width={1920} height={1080} defaultProps={{mode:'wallpaper' as const}}/>
</>;
registerRoot(Root);
