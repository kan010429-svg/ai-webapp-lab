'use strict';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let drawingPoints=[], isDrawing=false, epicycles=[], time=0, path=[], numCircles=50, animating=false;
let showCircles=true, trailGlow=true;

function resize() { canvas.width=innerWidth*devicePixelRatio; canvas.height=innerHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
addEventListener('resize', resize); resize();

document.getElementById('num-circles').addEventListener('input', function() {
  numCircles=parseInt(this.value); document.getElementById('num-val').textContent=this.value;
  if (drawingPoints.length>2) { computeDFT(); path=[]; time=0; }
});
document.getElementById('btn-clear').addEventListener('click', () => {
  drawingPoints=[]; epicycles=[]; path=[]; time=0; animating=false;
  document.getElementById('hint').classList.remove('hidden');
});

const presetMenu = document.getElementById('preset-menu');
document.getElementById('btn-presets').addEventListener('click', () => presetMenu.classList.toggle('visible'));

const SHAPES = {
  circle: n => Array.from({length:n},(_,i)=>{const a=(i/n)*Math.PI*2; return {x:Math.cos(a)*150,y:Math.sin(a)*150};}),
  square: n => {const pts=[],s=150,ps=Math.floor(n/4); for(let i=0;i<ps;i++){const t=i/ps;pts.push({x:-s+t*2*s,y:-s});} for(let i=0;i<ps;i++){const t=i/ps;pts.push({x:s,y:-s+t*2*s});} for(let i=0;i<ps;i++){const t=i/ps;pts.push({x:s-t*2*s,y:s});} for(let i=0;i<ps;i++){const t=i/ps;pts.push({x:-s,y:s-t*2*s});} return pts;},
  star: n => Array.from({length:n},(_,i)=>{const a=(i/n)*Math.PI*2-Math.PI/2,r=i%Math.floor(n/5)<Math.floor(n/10)?150:60; return {x:Math.cos(a)*r,y:Math.sin(a)*r};}),
  heart: n => Array.from({length:n},(_,i)=>{const t=(i/n)*Math.PI*2; return {x:16*Math.pow(Math.sin(t),3)*9,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*9};}),
  treble: n => {const pts=[]; for(let i=0;i<n;i++){const t=(i/n)*Math.PI*6,r=30+20*Math.sin(t*0.5); pts.push({x:Math.cos(t)*r+Math.sin(t*0.3)*40,y:t*8-n*0.13});} const cy=pts.reduce((s,p)=>s+p.y,0)/pts.length; pts.forEach(p=>p.y-=cy); return pts;},
  pi: n => {const pts=[],seg=Math.floor(n/5); for(let i=0;i<seg;i++){const t=i/seg;pts.push({x:-100+t*200,y:-100});} for(let i=0;i<seg;i++){const t=i/seg;pts.push({x:-60,y:-100+t*200});} for(let i=0;i<seg;i++){const t=i/seg;pts.push({x:-60,y:100-t*200});} for(let i=0;i<seg;i++){const t=i/seg;pts.push({x:60,y:-100+t*200});} for(let i=0;i<seg;i++){const t=i/seg;pts.push({x:60,y:100-t*200});} return pts;},
  infinity: n => Array.from({length:n},(_,i)=>{const t=(i/n)*Math.PI*2; return {x:Math.cos(t)*150/(1+Math.sin(t)*Math.sin(t)),y:Math.sin(t)*Math.cos(t)*150/(1+Math.sin(t)*Math.sin(t))*1.5};}),
};

presetMenu.addEventListener('click', e => {
  const shape=e.target.dataset.shape; if(!shape||!SHAPES[shape]) return;
  presetMenu.classList.remove('visible');
  const cx=innerWidth/2, cy=innerHeight/2;
  drawingPoints = SHAPES[shape](400).map(p=>({x:p.x+cx,y:p.y+cy}));
  document.getElementById('hint').classList.add('hidden');
  computeDFT(); path=[]; time=0; animating=true;
});

canvas.addEventListener('mousedown', e => {
  if (animating&&epicycles.length) return;
  isDrawing=true; drawingPoints=[]; path=[]; epicycles=[]; time=0; animating=false;
  document.getElementById('hint').classList.add('hidden');
});
canvas.addEventListener('mousemove', e => { if(isDrawing) drawingPoints.push({x:e.clientX,y:e.clientY}); });
canvas.addEventListener('mouseup', () => { if(!isDrawing) return; isDrawing=false; if(drawingPoints.length>10){computeDFT();animating=true;} });

function computeDFT() {
  const N=drawingPoints.length;
  const cx=drawingPoints.reduce((s,p)=>s+p.x,0)/N, cy=drawingPoints.reduce((s,p)=>s+p.y,0)/N;
  const points=drawingPoints.map(p=>({x:p.x-cx,y:p.y-cy}));
  const X=[], limit=Math.min(numCircles,Math.floor(N/2)), freqs=[];
  for (let k=-limit;k<=limit;k++) freqs.push(k);
  for (const k of freqs) {
    let re=0,im=0;
    for (let n=0;n<N;n++) {
      const phi=(2*Math.PI*k*n)/N;
      re+=points[n].x*Math.cos(phi)+points[n].y*Math.sin(phi);
      im+=-points[n].x*Math.sin(phi)+points[n].y*Math.cos(phi);
    }
    re/=N; im/=N;
    X.push({freq:k,re,im,amp:Math.sqrt(re*re+im*im),phase:Math.atan2(im,re)});
  }
  X.sort((a,b)=>b.amp-a.amp);
  epicycles=X; epicycles._cx=cx; epicycles._cy=cy;
}

function drawEpicycles(t) {
  let x=epicycles._cx||innerWidth/2, y=epicycles._cy||innerHeight/2;
  for (let i=0;i<epicycles.length;i++) {
    const {freq,amp,phase}=epicycles[i];
    const prevX=x, prevY=y;
    if (showCircles && amp > 0.5) {
      // Circle with fade based on importance
      const alpha = Math.max(0.03, 0.2*(1-i/epicycles.length));
      ctx.beginPath(); ctx.arc(prevX,prevY,amp,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,106,192,${alpha})`; ctx.lineWidth=0.5; ctx.stroke();
    }
    const angle=freq*t+phase;
    x+=amp*Math.cos(angle); y+=amp*Math.sin(angle);
    if (showCircles && amp > 0.5) {
      const alpha = 0.15+0.35*(1-i/epicycles.length);
      ctx.beginPath(); ctx.moveTo(prevX,prevY); ctx.lineTo(x,y);
      ctx.strokeStyle=`rgba(106,192,255,${alpha})`; ctx.lineWidth=0.8; ctx.stroke();
    }
  }
  return {x,y};
}

function render() {
  const w=innerWidth, h=innerHeight;
  ctx.fillStyle='rgba(10,10,20,0.08)'; ctx.fillRect(0,0,w,h);

  if (isDrawing && drawingPoints.length>1) {
    ctx.fillStyle='#0a0a14'; ctx.fillRect(0,0,w,h);
    ctx.beginPath(); ctx.moveTo(drawingPoints[0].x,drawingPoints[0].y);
    for (let i=1;i<drawingPoints.length;i++) ctx.lineTo(drawingPoints[i].x,drawingPoints[i].y);
    ctx.strokeStyle='rgba(255,106,192,0.6)'; ctx.lineWidth=2; ctx.stroke();
  }

  if (animating && epicycles.length) {
    const dt=(2*Math.PI)/drawingPoints.length;
    const tip=drawEpicycles(time);
    path.push(tip);

    // Draw path with gradient color
    if (path.length>1) {
      for (let i=1;i<path.length;i++) {
        const alpha = 0.3 + (i/path.length)*0.7;
        const hue = (i/path.length)*60 + 320; // pink to magenta
        ctx.beginPath(); ctx.moveTo(path[i-1].x,path[i-1].y); ctx.lineTo(path[i].x,path[i].y);
        ctx.strokeStyle=`hsla(${hue%360},80%,65%,${alpha})`; ctx.lineWidth=2; ctx.stroke();
      }
      // Glow on recent path
      if (trailGlow) {
        const recent = path.slice(-30);
        if (recent.length>1) {
          ctx.beginPath(); ctx.moveTo(recent[0].x,recent[0].y);
          for (let i=1;i<recent.length;i++) ctx.lineTo(recent[i].x,recent[i].y);
          ctx.strokeStyle='rgba(255,106,192,0.3)'; ctx.lineWidth=6; ctx.stroke();
        }
      }
    }

    // Tip with glow
    const tg=ctx.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,10);
    tg.addColorStop(0,'rgba(255,255,255,0.8)'); tg.addColorStop(1,'rgba(255,106,192,0)');
    ctx.beginPath(); ctx.arc(tip.x,tip.y,10,0,Math.PI*2); ctx.fillStyle=tg; ctx.fill();
    ctx.beginPath(); ctx.arc(tip.x,tip.y,3,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();

    // Info
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='11px monospace';
    ctx.fillText(`${epicycles.length} circles | ${path.length}/${drawingPoints.length} points`,10,h-10);

    time+=dt;
    if (time>Math.PI*2) { time=0; path=[]; }
  }
  requestAnimationFrame(render);
}
render();

// Cleanup
function cleanup() {
  animating = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawingPoints = [];
  epicycles = [];
  path = [];
}
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);
