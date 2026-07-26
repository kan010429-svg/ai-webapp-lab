'use strict';
(function() {
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,rockets=[],sparks=[],auto=true;
const audio = new (window.AudioContext || window.webkitAudioContext)();
function beep(f, d) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.connect(g); g.connect(audio.destination);
  o.frequency.value = f; g.gain.setValueAtTime(0.08, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + d);
  o.start(); o.stop(audio.currentTime + d);
}
const stats = JSON.parse(localStorage.getItem('fireworksStats') || '{"totalLaunched":0,"maxSparks":0,"sessions":0}');
function resize(){W=c.width=innerWidth;H=c.height=innerHeight-50}
function launch(x,y){
  const tx=x||Math.random()*W*.6+W*.2,ty=y||Math.random()*H*.3+H*.1;
  rockets.push({x:tx,y:H,tx,ty,vy:-12-Math.random()*4,hue:Math.random()*360});
  stats.totalLaunched++;
  beep(200+Math.random()*100,0.1);
}
function explode(r){
  const n=60+Math.random()*60;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=2+Math.random()*6;
    sparks.push({x:r.x,y:r.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,hue:r.hue+Math.random()*40-20,life:1,decay:.01+Math.random()*.02,r:1+Math.random()*2});
  }
  beep(400+Math.random()*200,0.2);
  if(sparks.length>stats.maxSparks){stats.maxSparks=sparks.length;localStorage.setItem('fireworksStats',JSON.stringify(stats));}
}
function draw(){
  ctx.fillStyle='rgba(10,10,26,.15)';ctx.fillRect(0,0,W,H);
  // rockets
  for(let i=rockets.length-1;i>=0;i--){
    const r=rockets[i];r.y+=r.vy;r.vy+=.15;
    ctx.fillStyle=`hsl(${r.hue},80%,70%)`;ctx.beginPath();ctx.arc(r.x,r.y,2,0,Math.PI*2);ctx.fill();
    // trail
    for(let j=0;j<3;j++){
      sparks.push({x:r.x+Math.random()*4-2,y:r.y,vx:Math.random()-.5,vy:Math.random()*2,hue:r.hue,life:.5,decay:.05,r:1});
    }
    if(r.vy>=0||r.y<=r.ty){explode(r);rockets.splice(i,1)}
  }
  // sparks
  for(let i=sparks.length-1;i>=0;i--){
    const s=sparks[i];s.x+=s.vx;s.y+=s.vy;s.vy+=.05;s.life-=s.decay;
    if(s.life<=0){sparks.splice(i,1);continue}
    ctx.globalAlpha=s.life;ctx.fillStyle=`hsl(${s.hue},80%,60%)`;
    ctx.beginPath();ctx.arc(s.x,s.y,s.r*s.life,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  if(auto&&Math.random()<.03)launch();
  requestAnimationFrame(draw);
}
c.addEventListener('click',e=>{launch(e.offsetX,e.offsetY)});
document.getElementById('autoBtn').onclick=function(){auto=!auto;this.textContent=`Auto: ${auto?'ON':'OFF'}`;beep(300,0.05)};
document.getElementById('statsBtn').onclick=()=>{
  document.getElementById('statTotalLaunched').textContent=stats.totalLaunched.toLocaleString();
  document.getElementById('statMaxSparks').textContent=stats.maxSparks.toLocaleString();
  document.getElementById('statSessions').textContent=stats.sessions.toLocaleString();
  document.getElementById('statsModal').style.display='flex';
};
document.getElementById('closeStats').onclick=()=>{document.getElementById('statsModal').style.display='none'};
addEventListener('resize',resize);resize();
stats.sessions++;localStorage.setItem('fireworksStats',JSON.stringify(stats));
draw();
function cleanup(){audio.close()}
addEventListener('beforeunload',cleanup);addEventListener('pagehide',cleanup);
})();
