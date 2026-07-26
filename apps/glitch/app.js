'use strict';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null, autoMode = false, autoFrame;

document.getElementById('btn-upload').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyGlitch();
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById('btn-glitch').addEventListener('click', applyGlitch);
document.getElementById('btn-auto').addEventListener('click', function() {
  autoMode = !autoMode; this.textContent = autoMode ? '⏸ 自動' : '▶ 自動';
  if (autoMode) autoLoop();
});
document.getElementById('btn-save').addEventListener('click', () => {
  const a = document.createElement('a'); a.download = 'glitch.png'; a.href = canvas.toDataURL(); a.click();
});

function getVal(id) { return parseInt(document.getElementById(id).value); }

function applyGlitch() {
  if (!originalImage) {
    canvas.width = 800; canvas.height = 500;
    // More interesting default pattern
    const grad = ctx.createLinearGradient(0,0,800,500);
    grad.addColorStop(0,'#ff6b6b'); grad.addColorStop(0.3,'#6366f1'); grad.addColorStop(0.7,'#58a6ff'); grad.addColorStop(1,'#3fb950');
    ctx.fillStyle = grad; ctx.fillRect(0,0,800,500);
    // Geometric shapes
    for (let i=0;i<8;i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1+Math.random()*0.15})`;
      ctx.beginPath(); ctx.arc(100+i*90, 250+Math.sin(i)*80, 30+Math.random()*40, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 72px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GLITCH', 400, 250);
    ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('ART GENERATOR', 400, 310);
    originalImage = ctx.getImageData(0, 0, 800, 500);
  }

  const w = canvas.width, h = canvas.height;
  ctx.putImageData(originalImage, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // RGB Shift with diagonal
  const rgbShift = getVal('rgb-shift');
  if (rgbShift > 0) {
    const shift = Math.floor(rgbShift * 0.15);
    const copy = new Uint8ClampedArray(data);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
      const i=(y*w+x)*4;
      const rx=Math.min(w-1,x+shift), bx=Math.max(0,x-shift);
      const ry=Math.min(h-1,y+Math.floor(shift*0.3));
      data[i] = copy[(ry*w+rx)*4];
      data[i+2] = copy[(y*w+bx)*4+2];
    }
  }

  // Scanlines with variable intensity
  const scanlines = getVal('scanlines');
  if (scanlines > 0) {
    for (let y=0;y<h;y++) {
      const factor = y%2===0 ? 1-scanlines*0.005 : 1-scanlines*0.002;
      const bright = y%4===0 ? 1+scanlines*0.001 : 1;
      for (let x=0;x<w;x++) {
        const i=(y*w+x)*4;
        data[i]*=factor*bright; data[i+1]*=factor*bright; data[i+2]*=factor*bright;
      }
    }
  }

  // Noise with color
  const noise = getVal('noise');
  if (noise > 0) {
    for (let i=0;i<data.length;i+=4) {
      if (Math.random() < noise*0.006) {
        const n=(Math.random()-0.5)*noise*5;
        const colorNoise = Math.random() < 0.3;
        if (colorNoise) { data[i]+=n*2; data[i+1]-=n; data[i+2]+=n*1.5; }
        else { data[i]+=n; data[i+1]+=n; data[i+2]+=n; }
      }
    }
  }

  // Slice with color shift
  const slice = getVal('slice');
  if (slice > 0) {
    const numSlices = Math.floor(slice*0.2)+1;
    for (let s=0;s<numSlices;s++) {
      const y=Math.floor(Math.random()*h), sliceH=Math.floor(Math.random()*25)+2;
      const offset=Math.floor((Math.random()-0.5)*slice*0.6);
      const colorShift = Math.random() < 0.3;
      for (let dy=0;dy<sliceH&&y+dy<h;dy++) for (let x=0;x<w;x++) {
        const srcX=Math.max(0,Math.min(w-1,x+offset));
        const di=((y+dy)*w+x)*4, si=((y+dy)*w+srcX)*4;
        data[di]=data[si]; data[di+1]=data[si+1]; data[di+2]=data[si+2];
        if (colorShift) { data[di]+=30; data[di+2]-=20; }
      }
    }
  }

  // Chromatic aberration (improved)
  const chromatic = getVal('chromatic');
  if (chromatic > 0) {
    const copy = new Uint8ClampedArray(data);
    const shift = Math.floor(chromatic*0.1);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
      const i=(y*w+x)*4;
      const sy=Math.min(h-1,y+shift), sx=Math.min(w-1,x+Math.floor(shift*0.5));
      data[i+1] = copy[(sy*w+sx)*4+1];
    }
  }

  // Pixel sort (improved with direction)
  const pixelSort = getVal('pixel-sort');
  if (pixelSort > 0) {
    const threshold = 255-pixelSort*2;
    for (let y=0;y<h;y+=2) {
      let start=-1;
      for (let x=0;x<w;x++) {
        const i=(y*w+x)*4, brightness=(data[i]+data[i+1]+data[i+2])/3;
        if (brightness>threshold&&start===-1) start=x;
        else if ((brightness<=threshold||x===w-1)&&start!==-1) {
          const pixels=[];
          for (let sx=start;sx<=x;sx++) { const si=(y*w+sx)*4; pixels.push([data[si],data[si+1],data[si+2]]); }
          pixels.sort((a,b)=>(a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]));
          for (let j=0;j<pixels.length;j++) { const si=(y*w+start+j)*4; data[si]=pixels[j][0]; data[si+1]=pixels[j][1]; data[si+2]=pixels[j][2]; }
          start=-1;
        }
      }
    }
  }

  // VHS with tracking lines
  const vhs = getVal('vhs');
  if (vhs > 0) {
    const t = Date.now()*0.001;
    for (let y=0;y<h;y++) {
      const wobble = Math.sin(y*0.1+t*3+Math.random()*vhs*0.05)*vhs*0.06;
      // Tracking line
      if (Math.random() < vhs*0.0003) {
        for (let x=0;x<w;x++) { const i=(y*w+x)*4; data[i]=255; data[i+1]=255; data[i+2]=255; }
        continue;
      }
      if (Math.abs(wobble)>1) {
        for (let x=0;x<w;x++) {
          const sx=Math.max(0,Math.min(w-1,Math.floor(x+wobble)));
          const di=(y*w+x)*4, si=(y*w+sx)*4;
          data[di]=data[si]; data[di+1]=data[si+1]; data[di+2]=data[si+2];
        }
      }
    }
    // Color bleed
    for (let y=0;y<h;y++) for (let x=1;x<w;x++) {
      const i=(y*w+x)*4, pi=(y*w+x-1)*4;
      data[i] = Math.round(data[i]*0.95 + data[pi]*0.05);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Overlay effects
  if (vhs > 30) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.05})`; ctx.fillRect(0,0,w,h);
    // CRT vignette
    const vg = ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.3,w/2,h/2,Math.max(w,h)*0.7);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(0,0,0,${vhs*0.003})`);
    ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
  }
}

function autoLoop() {
  if (!autoMode) return;
  ['rgb-shift','scanlines','noise','slice','chromatic','vhs'].forEach(id => {
    const el=document.getElementById(id), v=parseInt(el.value);
    el.value=Math.max(0,Math.min(100,v+Math.floor((Math.random()-0.5)*15)));
  });
  applyGlitch();
  autoFrame = setTimeout(autoLoop, 120);
}

['rgb-shift','scanlines','pixel-sort','noise','slice','chromatic','vhs'].forEach(id => {
  document.getElementById(id).addEventListener('input', applyGlitch);
});

applyGlitch();

// Cleanup
function cleanup() {
  autoMode = false;
  if (autoFrame) clearTimeout(autoFrame);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  originalImage = null;
}
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);
