(function(){'use strict';
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,mode='sunny',timeOfDay='day',particles=[],t=0,wind=5,density=200,autoMode=false,mouseX=W/2,mouseY=H/2;
const modes=['sunny','rain','snow','storm','aurora'];
let modeIndex=0,autoTimer=0;

function resize(){W=c.width=innerWidth;H=c.height=innerHeight-50;init()}

function init(){
  particles=[];
  const n=mode==='rain'?density:mode==='snow'?Math.floor(density*.7):mode==='storm'?Math.floor(density*1.5):0;
  for(let i=0;i<n;i++)particles.push(mkP());
}

function mkP(){
  if(mode==='rain')return{x:Math.random()*W,y:Math.random()*H,vy:8+Math.random()*12,len:10+Math.random()*20,a:.3+Math.random()*.5};
  if(mode==='snow')return{x:Math.random()*W,y:Math.random()*H,vy:.5+Math.random()*2,vx:Math.sin(Math.random()*6)*.5,r:1+Math.random()*4,a:.3+Math.random()*.7};
  if(mode==='storm')return{x:Math.random()*W,y:Math.random()*H,vy:15+Math.random()*20,vx:5+Math.random()*5,len:15+Math.random()*30,a:.2+Math.random()*.4};
  return{};
}

function getColors(){
  if(timeOfDay==='day')return{sky:'#1a1a3a',sun:'rgba(255,220,80,.9)',sunGlow:'rgba(255,200,50,.3)'};
  if(timeOfDay==='sunset')return{sky:'#2a1a3a',sun:'rgba(255,120,50,.9)',sunGlow:'rgba(255,100,30,.3)'};
  return{sky:'#050515',sun:'rgba(200,200,220,.7)',sunGlow:'rgba(180,180,200,.2)'};
}

function drawSunny(){
  const colors=getColors();
  const grd=ctx.createRadialGradient(W/2,H*.3,0,W/2,H*.3,W*.6);
  grd.addColorStop(0,colors.sunGlow);grd.addColorStop(.5,colors.sunGlow.replace('.3','.1'));grd.addColorStop(1,'transparent');
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  
  const sunX=W/2+(mouseX-W/2)*.1,sunY=H*.3+(mouseY-H*.3)*.1;
  ctx.fillStyle=colors.sun;ctx.beginPath();ctx.arc(sunX,sunY,60,0,Math.PI*2);ctx.fill();
  
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6+t*.01;
    const x1=sunX+Math.cos(a)*80,y1=sunY+Math.sin(a)*80;
    const x2=sunX+Math.cos(a)*(120+Math.sin(t*.05+i)*20),y2=sunY+Math.sin(a)*(120+Math.sin(t*.05+i)*20);
    ctx.strokeStyle=colors.sun.replace('.9','.4');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
}

function drawAurora(){
  for(let i=0;i<5;i++){
    ctx.beginPath();
    const y=H*.2+i*40+Math.sin(t*.01+i)*30;
    ctx.moveTo(0,y);
    for(let x=0;x<W;x+=10){
      const mouseInfluence=Math.max(0,1-Math.hypot(x-mouseX,y-mouseY)/200)*30;
      ctx.lineTo(x,y+Math.sin(x*.005+t*.02+i)*50+Math.sin(x*.01+t*.03)*20+mouseInfluence);
    }
    ctx.strokeStyle=`hsla(${120+i*30+t*.5},80%,60%,.15)`;ctx.lineWidth=40;ctx.stroke();
  }
}

function lightning(){
  if(Math.random()>.98){
    let x=Math.random()*W,y=0;
    ctx.strokeStyle='rgba(200,200,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);
    for(let i=0;i<15;i++){x+=Math.random()*60-30;y+=H/15;ctx.lineTo(x,y)}
    ctx.stroke();
    ctx.fillStyle='rgba(200,200,255,.1)';ctx.fillRect(0,0,W,H);
  }
}

function draw(){
  const colors=getColors();
  const bg=mode==='sunny'?colors.sky:mode==='rain'?'#0a0a1a':mode==='snow'?'#0d1117':mode==='storm'?'#050510':'#050515';
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  
  if(mode==='sunny')drawSunny();
  if(mode==='aurora')drawAurora();
  if(mode==='storm')lightning();
  
  const windForce=(wind-5)*.5;
  for(const p of particles){
    if(mode==='rain'||mode==='storm'){
      ctx.strokeStyle=`rgba(120,160,255,${p.a})`;ctx.lineWidth=1.5;ctx.beginPath();
      ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(p.vx||0)+windForce,p.y+p.len);ctx.stroke();
      p.y+=p.vy;p.x+=(p.vx||0)+windForce;
      if(p.y>H){p.y=-p.len;p.x=Math.random()*W}
      if(p.x<-50||p.x>W+50){p.x=Math.random()*W;p.y=-p.len}
    }else if(mode==='snow'){
      ctx.fillStyle=`rgba(255,255,255,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      p.y+=p.vy;p.x+=p.vx+Math.sin(t*.02+p.x*.01)*.3+windForce*.3;
      if(p.y>H){p.y=-10;p.x=Math.random()*W}
      if(p.x<-50||p.x>W+50){p.x=Math.random()*W;p.y=-10}
    }
  }
  
  if(autoMode){
    autoTimer++;
    if(autoTimer>300){
      modeIndex=(modeIndex+1)%modes.length;
      mode=modes[modeIndex];
      document.getElementById('mode').value=mode;
      init();
      autoTimer=0;
    }
  }
  
  t++;requestAnimationFrame(draw);
}

document.getElementById('mode').onchange=e=>{mode=e.target.value;init();modeIndex=modes.indexOf(mode)};
document.getElementById('timeOfDay').onchange=e=>{timeOfDay=e.target.value};
document.getElementById('wind').oninput=e=>{wind=parseInt(e.target.value)};
document.getElementById('density').oninput=e=>{density=parseInt(e.target.value);init()};
document.getElementById('autoMode').onchange=e=>{autoMode=e.target.checked;autoTimer=0};
document.getElementById('screenshot').onclick=()=>{
  const link=document.createElement('a');
  link.download=`weather_${mode}_${Date.now()}.png`;
  link.href=c.toDataURL();
  link.click();
};

c.addEventListener('mousemove',e=>{mouseX=e.offsetX;mouseY=e.offsetY});
c.addEventListener('touchmove',e=>{
  e.preventDefault();
  const rect=c.getBoundingClientRect();
  mouseX=e.touches[0].clientX-rect.left;
  mouseY=e.touches[0].clientY-rect.top;
},{passive:false});

function cleanup() {}
addEventListener('beforeunload', cleanup);
addEventListener('pagehide', cleanup);
addEventListener('resize',resize);resize();draw();
})();
