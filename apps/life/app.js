// ==========================================
// Life — Conway's Game of Life
// High-performance cellular automaton
// ==========================================

(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = document.getElementById('playBtn');
  const stepBtn = document.getElementById('stepBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randomBtn = document.getElementById('randomBtn');
  const speedSlider = document.getElementById('speedSlider');
  const speedValueEl = document.getElementById('speedValue');
  const patternSelect = document.getElementById('patternSelect');
  const genValueEl = document.getElementById('genValue');
  const popValueEl = document.getElementById('popValue');
  const statsBtn = document.getElementById('statsBtn');
  const statsModal = document.getElementById('statsModal');
  const closeStats = document.getElementById('closeStats');

  const CELL_SIZE = 8;
  const ALIVE_COLOR = '#10b981';
  const GRID_COLOR = 'rgba(255,255,255,0.03)';
  const TRAIL_COLOR = 'rgba(16,185,129,0.06)';

  let cols, rows;
  let grid, nextGrid, trailGrid;
  let running = false;
  let generation = 0;
  let population = 0;
  let intervalId = null;
  let isDrawing = false;
  let drawValue = 1;
  let selectedPattern = 'draw';
  
  const audio = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + duration);
    osc.start();
    osc.stop(audio.currentTime + duration);
  }
  
  const stats = JSON.parse(localStorage.getItem('lifeStats') || '{"maxGen":0,"maxPop":0,"totalGens":0,"sessions":0}');

  // --- Patterns ---
  const PATTERNS = {
    glider: [[0,1],[1,2],[2,0],[2,1],[2,2]],
    lwss: [[0,1],[0,3],[1,4],[2,0],[2,4],[3,1],[3,2],[3,3],[3,4]],
    pulsar: (function() {
      const base = [[2,0],[3,0],[4,0],[0,2],[0,3],[0,4],[5,2],[5,3],[5,4],[2,5],[3,5],[4,5]];
      const full = [];
      for (const [r,c] of base) {
        full.push([r,c],[r,12-c],[12-r,c],[12-r,12-c]);
      }
      return [...new Set(full.map(p => p.join(',')))].map(s => s.split(',').map(Number));
    })(),
    gosper: [
      [0,24],[1,22],[1,24],[2,12],[2,13],[2,20],[2,21],[2,34],[2,35],
      [3,11],[3,15],[3,20],[3,21],[3,34],[3,35],[4,0],[4,1],[4,10],
      [4,16],[4,20],[4,21],[5,0],[5,1],[5,10],[5,14],[5,16],[5,17],
      [5,22],[5,24],[6,10],[6,16],[6,24],[7,11],[7,15],[8,12],[8,13]
    ],
    pentadecathlon: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0]].map(([r,c]) => {
      if (r === 1 || r === 8) return [[r,-1],[r,1]];
      return [[r,0]];
    }).flat(),
    rpentomino: [[0,1],[0,2],[1,0],[1,1],[2,1]],
    acorn: [[0,1],[1,3],[2,0],[2,1],[2,4],[2,5],[2,6]],
  };

  // --- Grid ---
  function createGrid() {
    return new Uint8Array(cols * rows);
  }

  function getCell(g, x, y) {
    if (x < 0) x += cols;
    if (x >= cols) x -= cols;
    if (y < 0) y += rows;
    if (y >= rows) y -= rows;
    return g[y * cols + x];
  }

  function setCell(g, x, y, val) {
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      g[y * cols + x] = val;
    }
  }

  function countNeighbors(g, x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        count += getCell(g, x + dx, y + dy);
      }
    }
    return count;
  }

  function step() {
    population = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const alive = grid[y * cols + x];
        const neighbors = countNeighbors(grid, x, y);
        let next = 0;
        if (alive) {
          next = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          next = neighbors === 3 ? 1 : 0;
        }
        nextGrid[y * cols + x] = next;

        if (alive) {
          trailGrid[y * cols + x] = Math.min(255, trailGrid[y * cols + x] + 30);
        } else if (trailGrid[y * cols + x] > 0) {
          trailGrid[y * cols + x] = Math.max(0, trailGrid[y * cols + x] - 2);
        }

        population += next;
      }
    }

    [grid, nextGrid] = [nextGrid, grid];
    generation++;
  }

  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Trail effect with color
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const trail = trailGrid[y * cols + x];
        if (trail > 0 && !grid[y * cols + x]) {
          const t = trail / 255;
          const r = Math.round(16 + t * 20);
          const g = Math.round(185 - t * 80);
          const b = Math.round(129 + t * 50);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${t * 0.15})`;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Alive cells with neighbor-based coloring and glow
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y * cols + x]) {
          const neighbors = countNeighbors(grid, x, y);
          const brightness = 0.6 + Math.min(neighbors, 4) / 4 * 0.4;
          // Color shift based on neighbors: green → cyan → blue
          const hue = 150 + neighbors * 10;
          const sat = 60 + neighbors * 5;
          const light = 40 + brightness * 20;
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${brightness})`;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);

          // Glow for cells with many neighbors (stable structures)
          if (neighbors >= 3) {
            ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.08)`;
            ctx.fillRect(x * CELL_SIZE - 1, y * CELL_SIZE - 1, CELL_SIZE + 1, CELL_SIZE + 1);
          }
        }
      }
    }

    // Stats HUD
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(4, 4, 180, 18);
    ctx.fillStyle = '#e0e0f0';
    ctx.font = '10px monospace';
    ctx.fillText(`Gen:${generation.toLocaleString()} Pop:${population.toLocaleString()} ${running ? '▶' : '⏸'}`, 8, 16);

    genValueEl.textContent = generation.toLocaleString();
    popValueEl.textContent = population.toLocaleString();
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const newCols = Math.floor(rect.width / CELL_SIZE);
    const newRows = Math.floor(rect.height / CELL_SIZE);

    if (newCols !== cols || newRows !== rows) {
      const oldGrid = grid;
      const oldCols = cols;
      const oldRows = rows;

      cols = newCols;
      rows = newRows;
      grid = createGrid();
      nextGrid = createGrid();
      trailGrid = new Uint8Array(cols * rows);

      if (oldGrid) {
        const minCols = Math.min(cols, oldCols || 0);
        const minRows = Math.min(rows, oldRows || 0);
        for (let y = 0; y < minRows; y++) {
          for (let x = 0; x < minCols; x++) {
            grid[y * cols + x] = oldGrid[y * oldCols + x];
          }
        }
      }
    }

    draw();
  }

  // --- Simulation ---
  function tick() {
    step();
    draw();
  }

  function startSim() {
    if (running) return;
    running = true;
    playBtn.textContent = '⏸ 停止';
    const fps = Number(speedSlider.value);
    intervalId = setInterval(tick, 1000 / fps);
  }

  function stopSim() {
    running = false;
    clearInterval(intervalId);
    intervalId = null;
    playBtn.textContent = '▶ 開始';
  }

  function clearGrid() {
    stopSim();
    if (generation > 0) {
      stats.totalGens += generation;
      stats.sessions++;
      if (generation > stats.maxGen) stats.maxGen = generation;
      if (population > stats.maxPop) stats.maxPop = population;
      localStorage.setItem('lifeStats', JSON.stringify(stats));
    }
    generation = 0;
    population = 0;
    grid.fill(0);
    trailGrid.fill(0);
    draw();
    beep(300, 0.1);
  }

  function randomize() {
    stopSim();
    generation = 0;
    trailGrid.fill(0);
    population = 0;
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < 0.25 ? 1 : 0;
      population += grid[i];
    }
    draw();
    beep(400, 0.1);
  }

  function placePattern(centerX, centerY, patternName) {
    const pattern = PATTERNS[patternName];
    if (!pattern) return;

    for (const [dy, dx] of pattern) {
      setCell(grid, centerX + dx, centerY + dy, 1);
    }
    draw();
    beep(500, 0.05);
  }

  // --- Mouse ---
  function getCellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    return { x, y };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const { x, y } = getCellFromEvent(e);

    if (selectedPattern !== 'draw') {
      placePattern(x, y, selectedPattern);
      return;
    }

    isDrawing = true;
    drawValue = grid[y * cols + x] ? 0 : 1;
    setCell(grid, x, y, drawValue);
    draw();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    const { x, y } = getCellFromEvent(e);
    setCell(grid, x, y, drawValue);
    draw();
  });

  canvas.addEventListener('pointerup', () => { isDrawing = false; });
  canvas.addEventListener('pointerleave', () => { isDrawing = false; });

  // --- Events ---
  playBtn.addEventListener('click', () => {
    if (running) stopSim(); else { startSim(); beep(600, 0.1); }
  });

  stepBtn.addEventListener('click', () => {
    stopSim();
    tick();
  });

  clearBtn.addEventListener('click', clearGrid);
  randomBtn.addEventListener('click', randomize);

  speedSlider.addEventListener('input', () => {
    speedValueEl.textContent = speedSlider.value;
    if (running) {
      stopSim();
      startSim();
    }
  });

  patternSelect.addEventListener('change', () => {
    selectedPattern = patternSelect.value;
  });
  
  statsBtn.addEventListener('click', () => {
    document.getElementById('statMaxGen').textContent = stats.maxGen.toLocaleString();
    document.getElementById('statMaxPop').textContent = stats.maxPop.toLocaleString();
    document.getElementById('statTotalGens').textContent = stats.totalGens.toLocaleString();
    document.getElementById('statSessions').textContent = stats.sessions.toLocaleString();
    statsModal.style.display = 'flex';
  });
  
  closeStats.addEventListener('click', () => {
    statsModal.style.display = 'none';
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); if (running) stopSim(); else startSim(); }
    if (e.code === 'KeyC') clearGrid();
    if (e.code === 'KeyR') randomize();
    if (e.code === 'KeyN') { stopSim(); tick(); }
  });

  window.addEventListener('resize', resize);

  // --- Init ---
  cols = 0;
  rows = 0;
  grid = new Uint8Array(0);
  nextGrid = new Uint8Array(0);
  trailGrid = new Uint8Array(0);

  resize();

  // Place some initial patterns
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  placePattern(cx, cy, 'rpentomino');
  placePattern(cx - 20, cy - 15, 'glider');
  placePattern(cx + 15, cy + 10, 'glider');
  placePattern(cx - 25, cy + 10, 'lwss');
  
  // クリーンアップ
  function cleanup() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    audio.close();
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
