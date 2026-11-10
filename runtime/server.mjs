import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPayload} from './integration.mjs';
const root=dirname(fileURLToPath(import.meta.url));
// Read-only preview: legacy animation authoring and its media are not served.
const files=new Map([
  ['/', ['index.html','text/html']],['/index.html',['index.html','text/html']],['/preview.css',['preview.css','text/css']],
  ['/preview.mjs',['preview.mjs','text/javascript']],['/config.json',['config.json','application/json']],
  ['/film.mjs',['film.mjs','text/javascript']],['/host-reveal.mjs',['host-reveal.mjs','text/javascript']],
  ['/orbits.mjs',['orbits.mjs','text/javascript']],
  ['/playback-stats.mjs',['playback-stats.mjs','text/javascript']],['/work-films.mjs',['work-films.mjs','text/javascript']],
  ['/startup.mp4',['startup.mp4','video/mp4']],['/handoff.mp4',['handoff.mp4','video/mp4']],['/wallpaper.mp4',['wallpaper.mp4','video/mp4']],
  ['/assets/sitian-idle.png',['assets/sitian-idle.png','image/png']],
  ['/test-host.html',['tests/host.html','text/html']],['/test-host.css',['tests/host.css','text/css']],['/test-host.mjs',['tests/host.mjs','text/javascript']]
]);
const payload=await buildPayload(root);
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only local preview');return;}
    if(url.pathname==='/test-payload.mjs'){
      res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?'':payload);return;
    }
    const route=files.get(url.pathname);if(!route){res.writeHead(404);res.end('Not found');return;}
    const data=await readFile(join(root,route[0])),range=/^bytes=(\d+)-(\d*)$/.exec(String(req.headers.range||''));
    if(range&&route[1]==='video/mp4'){
      const begin=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;
      if(begin>end||begin>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}
      res.writeHead(206,{'Content-Type':route[1],'Content-Length':end-begin+1,'Accept-Ranges':'bytes','Content-Range':`bytes ${begin}-${end}/${data.length}`,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?'':data.subarray(begin,end+1));return;
    }
    res.writeHead(200,{'Content-Type':route[1]+(['text/html','text/css','text/javascript','application/json'].includes(route[1])?'; charset=utf-8':''),'Content-Length':data.length,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self' about:; media-src 'self' data: blob:; object-src 'none'"});
    res.end(req.method==='HEAD'?'':data);
  }catch{res.writeHead(500);res.end('Local file unavailable');}
});
const argument=process.argv.find(a=>a.startsWith('--port='));const port=argument?Number(argument.slice(7)):0;
server.listen(port,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+server.address().port+'/'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
