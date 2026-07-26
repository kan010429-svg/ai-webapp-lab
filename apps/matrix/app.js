// ==========================================
// Matrix Rain — デジタルレインエフェクト
// ==========================================
(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const speedEl = document.getElementById('speed');
  const densityEl = document.getElementById('density');
  const charsetEl = document.getElementById('charset');
  const colorEl = document.getElementById('color');
  const audio = new (window.AudioContext || window.webkitAudioContext)();
  function beep(f, d) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.connect(g); g.connect(audio.destination);
    o.frequency.value = f; g.gain.setValueAtTime(0.02, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + d);
    o.start(); o.stop(audio.currentTime + d);
  }

  const CHARSETS = {
    katakana: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
    binary: '01',
    hex: '0123456789ABCDEF',
    kanji: '夢幻影光闇風雷火水土星月日空海山川森花鳥魚龍虎',
  };

  const COLOR_SCHEMES = {
    green: { head: '#fff', body: '#0f0', tail: '#050' },
    blue: { head: '#fff', body: '#4af', tail: '#024' },
    red: { head: '#fff', body: '#f44', tail: '#400' },
    purple: { head: '#fff', body: '#c6f', tail: '#306' },
    rainbow: null,
  };

  let w, h, columns, drops;
  let fontSize = 14;

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    columns = Math.floor(w / fontSize);
    initDrops();
  }

  function initDrops() {
    const density = parseInt(densityEl.value);
    drops = [];
    for (let i = 0; i < columns; i++) {
      if (Math.random() * 30 < density) {
        drops.push({
          x: i, y: Math.random() * -50,
          speed: 0.3 + Math.random() * 0.7,
          length: 8 + Math.floor(Math.random() * 20),
          chars: [],
        });
      }
    }
  }

  function getChar() {
    const chars = CHARSETS[charsetEl.value];
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function draw() {
    const speed = parseInt(speedEl.value);
    const scheme = COLOR_SCHEMES[colorEl.value];

    // Fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fontSize}px monospace`;

    for (const drop of drops) {
      drop.y += drop.speed * speed * 0.15;

      // Maintain char trail
      if (Math.random() < 0.4) drop.chars.unshift(getChar());
      if (drop.chars.length > drop.length) drop.chars.pop();

      for (let j = 0; j < drop.chars.length; j++) {
        const py = (drop.y - j) * fontSize;
        if (py < -fontSize || py > h + fontSize) continue;

        const t = j / drop.length;
        if (scheme) {
          if (j === 0) {
            ctx.fillStyle = scheme.head;
            ctx.shadowBlur = 10;
            ctx.shadowColor = scheme.body;
          } else {
            const alpha = 1 - t;
            ctx.shadowBlur = 0;
            if (t < 0.3) ctx.fillStyle = scheme.body;
            else ctx.fillStyle = scheme.tail;
            ctx.globalAlpha = alpha;
          }
        } else {
          // Rainbow
          const hue = (drop.x * 10 + drop.y * 5 + j * 15) % 360;
          ctx.fillStyle = j === 0 ? '#fff' : `hsl(${hue}, 80%, ${50 - t * 30}%)`;
          ctx.shadowBlur = j === 0 ? 10 : 0;
          ctx.shadowColor = `hsl(${hue}, 80%, 50%)`;
          ctx.globalAlpha = 1 - t;
        }

        // Random char flicker
        const ch = Math.random() < 0.02 ? getChar() : drop.chars[j];
        ctx.fillText(ch, drop.x * fontSize, py);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Reset when off screen
      if ((drop.y - drop.length) * fontSize > h) {
        drop.y = Math.random() * -20;
        drop.speed = 0.3 + Math.random() * 0.7;
        drop.chars = [];
      }
    }

    // Spawn new drops
    const density = parseInt(densityEl.value);
    if (Math.random() < density * 0.01) {
      drops.push({
        x: Math.floor(Math.random() * columns),
        y: Math.random() * -10,
        speed: 0.3 + Math.random() * 0.7,
        length: 8 + Math.floor(Math.random() * 20),
        chars: [],
      });
    }

    // Cap drops
    if (drops.length > columns * 2) drops.splice(0, drops.length - columns);

    requestAnimationFrame(draw);
  }

  densityEl.addEventListener('input', initDrops);
  charsetEl.addEventListener('change', () => beep(400, 0.05));
  colorEl.addEventListener('change', () => beep(450, 0.05));
  window.addEventListener('resize', resize);
  resize();
  draw();
  function cleanup() { audio.close(); }
  addEventListener('beforeunload', cleanup);
  addEventListener('pagehide', cleanup);
})();
