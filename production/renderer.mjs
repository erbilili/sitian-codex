import {sceneState,smooth,clamp,titleAnchor} from './timeline.mjs';

const VERTEX=`attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FRAGMENT=`precision highp float;
varying vec2 uv; uniform sampler2D art; uniform sampler2D sky;
uniform vec2 size; uniform float time; uniform vec4 flow; uniform float breath;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float ellipse(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.75,1.15,length((p-c)/r));}
void main(){
 vec2 p=vec2(uv.x,1.-uv.y); float aspect=size.x/size.y;
 vec3 original=texture2D(art,p).rgb;
 float protectedZone=max(ellipse(p,vec2(.75,.23),vec2(.09,.24)),max(ellipse(p,vec2(.741,.535),vec2(.09,.085)),ellipse(p,vec2(.823,.744),vec2(.085,.065))));
 protectedZone=max(protectedZone,ellipse(p,vec2(.793,.637),vec2(.086,.12)));
 float lightness=dot(original,vec3(.2126,.7152,.0722));
 float cloth=smoothstep(.08,.35,lightness)*smoothstep(.35,.65,p.y)*(1.-protectedZone);
 float hair=ellipse(p,vec2(.61,.36),vec2(.16,.16))*(1.-protectedZone);
 vec2 bend=vec2(flow.x*(.6+.4*sin(p.y*19.+p.x*5.)),flow.y*(.6+.4*cos(p.x*13.)))*cloth;
 bend+=vec2(flow.z,flow.w)*hair;
 vec3 a=texture2D(art,clamp(p+bend,vec2(.001),vec2(.999))).rgb;
 vec3 b=texture2D(sky,p).rgb;
 float field=noise(p*vec2(26.,15.))*.7+noise(p*vec2(73.,41.))*.3;
 float head=ellipse(p,vec2(.754,.24),vec2(.10,.25));
 float body=ellipse(p,vec2(.76,.60),vec2(.16,.37));
 float orb=ellipse(p,vec2(.793,.637),vec2(.085,.12));
 float birth=3.0+field*2.6-head*.85+orb*.6;
 float formed=smoothstep(birth-.65,birth+.8,time);
 formed=mix(formed,1.,smoothstep(6.3,7.2,time));
 float world=smoothstep(0.,1.25,time);
 vec3 color=mix(b*.82,a,formed)*(.055+.945*world);
 // Distributed contour scintillation precedes material. No vertical wipe.
 vec2 d=vec2(1.4/size.x,1.4/size.y);
 float edge=length(texture2D(art,p+vec2(d.x,0.)).rgb-texture2D(art,p-vec2(d.x,0.)).rgb)+length(texture2D(art,p+vec2(0.,d.y)).rgb-texture2D(art,p-vec2(0.,d.y)).rgb);
 float crest=exp(-pow((time-birth)/.58,2.))*smoothstep(1.1,2.,time)*(1.-smoothstep(5.8,7.2,time));
 color+=vec3(.58,.68,.57)*min(edge*1.4,.65)*crest;
 float core=exp(-dot((p-vec2(.793,.637))*vec2(aspect,1.),(p-vec2(.793,.637))*vec2(aspect,1.))*2200.);
 float pulse=exp(-pow((time-6.35)/.28,2.));
 color+=vec3(.24,.20,.12)*core*(pulse*.9+breath*formed);
 float fineStar=step(.92,max(original.r,max(original.g,original.b)))*step(lightness,.97)*(1.-smoothstep(.35,.75,lightness));
 color+=fineStar*.025*sin(6.2831853*(time-12.)/16.+hash(floor(p*size))*6.2831853);
 gl_FragColor=vec4(color,1.);
}`;

const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Image unavailable: '+src));image.src=src;});
export async function createRenderer(canvas,urls){
  const [art,sky]=await Promise.all([loadImage(urls.art),loadImage(urls.sky)]);
  const width=canvas.width,height=canvas.height,ctx=canvas.getContext('2d',{alpha:false});
  const layer=document.createElement('canvas');layer.width=width;layer.height=height;
  const gl=layer.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!ctx||!gl)throw new Error('Canvas 2D and WebGL are required for production rendering');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const vertex=shader(gl.VERTEX_SHADER,VERTEX),fragment=shader(gl.FRAGMENT_SHADER,FRAGMENT),program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const textures=[];[art,sky].forEach((image,i)=>{const t=gl.createTexture();textures.push(t);gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1i(gl.getUniformLocation(program,i?'sky':'art'),i);});
  const uniform=name=>gl.getUniformLocation(program,name);
  const locations={time:uniform('time'),size:uniform('size'),flow:uniform('flow'),breath:uniform('breath')};gl.uniform2f(locations.size,width,height);gl.viewport(0,0,width,height);
  const sample=document.createElement('canvas');sample.width=art.width;sample.height=art.height;const sampleCtx=sample.getContext('2d');sampleCtx.drawImage(art,0,0);const pixels=sampleCtx.getImageData(0,0,art.width,art.height).data;
  const random=n=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
  const particles=[];
  for(let i=0;i<3600&&particles.length<1350;i++){
    const x=random(i*7+1),y=random(i*7+2);const at=(Math.floor(y*(art.height-1))*art.width+Math.floor(x*(art.width-1)))*4;
    const lum=(pixels[at]+pixels[at+1]+pixels[at+2])/765;
    if(lum<.23||y<.1||x<.32&&y<.5)continue;
    particles.push({x,y,seed:random(i*7+3),angle:random(i*7+4)*Math.PI*2,radius:.25+random(i*7+5)*.6,size:.45+random(i*7+6)*1.05});
  }
  function render(mode,seconds){
    const state=sceneState(mode,seconds),t=state.time,m=state.motion;
    gl.useProgram(program);gl.uniform1f(locations.time,t);gl.uniform4f(locations.flow,m.clothX,m.clothY,m.hairX,m.hairY);gl.uniform1f(locations.breath,m.breath);gl.drawArrays(gl.TRIANGLES,0,6);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0);
    // Concentrating stars converge on distributed character/material anchors.
    const envelope=smooth(.65,1.7,t)*(1-smooth(5.5,7.2,t));
    if(envelope>.001){
      ctx.globalCompositeOperation='screen';
      for(const p of particles){const local=clamp((t-1.05-p.seed*2.7)/2.4),ease=1-Math.pow(1-local,3),remaining=1-ease;
        const theta=p.angle+remaining*.7;
        const x=(p.x+Math.cos(theta)*p.radius*remaining)*width,y=(p.y+Math.sin(theta)*p.radius*.65*remaining)*height;
        const alpha=envelope*(.2+.8*Math.sin(local*Math.PI))*(.4+p.seed*.6);
        if(x<0||x>width||y<0||y>height)continue;
        ctx.fillStyle=`rgba(208,197,151,${alpha*.75})`;ctx.beginPath();ctx.arc(x,y,p.size*width/1920,0,Math.PI*2);ctx.fill();
        if(p.seed>.95){ctx.strokeStyle=`rgba(178,207,204,${alpha*.28})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(theta)*remaining*18,y+Math.sin(theta)*remaining*10);ctx.stroke();}
      }
      ctx.globalCompositeOperation='source-over';
    }
    // Gentle orbital highlights and drifting stars repeat exactly every 16s.
    if(t>4.2){
      const u=(t-12)/16*Math.PI*2,a=smooth(4.2,6.8,t);
      ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=`rgba(222,203,151,${a*.22})`;ctx.lineWidth=1.05*width/1920;
      ctx.translate(width*.793,height*.637);ctx.rotate(-.2);ctx.beginPath();ctx.ellipse(0,0,width*.065,height*.036,0,u,u+.32);ctx.stroke();ctx.restore();
      for(let i=0;i<22;i++){
        const x=(.33+random(i+50)*.65+.0018*Math.sin(u+random(i+20)*6))*width,y=(.12+random(i+90)*.76+.002*Math.cos(u+random(i+30)*6))*height;
        const alpha=(.1+.13*(.5+.5*Math.sin(u*(1+i%2)+i)))*a;
        ctx.fillStyle=`rgba(225,219,184,${alpha})`;ctx.beginPath();ctx.arc(x,y,(.6+random(i+140)*.7)*width/1920,0,Math.PI*2);ctx.fill();
      }
    }
    // Ritual rows accumulate. Welcome follows only after all seven rows complete.
    if(state.ritualOpacity>.001&&mode!=='wallpaper'){
      const x=width*.17,y=height*.255;
      ctx.save();ctx.globalAlpha=state.ritualOpacity;
      ctx.fillStyle='#b9aa83';ctx.font=`${width*.009}px 'Segoe UI',sans-serif`;ctx.letterSpacing=`${width*.002}px`;
      ctx.fillText('SI TIAN  /  AWAKENING',x,y);
      ctx.strokeStyle='rgba(177,155,105,.38)';ctx.beginPath();ctx.moveTo(x,y+height*.025);ctx.lineTo(x+width*.25,y+height*.025);ctx.stroke();
      state.ritual.forEach(row=>{
        const ry=y+height*(.082+row.index*.055);
        ctx.globalAlpha=state.ritualOpacity*row.opacity;
        ctx.fillStyle=row.completed?'#98aaa7':'#ede2bf';ctx.font=`${width*(row.completed?.0145:.018)}px 'SitianFangSong','FangSong',serif`;ctx.letterSpacing=`${width*.003}px`;
        ctx.fillText(row.title,x+width*.02,ry);
        ctx.strokeStyle=row.completed?'#b8a67c':'#efe2b6';ctx.lineWidth=width*.0007;
        ctx.beginPath();ctx.arc(x+width*.004,ry-height*.008,width*.0035,0,Math.PI*2);ctx.stroke();
        if(row.completed){ctx.fillStyle='#b8a67c';ctx.beginPath();ctx.arc(x+width*.004,ry-height*.008,width*.0017,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle=row.completed?'#82928f':'#c3af82';ctx.font=`${width*.0074}px 'Segoe UI','Microsoft YaHei',sans-serif`;ctx.letterSpacing=`${width*.0006}px`;
        ctx.fillText(row.completed?'已完成':'正在启明',x+width*.143,ry-height*.001);
      });ctx.restore();
    }
    if(state.welcome.some(line=>line.opacity>.001)){
      const {x,y}=titleAnchor(width,height);
      ctx.save();ctx.globalAlpha=state.welcome[0].opacity;
      ctx.fillStyle='#b9aa83';ctx.font=`${width*.009}px 'Segoe UI', sans-serif`;ctx.letterSpacing=`${width*.002}px`;ctx.fillText('SI TIAN  /  CODEX WORKSPACE',x,y-height*.093);
      ctx.fillStyle='#e0d7bd';ctx.font=`${width*.042}px 'SitianFangSong','FangSong',serif`;ctx.letterSpacing=`${width*.007}px`;ctx.fillText(state.welcome[0].text,x,y);
      ctx.globalAlpha=state.welcome[1].opacity;ctx.letterSpacing=`${width*.002}px`;ctx.font=`${width*.014}px 'SitianFangSong','FangSong',serif`;ctx.fillStyle='#c0c9c1';ctx.fillText(state.welcome[1].text,x,y+height*.063);
      ctx.globalAlpha=state.welcome[2].opacity;ctx.font=`${width*.011}px 'SitianFangSong','FangSong',serif`;ctx.fillStyle='#9bacae';ctx.fillText(state.welcome[2].text,x,y+height*.113);
      ctx.globalAlpha=state.welcome[0].opacity;
      ctx.strokeStyle='rgba(177,155,105,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+height*.15);ctx.lineTo(x+width*.18,y+height*.15);ctx.stroke();
      ctx.fillStyle='#c3ad7f';ctx.translate(x+width*.187,y+height*.15);ctx.rotate(Math.PI/4);ctx.fillRect(-2,-2,4,4);ctx.restore();
    }
    return state;
  }
  return {render,dispose(){textures.forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);gl.getExtension('WEBGL_lose_context')?.loseContext();layer.width=0;sample.width=0;}};
}
