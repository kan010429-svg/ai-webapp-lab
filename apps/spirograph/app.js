(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const els = { R: 'R', r: 'r', d: 'd', speed: 'speed', color: 'colorMode' };
  const get = id => document.getElementById(id);

  let W, H, t = 0, prevX, prevY, hue = 0;
  const resize = () => {
    W = canvas.width = innerWidth; H = canvas.height = innerHeight - 55;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
  };
  resize(); addEventListener('resize', resize);

  get('clearBtn').onclick = () => { t = 0; ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H); prevX = prevY = undefined; };
  get('saveBtn').onclick = () => { const a = document.createElement('a'); a.download = 'spirograph.png'; a.href = canvas.toDataURL(); a.click(); };

  function getColor() {
    const mode = get('colorMode').value;
    switch (mode) {
      case 'rainbow': hue = (hue + 0.5) % 360; return `hsl(${hue},80%,60%)`;
      case 'gradient': return `hsl(${(t * 0.1) % 360},70%,55%)`;
      case 'mono': return '#89b4fa';
      case 'neon': return `hsl(${(t * 0.3) % 360},100%,70%)`;
    }
  }

  function draw() {
    const R = +get('R').value, r = +get('r').value, d = +get('d').value;
    const spd = +get('speed').value;
    const cx = W / 2, cy = H / 2;

    for (let i = 0; i < spd; i++) {
      const angle = t * 0.02;
      const x = cx + (R - r) * Math.cos(angle) + d * Math.cos(((R - r) / r) * angle);
      const y = cy + (R - r) * Math.sin(angle) - d * Math.sin(((R - r) / r) * angle);

      if (prevX !== undefined) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = getColor();
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      prevX = x; prevY = y;
      t++;
    }

    requestAnimationFrame(draw);
  }
  
  function cleanup() {}
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  draw();
})();
