// ==========================================
// Pendulum — 振り子ウェーブシミュレーション
// ==========================================
(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const countEl = document.getElementById('count');
  const gravityEl = document.getElementById('gravity');
  const dampingEl = document.getElementById('damping');
  const modeEl = document.getElementById('mode');
  const countVal = document.getElementById('countVal');
  const gravVal = document.getElementById('gravVal');
  const dampVal = document.getElementById('dampVal');

  let w, h, pendulums = [], trails = [];
  let animId = null;

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
  }

  function init() {
    const count = parseInt(countEl.value);
    const mode = modeEl.value;
    pendulums = [];
    trails = [];

    if (mode === 'wave') {
      for (let i = 0; i < count; i++) {
        const len = 100 + i * 12;
        pendulums.push({ angle: Math.PI / 4, vel: 0, len, x: w / 2, y: 80 });
        trails.push([]);
      }
    } else if (mode === 'double') {
      pendulums.push(
        { a1: Math.PI / 2, a2: Math.PI / 2, v1: 0, v2: 0, l1: 120, l2: 120, m1: 10, m2: 10 }
      );
      trails.push([]);
    } else {
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI;
        const len = 80 + Math.random() * 150;
        const x = 100 + (i / count) * (w - 200);
        pendulums.push({ angle, vel: 0, len, x, y: 60 });
        trails.push([]);
      }
    }
  }

  function update() {
    const g = parseInt(gravityEl.value) * 0.001;
    const damp = parseInt(dampingEl.value) / 1000;
    const mode = modeEl.value;

    if (mode === 'double' && pendulums[0]) {
      const p = pendulums[0];
      const { a1, a2, v1, v2, l1, l2, m1, m2 } = p;
      const G = g * 10;
      // Double pendulum equations
      const d = a1 - a2;
      const den1 = (2*m1+m2-m2*Math.cos(2*d));
      const num1 = -G*(2*m1+m2)*Math.sin(a1) - m2*G*Math.sin(a1-2*a2) - 2*Math.sin(d)*m2*(v2*v2*l2+v1*v1*l1*Math.cos(d));
      const num2 = 2*Math.sin(d)*(v1*v1*l1*(m1+m2)+G*(m1+m2)*Math.cos(a1)+v2*v2*l2*m2*Math.cos(d));
      p.v1 += (num1 / (l1 * den1)) * 0.5;
      p.v2 += (num2 / (l2 * den1)) * 0.5;
      p.v1 *= damp; p.v2 *= damp;
      p.a1 += p.v1; p.a2 += p.v2;

      const x1 = w/2 + l1 * Math.sin(p.a1);
      const y1 = 150 + l1 * Math.cos(p.a1);
      const x2 = x1 + l2 * Math.sin(p.a2);
      const y2 = y1 + l2 * Math.cos(p.a2);
      trails[0].push({ x: x2, y: y2 });
      if (trails[0].length > 500) trails[0].shift();
    } else {
      pendulums.forEach((p, i) => {
        const acc = -g / (p.len * 0.01) * Math.sin(p.angle);
        p.vel += acc;
        p.vel *= damp;
        p.angle += p.vel;
        const bx = p.x + Math.sin(p.angle) * p.len;
        const by = p.y + Math.cos(p.angle) * p.len;
        trails[i].push({ x: bx, y: by });
        if (trails[i].length > 200) trails[i].shift();
      });
    }
  }

  function draw() {
    ctx.fillStyle = 'rgba(10,10,26,0.15)';
    ctx.fillRect(0, 0, w, h);

    const mode = modeEl.value;

    if (mode === 'double' && pendulums[0]) {
      const p = pendulums[0];
      const ox = w/2, oy = 150;
      const x1 = ox + p.l1 * Math.sin(p.a1);
      const y1 = oy + p.l1 * Math.cos(p.a1);
      const x2 = x1 + p.l2 * Math.sin(p.a2);
      const y2 = y1 + p.l2 * Math.cos(p.a2);

      // Trail
      if (trails[0].length > 1) {
        for (let i = 1; i < trails[0].length; i++) {
          const t = i / trails[0].length;
          ctx.strokeStyle = `hsla(${t * 360}, 80%, 60%, ${t * 0.8})`;
          ctx.lineWidth = 1 + t * 2;
          ctx.beginPath();
          ctx.moveTo(trails[0][i-1].x, trails[0][i-1].y);
          ctx.lineTo(trails[0][i].x, trails[0][i].y);
          ctx.stroke();
        }
      }

      // Rods
      ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Pivot
      ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI*2); ctx.fill();
      // Bobs
      ctx.fillStyle = '#89b4fa'; ctx.shadowBlur = 12; ctx.shadowColor = '#89b4fa';
      ctx.beginPath(); ctx.arc(x1, y1, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f38ba8'; ctx.shadowColor = '#f38ba8';
      ctx.beginPath(); ctx.arc(x2, y2, 10, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      pendulums.forEach((p, i) => {
        const bx = p.x + Math.sin(p.angle) * p.len;
        const by = p.y + Math.cos(p.angle) * p.len;
        const hue = (i / pendulums.length) * 360;

        // Trail
        const trail = trails[i];
        if (trail.length > 1) {
          for (let j = 1; j < trail.length; j++) {
            const t = j / trail.length;
            ctx.strokeStyle = `hsla(${hue}, 70%, 55%, ${t * 0.3})`;
            ctx.lineWidth = t * 2;
            ctx.beginPath();
            ctx.moveTo(trail[j-1].x, trail[j-1].y);
            ctx.lineTo(trail[j].x, trail[j].y);
            ctx.stroke();
          }
        }

        // Rod
        ctx.strokeStyle = `hsla(${hue}, 30%, 40%, 0.6)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bx, by); ctx.stroke();

        // Bob
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.shadowBlur = 8; ctx.shadowColor = `hsl(${hue}, 70%, 55%)`;
        ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Pivot
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      });
    }

    update();
    animId = requestAnimationFrame(draw);
  }

  countEl.addEventListener('input', () => { countVal.textContent = countEl.value; init(); });
  gravityEl.addEventListener('input', () => { gravVal.textContent = gravityEl.value; });
  dampingEl.addEventListener('input', () => { dampVal.textContent = (parseInt(dampingEl.value)/1000).toFixed(3); });
  modeEl.addEventListener('change', init);
  document.getElementById('resetBtn').addEventListener('click', init);

  window.addEventListener('resize', () => { resize(); init(); });
  function cleanup() { if (animId) cancelAnimationFrame(animId); }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  resize();
  init();
  draw();
})();
