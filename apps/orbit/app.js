(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const presetEl = document.getElementById('preset');
  const speedEl = document.getElementById('speed');
  const trailsEl = document.getElementById('trails');
  const infoEl = document.getElementById('info');
  const G = 500;
  let W, H, bodies = [], dt;

  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight - 50; };
  resize(); addEventListener('resize', resize);

  class Body {
    constructor(x, y, vx, vy, mass, color, name) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.mass = mass; this.color = color; this.name = name;
      this.trail = []; this.r = Math.max(3, Math.log(mass) * 3);
    }
  }

  const presets = {
    solar: () => {
      const cx = W / 2, cy = H / 2;
      return [
        new Body(cx, cy, 0, 0, 1000, '#ffdd44', '太陽'),
        new Body(cx + 80, cy, 0, -2.5, 1, '#aaaaaa', '水星'),
        new Body(cx + 130, cy, 0, -2, 3, '#e8a040', '金星'),
        new Body(cx + 180, cy, 0, -1.7, 4, '#4488ff', '地球'),
        new Body(cx + 240, cy, 0, -1.45, 2, '#cc4422', '火星'),
        new Body(cx + 340, cy, 0, -1.2, 50, '#ddaa66', '木星'),
      ];
    },
    binary: () => {
      const cx = W / 2, cy = H / 2;
      return [
        new Body(cx - 60, cy, 0, -1.5, 500, '#ff6b6b', 'Star A'),
        new Body(cx + 60, cy, 0, 1.5, 500, '#89b4fa', 'Star B'),
        new Body(cx + 200, cy, 0, -2.2, 1, '#a6e3a1', 'Planet'),
      ];
    },
    trojan: () => {
      const cx = W / 2, cy = H / 2;
      const bs = [new Body(cx, cy, 0, 0, 800, '#ffdd44', 'Star')];
      const r = 180, v = Math.sqrt(G * 800 / r) * 0.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        bs.push(new Body(cx + r * Math.cos(a), cy + r * Math.sin(a), -v * Math.sin(a), v * Math.cos(a), 2, `hsl(${i * 45},70%,65%)`, `T${i}`));
      }
      return bs;
    },
    figure8: () => {
      const cx = W / 2, cy = H / 2, s = 80;
      return [
        new Body(cx - s, cy, 0, -1.2, 200, '#ff6b6b', 'A'),
        new Body(cx + s, cy, 0, 1.2, 200, '#89b4fa', 'B'),
        new Body(cx, cy - s * 0.6, 1.2, 0, 200, '#a6e3a1', 'C'),
      ];
    }
  };

  function init() {
    bodies = presets[presetEl.value]();
  }

  presetEl.onchange = init;
  document.getElementById('resetBtn').onclick = init;
  init();

  function update() {
    dt = +speedEl.value * 0.01;
    for (let step = 0; step < 4; step++) {
      for (let i = 0; i < bodies.length; i++) {
        let ax = 0, ay = 0;
        for (let j = 0; j < bodies.length; j++) {
          if (i === j) continue;
          const dx = bodies[j].x - bodies[i].x;
          const dy = bodies[j].y - bodies[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 5;
          const f = G * bodies[j].mass / (dist * dist);
          ax += f * dx / dist;
          ay += f * dy / dist;
        }
        bodies[i].vx += ax * dt;
        bodies[i].vy += ay * dt;
      }
      for (const b of bodies) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 600) b.trail.shift();
      }
    }
  }

  function draw() {
    if (trailsEl.checked) {
      ctx.fillStyle = 'rgba(5,5,16,0.08)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, W, H);
    }

    for (const b of bodies) {
      // Trail
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = b.color + '40';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Body
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // Glow
      const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
      grd.addColorStop(0, b.color + '40');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    infoEl.textContent = `Bodies: ${bodies.length} | Speed: ${speedEl.value}x`;
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
  
  // Cleanup
  function cleanup() {
    bodies = [];
    ctx.clearRect(0, 0, W, H);
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
