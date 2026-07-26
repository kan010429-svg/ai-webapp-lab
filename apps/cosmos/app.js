// ==========================================
// Cosmos — Procedural Space Generator
// ==========================================
(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const generateBtn = document.getElementById('generateBtn');
  const saveBtn = document.getElementById('saveBtn');
  const densityEl = document.getElementById('density');
  const nebulaEl = document.getElementById('nebula');
  const paletteEl = document.getElementById('palette');
  const seedValueEl = document.getElementById('seedValue');

  const PALETTES = {
    deep: { bg: [2, 2, 12], nebula: [[60, 20, 120], [20, 40, 100], [100, 20, 60]], star: [[200, 220, 255], [255, 240, 200], [180, 200, 255]] },
    warm: { bg: [8, 4, 8], nebula: [[140, 40, 30], [160, 80, 20], [100, 20, 60]], star: [[255, 220, 180], [255, 200, 150], [255, 180, 120]] },
    cool: { bg: [2, 4, 16], nebula: [[20, 60, 140], [10, 80, 120], [40, 20, 100]], star: [[180, 220, 255], [200, 240, 255], [160, 200, 240]] },
    neon: { bg: [4, 2, 12], nebula: [[200, 0, 100], [0, 200, 150], [100, 0, 200]], star: [[255, 100, 200], [100, 255, 200], [200, 100, 255]] },
    pastel: { bg: [12, 8, 16], nebula: [[120, 80, 140], [80, 120, 140], [140, 100, 100]], star: [[255, 220, 230], [220, 230, 255], [230, 255, 220]] }
  };

  let seed = 0;
  let animFrame = null;
  let stars = [];
  let shootingStars = [];
  let time = 0;

  // Simple seeded PRNG (mulberry32)
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function resize() {
    const d = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * d;
    canvas.height = rect.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function generate() {
    seed = Math.floor(Math.random() * 999999);
    seedValueEl.textContent = seed;
    const rng = mulberry32(seed);
    const pal = PALETTES[paletteEl.value];
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const density = Number(densityEl.value);
    const nebulaIntensity = Number(nebulaEl.value) / 100;

    // Generate stars
    stars = [];
    for (let i = 0; i < density; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const size = rng() < 0.02 ? 1.5 + rng() * 2.5 : 0.3 + rng() * 1.2;
      const colorIdx = Math.floor(rng() * pal.star.length);
      const brightness = 0.3 + rng() * 0.7;
      const twinkleSpeed = 0.5 + rng() * 3;
      const twinklePhase = rng() * Math.PI * 2;
      stars.push({ x, y, size, color: pal.star[colorIdx], brightness, twinkleSpeed, twinklePhase });
    }

    // Generate nebula data
    const nebulaData = [];
    const nebulaCount = Math.floor(3 + rng() * 5);
    for (let i = 0; i < nebulaCount; i++) {
      nebulaData.push({
        x: rng() * w, y: rng() * h,
        rx: 80 + rng() * 250, ry: 60 + rng() * 200,
        rotation: rng() * Math.PI * 2,
        color: pal.nebula[Math.floor(rng() * pal.nebula.length)],
        opacity: (0.03 + rng() * 0.08) * nebulaIntensity,
        layers: Math.floor(3 + rng() * 4)
      });
    }

    // Pre-render nebula to offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const octx = offscreen.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    octx.fillStyle = `rgb(${pal.bg[0]},${pal.bg[1]},${pal.bg[2]})`;
    octx.fillRect(0, 0, w, h);

    // Nebulae
    nebulaData.forEach(n => {
      for (let l = 0; l < n.layers; l++) {
        const scale = 1 + l * 0.4;
        octx.save();
        octx.translate(n.x, n.y);
        octx.rotate(n.rotation + l * 0.3);
        const grad = octx.createRadialGradient(0, 0, 0, 0, 0, n.rx * scale);
        const [r, g, b] = n.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},${n.opacity})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${n.opacity * 0.5})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        octx.fillStyle = grad;
        octx.beginPath();
        octx.ellipse(0, 0, n.rx * scale, n.ry * scale, 0, 0, Math.PI * 2);
        octx.fill();
        octx.restore();
      }
    });

    // Store background
    canvas._bgImage = offscreen;

    // Shooting stars
    shootingStars = [];
    time = 0;
  }

  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    time += 0.016;

    // Draw pre-rendered background
    if (canvas._bgImage) {
      ctx.drawImage(canvas._bgImage, 0, 0, w, h);
    }

    // Draw stars with twinkling
    stars.forEach(s => {
      const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      const alpha = s.brightness * (0.5 + twinkle * 0.5);
      const [r, g, b] = s.color;

      if (s.size > 2) {
        // Big stars get a multi-layer glow
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.6})`;
        ctx.shadowBlur = s.size * 6;
        // Cross flare with rotation
        const flareRot = time * 0.1;
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.25})`;
        ctx.lineWidth = 0.5;
        const flareLen = s.size * 4 * twinkle;
        ctx.beginPath();
        ctx.moveTo(s.x - Math.cos(flareRot) * flareLen, s.y - Math.sin(flareRot) * flareLen);
        ctx.lineTo(s.x + Math.cos(flareRot) * flareLen, s.y + Math.sin(flareRot) * flareLen);
        ctx.moveTo(s.x - Math.cos(flareRot + Math.PI/2) * flareLen * 0.6, s.y - Math.sin(flareRot + Math.PI/2) * flareLen * 0.6);
        ctx.lineTo(s.x + Math.cos(flareRot + Math.PI/2) * flareLen * 0.6, s.y + Math.sin(flareRot + Math.PI/2) * flareLen * 0.6);
        ctx.stroke();
        // Diffraction ring
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.08})`;
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 5 * twinkle, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Shooting stars
    if (Math.random() < 0.008) {
      shootingStars.push({
        x: Math.random() * w, y: Math.random() * h * 0.5,
        vx: 3 + Math.random() * 5, vy: 1 + Math.random() * 3,
        life: 1, decay: 0.015 + Math.random() * 0.02,
        len: 30 + Math.random() * 60
      });
    }

    shootingStars = shootingStars.filter(s => {
      s.x += s.vx; s.y += s.vy; s.life -= s.decay;
      if (s.life <= 0) return false;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.len * 0.3, s.y - s.vy * s.len * 0.3);
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * s.len * 0.3, s.y - s.vy * s.len * 0.3);
      ctx.stroke();
      // Sparkle at head
      ctx.fillStyle = `rgba(255,255,255,${s.life * 0.8})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2); ctx.fill();
      return true;
    });

    // Seed HUD
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`seed: ${seed} | ★ ${stars.length}`, 8, h - 8);

    animFrame = requestAnimationFrame(draw);
  }

  generateBtn.addEventListener('click', () => { generate(); });

  saveBtn.addEventListener('click', () => {
    // Render one clean frame without animation
    cancelAnimationFrame(animFrame);
    draw();
    const link = document.createElement('a');
    link.download = `cosmos-${seed}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    animFrame = requestAnimationFrame(draw);
  });

  window.addEventListener('resize', () => { resize(); generate(); });

  resize();
  generate();
  draw();
  
  // Cleanup
  function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars = [];
    shootingStars = [];
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
