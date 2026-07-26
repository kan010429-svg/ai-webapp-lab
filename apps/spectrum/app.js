const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,analyser,dataArray,mode='bars',started=false;
function resize(){W=c.width=innerWidth;H=c.height=innerHeight-50}
async function start(){
  if(started)return;
  try {
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      alert('Web Audio API is not supported in this browser');
      return;
    }
    const audioCtx=new AudioContext();
    const source=audioCtx.createMediaStreamSource(stream);
    analyser=audioCtx.createAnalyser();analyser.fftSize=512;
    source.connect(analyser);
    dataArray=new Uint8Array(analyser.frequencyBinCount);
    started=true;draw();
  } catch (err) {
    console.error('Failed to start audio:', err);
    alert('マイクへのアクセスが拒否されました');
  }
}
function draw(){
  if(!started){requestAnimationFrame(draw);return}
  analyser.getByteFrequencyData(dataArray);
  ctx.fillStyle='rgba(10,10,26,.2)';ctx.fillRect(0,0,W,H);
  const n=dataArray.length;
  if(mode==='bars'){
    const bw=W/n*2;
    for(let i=0;i<n;i++){
      const v=dataArray[i]/255;const h=i/n*360;
      ctx.fillStyle=`hsla(${h},80%,55%,${.3+v*.7})`;
      const bh=v*H*.8;
      ctx.fillRect(i*bw,H-bh,bw-1,bh);
      ctx.fillStyle=`hsla(${h},80%,55%,.1)`;ctx.fillRect(i*bw,H-bh-5,bw-1,3);
    }
  }else if(mode==='circle'){
    const cx=W/2,cy=H/2,r=Math.min(W,H)*.3;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2-Math.PI/2;const v=dataArray[i]/255;
      const r2=r+v*r;const h=i/n*360;
      ctx.strokeStyle=`hsla(${h},80%,55%,${.3+v*.7})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
      ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();
    }
  }else if(mode==='wave'){
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const x=i/n*W;const v=dataArray[i]/255;const y=H/2-v*H*.4;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    const grd=ctx.createLinearGradient(0,0,W,0);
    grd.addColorStop(0,'#ff6b6b');grd.addColorStop(.5,'#89b4fa');grd.addColorStop(1,'#a6e3a1');
    ctx.strokeStyle=grd;ctx.lineWidth=2;ctx.stroke();
  }else{// dots
    for(let i=0;i<n;i++){
      const v=dataArray[i]/255;if(v<.05)continue;
      const x=i/n*W;const y=H/2-v*H*.4;const h=i/n*360;
      ctx.fillStyle=`hsla(${h},80%,55%,${v})`;
      ctx.beginPath();ctx.arc(x,y,v*8+1,0,Math.PI*2);ctx.fill();
    }
  }
  requestAnimationFrame(draw);
}
document.getElementById('mode').onchange=e=>mode=e.target.value;
document.getElementById('startBtn').onclick=start;
addEventListener('resize',resize);resize();draw();

let animId;function startDraw(){animId=requestAnimationFrame(draw);}
function cleanup(){if(animId)cancelAnimationFrame(animId);if(analyser&&audioCtx){audioCtx.close();}}
window.addEventListener('beforeunload',cleanup);window.addEventListener('pagehide',cleanup);
startDraw();
