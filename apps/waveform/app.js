// ==========================================
// Waveform — Audio-Reactive Visualizer
// Microphone input drives real-time visuals
// ==========================================
(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const micBtn = document.getElementById('micBtn');
  const startBtn = document.getElementById('startBtn');
  const startOverlay = document.getElementById('startOverlay');
  const toolbar = document.getElementById('toolbar');
  const vizModeEl = document.getElementById('vizMode');
  const sensitivityEl = document.getElementById('sensitivity');
  const colorSchemeEl = document.getElementById('colorScheme');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const levelBar = document.getElementById('levelBar');
  const freqInfo = document.getElementById('freqInfo');

  let audioCtx = null;
  let analyser = null;
  let micStream = null;
  let micActive = false;
  let animId = null;
  let w = 0, h = 0;
  let time = 0;
  let mouseX = 0.5, mouseY = 0.5;
  let particles = [];
  let ripples = [];
  let fps = 0, frameCount = 0, lastFpsTime = performance.now();
  let beatPulse = 0;
  let prevBass = 0;

  // Smoothed audio data
  let bass = 0, mid = 0, treble = 0, volume = 0;
  let smoothBass = 0, smoothMid = 0, smoothTreble = 0, smoothVol = 0;

  const COLOR_SCHEMES = {
    spectrum: (t, energy) => `hsl(${(t * 60 + energy * 200) % 360}, 80%, ${45 + energy * 30}%)`,
    ocean: (t, energy) => `hsl(${190 + energy * 40}, ${60 + energy * 30}%, ${30 + energy * 35}%)`,
    fire: (t, energy) => `hsl(${energy * 50}, ${80 + energy * 20}%, ${35 + energy * 35}%)`,
    neon: (t, energy) => `hsl(${(t * 30 + 280) % 360}, 100%, ${50 + energy * 30}%)`,
    mono: (t, energy) => `rgba(255,255,255,${0.1 + energy * 0.7})`
  };

  function resize() {
    const d = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * d;
    canvas.height = rect.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    w = rect.width;
    h = rect.height;
  }

  async function startMic() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      micActive = true;
      micBtn.textContent = 'Mic OFF';
      micBtn.classList.add('active');
      startOverlay.classList.add('hidden');
    } catch (e) {
      alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
    }
  }

  function stopMic() {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    analyser = null;
    micActive = false;
    micBtn.textContent = 'Mic ON';
    micBtn.classList.remove('active');
    bass = mid = treble = volume = 0;
    smoothBass = smoothMid = smoothTreble = smoothVol = 0;
  }

  function analyzeAudio() {
    if (!analyser) return;
    const bufLen = analyser.frequencyBinCount;
    const freq = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(freq);

    const sens = Number(sensitivityEl.value) / 5;

    // Split into frequency bands
    const bassEnd = Math.floor(bufLen * 0.1);
    const midEnd = Math.floor(bufLen * 0.5);

    let bassSum = 0, midSum = 0, trebleSum = 0, total = 0;
    for (let i = 0; i < bufLen; i++) {
      const v = freq[i] / 255;
      total += v;
      if (i < bassEnd) bassSum += v;
      else if (i < midEnd) midSum += v;
      else trebleSum += v;
    }

    bass = (bassSum / bassEnd) * sens;
    mid = (midSum / (midEnd - bassEnd)) * sens;
    treble = (trebleSum / (bufLen - midEnd)) * sens;
    volume = (total / bufLen) * sens;

    // Smooth
    const smooth = 0.15;
    smoothBass += (bass - smoothBass) * smooth;
    smoothMid += (mid - smoothMid) * smooth;
    smoothTreble += (treble - smoothTreble) * smooth;
    smoothVol += (volume - smoothVol) * smooth;

    // UI
    levelBar.style.width = Math.min(100, smoothVol * 100) + '%';
    levelBar.style.background = smoothVol > 0.6 ? '#ef4444' : smoothVol > 0.3 ? '#fbbf24' : '#818cf8';
    freqInfo.textContent = `B:${smoothBass.toFixed(2)} M:${smoothMid.toFixed(2)} T:${smoothTreble.toFixed(2)}`;
  }

  // ==========================================
  // Visualization Modes
  // ==========================================

  function drawOrganic() {
    const colorFn = COLOR_SCHEMES[colorSchemeEl.value];
    const cx = w / 2, cy = h / 2;

    // Breathing background circle
    const breathe = 0.5 + 0.5 * Math.sin(time * 0.5);
    const baseR = Math.min(w, h) * 0.15;
    const r = baseR + smoothBass * baseR * 2 + breathe * 10;

    // Organic blob
    const points = 128;
    for (let layer = 3; layer >= 0; layer--) {
      const layerR = r * (1 + layer * 0.3) + smoothMid * 40 * layer;
      const alpha = 0.08 - layer * 0.015;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise = Math.sin(angle * 3 + time * 2) * smoothBass * 50
                    + Math.sin(angle * 5 - time * 1.5) * smoothMid * 30
                    + Math.sin(angle * 8 + time * 3) * smoothTreble * 20;
        const pr = layerR + noise;
        const px = cx + Math.cos(angle) * pr;
        const py = cy + Math.sin(angle) * pr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = colorFn(time * 0.1, smoothVol * (1 - layer * 0.2));
      ctx.globalAlpha = alpha + smoothVol * 0.1;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Core glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.8);
    grad.addColorStop(0, colorFn(time * 0.1, Math.min(1, smoothVol * 1.5)));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.15 + smoothBass * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Tendrils
    const tendrils = 12;
    for (let i = 0; i < tendrils; i++) {
      const angle = (i / tendrils) * Math.PI * 2 + time * 0.3;
      const len = r + smoothBass * 150 + smoothMid * 80;
      ctx.strokeStyle = colorFn(time * 0.1 + i * 0.1, smoothVol);
      ctx.globalAlpha = 0.15 + smoothVol * 0.2;
      ctx.lineWidth = 1 + smoothBass * 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const cp1x = cx + Math.cos(angle + 0.3) * len * 0.5;
      const cp1y = cy + Math.sin(angle + 0.3) * len * 0.5;
      const endX = cx + Math.cos(angle) * len;
      const endY = cy + Math.sin(angle) * len;
      ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawGeometry() {
    const colorFn = COLOR_SCHEMES[colorSchemeEl.value];
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(w, h) * 0.4;

    // Rotating polygons
    const layers = 6;
    for (let l = 0; l < layers; l++) {
      const sides = 3 + l;
      const r = maxR * (0.2 + l * 0.15) + smoothBass * 60 * (l + 1) / layers;
      const rot = time * (0.2 + l * 0.1) * (l % 2 === 0 ? 1 : -1) + smoothMid * 2;

      ctx.strokeStyle = colorFn(time * 0.05 + l * 0.15, smoothVol * (1 - l * 0.1));
      ctx.lineWidth = 1 + smoothBass * 2;
      ctx.globalAlpha = 0.2 + smoothVol * 0.4 - l * 0.03;

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + rot;
        const wobble = Math.sin(angle * 3 + time * 2) * smoothTreble * 15;
        const px = cx + Math.cos(angle) * (r + wobble);
        const py = cy + Math.sin(angle) * (r + wobble);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Connecting lines to center
      if (smoothVol > 0.15) {
        ctx.globalAlpha = smoothVol * 0.15;
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2 + rot;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Frequency ring
    if (analyser) {
      const freq = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freq);
      const ringR = maxR * 0.85;
      const bins = 64;
      ctx.lineWidth = 2;
      for (let i = 0; i < bins; i++) {
        const angle = (i / bins) * Math.PI * 2 - Math.PI / 2;
        const val = freq[i * 4] / 255;
        const barLen = val * 60 + 2;
        ctx.strokeStyle = colorFn(i / bins, val);
        ctx.globalAlpha = 0.4 + val * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * ringR, cy + Math.sin(angle) * ringR);
        ctx.lineTo(cx + Math.cos(angle) * (ringR + barLen), cy + Math.sin(angle) * (ringR + barLen));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    const colorFn = COLOR_SCHEMES[colorSchemeEl.value];

    // Spawn particles on audio
    const spawnCount = Math.floor(smoothVol * 15 + smoothBass * 10);
    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + smoothBass * 8 + Math.random() * 3;
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * smoothBass * 100,
        y: h / 2 + (Math.random() - 0.5) * smoothBass * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.005 + Math.random() * 0.015,
        size: 1 + smoothBass * 4 + Math.random() * 2,
        hue: Math.random()
      });
    }

    // Update & draw
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // slight gravity
      p.vx *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) return false;

      ctx.fillStyle = colorFn(p.hue + time * 0.05, p.life);
      ctx.globalAlpha = p.life * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;

    // Cap particles
    if (particles.length > 2000) particles.splice(0, particles.length - 2000);

    // Central attractor glow
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 80 + smoothBass * 100);
    grad.addColorStop(0, colorFn(time * 0.1, smoothVol));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.1 + smoothBass * 0.15;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 80 + smoothBass * 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawRipple() {
    const colorFn = COLOR_SCHEMES[colorSchemeEl.value];

    // Spawn ripples on beats
    if (smoothBass > 0.3 && Math.random() < smoothBass * 0.3) {
      ripples.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.4,
        y: h / 2 + (Math.random() - 0.5) * h * 0.4,
        r: 0, maxR: 100 + smoothBass * 300,
        speed: 2 + smoothBass * 6,
        life: 1, hue: Math.random()
      });
    }

    ripples = ripples.filter(rip => {
      rip.r += rip.speed;
      rip.life = 1 - rip.r / rip.maxR;
      if (rip.life <= 0) return false;

      ctx.strokeStyle = colorFn(rip.hue + time * 0.05, rip.life);
      ctx.globalAlpha = rip.life * 0.5;
      ctx.lineWidth = 1 + rip.life * 3;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });
    ctx.globalAlpha = 1;

    if (ripples.length > 50) ripples.splice(0, ripples.length - 50);

    // Waveform line
    if (analyser) {
      const bufLen = analyser.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      analyser.getByteTimeDomainData(data);
      ctx.strokeStyle = colorFn(time * 0.1, smoothVol);
      ctx.lineWidth = 2 + smoothBass * 3;
      ctx.globalAlpha = 0.4 + smoothVol * 0.4;
      ctx.beginPath();
      for (let i = 0; i < bufLen; i++) {
        const x = (i / bufLen) * w;
        const y = (data[i] / 128) * h / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawAurora() {
    const colorFn = COLOR_SCHEMES[colorSchemeEl.value];

    // Multiple aurora bands
    const bands = 5;
    for (let b = 0; b < bands; b++) {
      const baseY = h * (0.2 + b * 0.12);
      const points = 80;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const t2 = i / points;
        const x = t2 * w;
        const wave1 = Math.sin(t2 * 4 + time * 0.8 + b * 1.5) * (30 + smoothBass * 80);
        const wave2 = Math.sin(t2 * 7 - time * 0.5 + b) * (15 + smoothMid * 40);
        const wave3 = Math.sin(t2 * 12 + time * 1.2) * smoothTreble * 25;
        const y = baseY + wave1 + wave2 + wave3;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseY - 100, 0, h);
      const c = colorFn(time * 0.05 + b * 0.2, smoothVol * (1 - b * 0.15));
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.3, c);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.06 + smoothVol * 0.08;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Stars
    for (let i = 0; i < 3; i++) {
      const sx = ((i * 7919 + time * 10) % w);
      const sy = ((i * 6271 + time * 5) % (h * 0.5));
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 2 + i * 3));
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================
  // Main Loop
  // ==========================================

  function draw() {
    time += 0.016;
    analyzeAudio();

    // FPS counter
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFpsTime = now;
    }

    // Beat detection pulse
    if (smoothBass - prevBass > 0.08 && smoothBass > 0.25) {
      beatPulse = 1;
    }
    prevBass = smoothBass;
    beatPulse *= 0.92;

    // Fade background (creates trail effect)
    ctx.fillStyle = `rgba(2,2,6,${0.15 - smoothVol * 0.05})`;
    ctx.fillRect(0, 0, w, h);

    // Beat pulse border flash
    if (beatPulse > 0.05) {
      const colorFn = COLOR_SCHEMES[colorSchemeEl.value];
      ctx.save();
      ctx.strokeStyle = colorFn(time * 0.1, beatPulse);
      ctx.globalAlpha = beatPulse * 0.4;
      ctx.lineWidth = 3 + beatPulse * 6;
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();
    }

    const mode = vizModeEl.value;
    switch (mode) {
      case 'organic': drawOrganic(); break;
      case 'geometry': drawGeometry(); break;
      case 'particles': drawParticles(); break;
      case 'ripple': drawRipple(); break;
      case 'aurora': drawAurora(); break;
    }

    // Mouse cursor glow
    const mx = mouseX * w, my = mouseY * h;
    const cursorGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 40 + smoothVol * 30);
    cursorGrad.addColorStop(0, `rgba(129,140,248,${0.05 + smoothVol * 0.1})`);
    cursorGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cursorGrad;
    ctx.beginPath();
    ctx.arc(mx, my, 40 + smoothVol * 30, 0, Math.PI * 2);
    ctx.fill();

    // FPS HUD
    const fpsColor = fps >= 50 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';
    ctx.save();
    ctx.font = '11px monospace';
    ctx.fillStyle = fpsColor;
    ctx.globalAlpha = 0.6;
    ctx.fillText(`${fps} FPS`, 10, h - 10);
    ctx.restore();

    animId = requestAnimationFrame(draw);
  }

  // ==========================================
  // Events
  // ==========================================

  micBtn.addEventListener('click', () => { if (micActive) stopMic(); else startMic(); });
  startBtn.addEventListener('click', startMic);

  fullscreenBtn.addEventListener('click', () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
      toolbar.classList.add('hidden');
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      toolbar.classList.remove('hidden');
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) toolbar.classList.remove('hidden');
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
  });

  // Show toolbar on mouse move to top
  document.addEventListener('mousemove', (e) => {
    if (document.fullscreenElement && e.clientY < 60) {
      toolbar.classList.remove('hidden');
    } else if (document.fullscreenElement && e.clientY > 100) {
      toolbar.classList.add('hidden');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); if (micActive) stopMic(); else startMic(); }
    if (e.code === 'KeyF') fullscreenBtn.click();
    if (e.code === 'Digit1') vizModeEl.value = 'organic';
    if (e.code === 'Digit2') vizModeEl.value = 'geometry';
    if (e.code === 'Digit3') vizModeEl.value = 'particles';
    if (e.code === 'Digit4') vizModeEl.value = 'ripple';
    if (e.code === 'Digit5') vizModeEl.value = 'aurora';
  });

  window.addEventListener('resize', resize);
  function cleanup() { 
    if (animId) cancelAnimationFrame(animId);
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (audioCtx) audioCtx.close();
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  resize();
  draw();
})();
