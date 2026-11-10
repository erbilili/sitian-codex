import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),workspace=root;
const cli=join(workspace,'node_modules/@remotion/cli/remotion-cli.js');
// Render into this independent variant only. Never point outputs at WhiteDragonCodex.
for(const [id,file] of [['SitianStartup','startup.mp4'],['SitianHandoff','handoff.mp4'],['SitianWallpaper','wallpaper.mp4']]){
 console.log('Rendering '+id);
 const args=[cli,'render',join(root,'production/index.tsx'),id,join(root,'runtime',file),
  '--public-dir='+join(root,'production/public'),'--codec=h264','--video-bitrate=5M','--pixel-format=yuv420p','--color-space=bt709','--image-format=png','--gl=angle','--concurrency=2'];
 const code=await new Promise((res,rej)=>{const child=spawn(process.execPath,args,{cwd:workspace,stdio:'inherit',windowsHide:true});child.on('error',rej);child.on('exit',res);});
 if(code!==0)throw new Error(id+' failed: '+code);
}
console.log('All three clips exported. Run npm test before installing.');
