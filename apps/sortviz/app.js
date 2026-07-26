// ==========================================
// SortViz — Sorting Algorithm Visualizer
// Enhanced: glow bars, sound feedback, rainbow sorted, particle burst
// ==========================================

(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const algoSelect = document.getElementById('algoSelect');
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');
  const startBtn = document.getElementById('startBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const comparisonsEl = document.getElementById('comparisons');
  const swapsEl = document.getElementById('swaps');
  const elapsedEl = document.getElementById('elapsed');
  const timeComplexity = document.getElementById('timeComplexity');
  const spaceComplexity = document.getElementById('spaceComplexity');

  const COLORS = {
    bar: '#6366f1',
    compare: '#f59e0b',
    swap: '#ef4444',
    sorted: '#22c55e',
    pivot: '#ec4899',
    active: '#06b6d4',
  };

  const ALGO_INFO = {
    bubble:    { time: 'O(n²)',      space: 'O(1)' },
    selection: { time: 'O(n²)',      space: 'O(1)' },
    insertion: { time: 'O(n²)',      space: 'O(1)' },
    merge:     { time: 'O(n log n)', space: 'O(n)' },
    quick:     { time: 'O(n log n)', space: 'O(log n)' },
    heap:      { time: 'O(n log n)', space: 'O(1)' },
    shell:     { time: 'O(n^1.3)',   space: 'O(1)' },
    radix:     { time: 'O(nk)',      space: 'O(n+k)' },
  };

  let arr = [];
  let states = [];
  let running = false;
  let aborted = false;
  let comparisons = 0;
  let swapCount = 0;
  let startTime = 0;
  let particles = [];

  // Audio context for sort sounds
  let audioCtx = null;
  function playTone(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch(e) {
      // Audio context may not be available or suspended
      console.warn('Audio playback failed:', e.message);
    }
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 1 + Math.random() * 2,
        color
      });
    }
  }

  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    const n = arr.length;
    if (n === 0) return;

    const gap = Math.max(1, Math.floor(w / n * 0.15));
    const barW = Math.max(1, (w - gap * (n + 1)) / n);
    const maxVal = Math.max(...arr);

    for (let i = 0; i < n; i++) {
      const barH = (arr[i] / maxVal) * (h - 30);
      const x = gap + i * (barW + gap);
      const y = h - barH;

      let color = COLORS.bar;
      if (states[i] === 'compare') color = COLORS.compare;
      else if (states[i] === 'swap') color = COLORS.swap;
      else if (states[i] === 'sorted') {
        // Rainbow gradient for sorted bars
        const hue = (i / n) * 120 + 100;
        color = `hsl(${hue}, 70%, 55%)`;
      }
      else if (states[i] === 'pivot') color = COLORS.pivot;
      else if (states[i] === 'active') color = COLORS.active;

      // Glow behind bar
      if (states[i] === 'compare' || states[i] === 'swap' || states[i] === 'pivot') {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }

      // Gradient bar
      const grad = ctx.createLinearGradient(x, y, x, h);
      grad.addColorStop(0, color);
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, adjustBrightness(color, -50));
      ctx.fillStyle = grad;

      const radius = Math.min(3, barW / 2);
      roundRect(ctx, x, y, barW, barH, radius);
      ctx.shadowBlur = 0;

      // Top highlight
      if (barW > 3) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 1, y, barW - 2, Math.min(3, barH));
      }
    }

    // Particles
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
      if (p.life <= 0) return false;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;

    // HUD overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(4, 4, 220, 18);
    ctx.fillStyle = '#e0e0f0';
    ctx.font = '10px monospace';
    const algo = algoSelect.value;
    const info = ALGO_INFO[algo];
    ctx.fillText(`${algo.toUpperCase()} | ${info.time} | cmp:${comparisons} swp:${swapCount}`, 8, 16);
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (h < r * 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function adjustBrightness(hex, amt) {
    // Handle hsl strings
    if (hex.startsWith('hsl')) return hex;
    let r = parseInt(hex.slice(1, 3), 16) + amt;
    let g = parseInt(hex.slice(3, 5), 16) + amt;
    let b = parseInt(hex.slice(5, 7), 16) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function generateArray() {
    const n = Number(sizeSlider.value);
    arr = Array.from({ length: n }, (_, i) => i + 1);
    shuffle(arr);
    states = Array(n).fill('default');
    comparisons = 0;
    swapCount = 0;
    particles = [];
    updateStats();
    draw();
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  function getDelay() {
    const speed = Number(speedSlider.value);
    return Math.max(1, 200 - speed * 2);
  }

  function sleep(ms) {
    return new Promise(resolve => {
      if (aborted) { resolve(); return; }
      setTimeout(resolve, ms);
    });
  }

  async function visualize(indices, state, delay = true) {
    if (aborted) return;
    states.fill('default');
    for (const idx of indices) {
      if (idx >= 0 && idx < states.length) states[idx] = state;
    }
    // Sound feedback
    if (indices.length > 0 && arr.length <= 200) {
      const val = arr[indices[0]] || 1;
      const freq = 200 + (val / arr.length) * 800;
      playTone(freq, 0.05);
    }
    draw();
    if (delay) await sleep(getDelay());
  }

  function updateStats() {
    comparisonsEl.textContent = comparisons.toLocaleString();
    swapsEl.textContent = swapCount.toLocaleString();
    const ms = running ? Date.now() - startTime : (startTime ? Date.now() - startTime : 0);
    elapsedEl.textContent = ms + 'ms';
  }

  // --- Sorting Algorithms ---
  async function bubbleSort() {
    const n = arr.length;
    for (let i = 0; i < n - 1 && !aborted; i++) {
      for (let j = 0; j < n - i - 1 && !aborted; j++) {
        comparisons++;
        await visualize([j, j + 1], 'compare');
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swapCount++;
          await visualize([j, j + 1], 'swap');
        }
        updateStats();
      }
      states[n - i - 1] = 'sorted';
    }
  }

  async function selectionSort() {
    const n = arr.length;
    for (let i = 0; i < n - 1 && !aborted; i++) {
      let minIdx = i;
      states[i] = 'active';
      for (let j = i + 1; j < n && !aborted; j++) {
        comparisons++;
        await visualize([minIdx, j], 'compare');
        if (arr[j] < arr[minIdx]) minIdx = j;
        updateStats();
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        swapCount++;
        await visualize([i, minIdx], 'swap');
      }
      states[i] = 'sorted';
    }
  }

  async function insertionSort() {
    const n = arr.length;
    for (let i = 1; i < n && !aborted; i++) {
      let key = arr[i];
      let j = i - 1;
      await visualize([i], 'active');
      while (j >= 0 && !aborted) {
        comparisons++;
        await visualize([j, j + 1], 'compare');
        if (arr[j] <= key) break;
        arr[j + 1] = arr[j];
        swapCount++;
        j--;
        updateStats();
      }
      arr[j + 1] = key;
      await visualize([j + 1], 'swap');
    }
  }

  async function mergeSort() {
    async function merge(l, m, r) {
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      while (i < left.length && j < right.length && !aborted) {
        comparisons++;
        await visualize([l + i, m + 1 + j], 'compare');
        if (left[i] <= right[j]) { arr[k] = left[i]; i++; }
        else { arr[k] = right[j]; j++; swapCount++; }
        await visualize([k], 'swap');
        k++;
        updateStats();
      }
      while (i < left.length && !aborted) { arr[k] = left[i]; i++; k++; await visualize([k - 1], 'active'); }
      while (j < right.length && !aborted) { arr[k] = right[j]; j++; k++; await visualize([k - 1], 'active'); }
    }
    async function sort(l, r) {
      if (l >= r || aborted) return;
      const m = Math.floor((l + r) / 2);
      await sort(l, m);
      await sort(m + 1, r);
      await merge(l, m, r);
    }
    await sort(0, arr.length - 1);
  }

  async function quickSort() {
    async function partition(lo, hi) {
      const pivot = arr[hi];
      await visualize([hi], 'pivot');
      let i = lo - 1;
      for (let j = lo; j < hi && !aborted; j++) {
        comparisons++;
        await visualize([j, hi], 'compare');
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          swapCount++;
          await visualize([i, j], 'swap');
        }
        updateStats();
      }
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
      swapCount++;
      await visualize([i + 1], 'sorted');
      return i + 1;
    }
    async function sort(lo, hi) {
      if (lo >= hi || aborted) return;
      const p = await partition(lo, hi);
      await sort(lo, p - 1);
      await sort(p + 1, hi);
    }
    await sort(0, arr.length - 1);
  }

  async function heapSort() {
    const n = arr.length;
    async function heapify(size, i) {
      let largest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < size) { comparisons++; if (arr[l] > arr[largest]) largest = l; }
      if (r < size) { comparisons++; if (arr[r] > arr[largest]) largest = r; }
      if (largest !== i && !aborted) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        swapCount++;
        await visualize([i, largest], 'swap');
        updateStats();
        await heapify(size, largest);
      }
    }
    for (let i = Math.floor(n / 2) - 1; i >= 0 && !aborted; i--) await heapify(n, i);
    for (let i = n - 1; i > 0 && !aborted; i--) {
      [arr[0], arr[i]] = [arr[i], arr[0]];
      swapCount++;
      await visualize([0, i], 'swap');
      states[i] = 'sorted';
      await heapify(i, 0);
      updateStats();
    }
  }

  async function shellSort() {
    const n = arr.length;
    for (let gap = Math.floor(n / 2); gap > 0 && !aborted; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n && !aborted; i++) {
        const temp = arr[i]; let j = i;
        while (j >= gap && !aborted) {
          comparisons++;
          await visualize([j, j - gap], 'compare');
          if (arr[j - gap] <= temp) break;
          arr[j] = arr[j - gap]; swapCount++; j -= gap; updateStats();
        }
        arr[j] = temp;
        await visualize([j], 'swap');
      }
    }
  }

  async function radixSort() {
    const max = Math.max(...arr);
    let exp = 1;
    while (Math.floor(max / exp) > 0 && !aborted) {
      const output = Array(arr.length).fill(0);
      const count = Array(10).fill(0);
      for (let i = 0; i < arr.length && !aborted; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        count[digit]++; comparisons++;
        await visualize([i], 'active', arr.length > 80 ? false : true);
      }
      for (let i = 1; i < 10; i++) count[i] += count[i - 1];
      for (let i = arr.length - 1; i >= 0 && !aborted; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i]; count[digit]--; swapCount++;
      }
      for (let i = 0; i < arr.length && !aborted; i++) {
        arr[i] = output[i];
        await visualize([i], 'swap');
        updateStats();
      }
      exp *= 10;
    }
  }

  const ALGORITHMS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort, quick: quickSort, heap: heapSort, shell: shellSort, radix: radixSort };

  async function markAllSorted() {
    for (let i = 0; i < arr.length; i++) {
      states[i] = 'sorted';
      // Particle burst on each bar
      const n = arr.length;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const gap = Math.max(1, Math.floor(w / n * 0.15));
      const barW = Math.max(1, (w - gap * (n + 1)) / n);
      const maxVal = Math.max(...arr);
      const barH = (arr[i] / maxVal) * (h - 30);
      const x = gap + i * (barW + gap) + barW / 2;
      const y = h - barH;
      const hue = (i / n) * 120 + 100;
      spawnParticles(x, y, `hsl(${hue}, 70%, 55%)`, 2);
      playTone(200 + (i / n) * 800, 0.04);
      draw();
      await sleep(Math.max(2, 500 / arr.length));
    }
  }

  async function start() {
    if (running) { aborted = true; return; }
    running = true; aborted = false;
    comparisons = 0; swapCount = 0; particles = [];
    startTime = Date.now();
    startBtn.textContent = 'Stop';
    shuffleBtn.disabled = true; algoSelect.disabled = true; sizeSlider.disabled = true;
    let statsInterval = setInterval(updateStats, 50);
    const algo = algoSelect.value;
    updateComplexity(algo);
    await ALGORITHMS[algo]();
    clearInterval(statsInterval);
    statsInterval = null;
    updateStats();
    if (!aborted) await markAllSorted();
    running = false;
    startBtn.textContent = 'Start';
    shuffleBtn.disabled = false; algoSelect.disabled = false; sizeSlider.disabled = false;
  }

  function updateComplexity(algo) {
    const info = ALGO_INFO[algo];
    timeComplexity.textContent = '時間: ' + info.time;
    spaceComplexity.textContent = '空間: ' + info.space;
  }

  startBtn.addEventListener('click', start);
  shuffleBtn.addEventListener('click', () => { if (!running) generateArray(); });
  sizeSlider.addEventListener('input', () => { sizeValue.textContent = sizeSlider.value; if (!running) generateArray(); });
  speedSlider.addEventListener('input', () => { speedValue.textContent = speedSlider.value; });
  algoSelect.addEventListener('change', () => { updateComplexity(algoSelect.value); });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); start(); }
    if (e.code === 'KeyR' && !running) generateArray();
  });
  window.addEventListener('resize', resize);
  
  // Cleanup
  function cleanup() {
    running = false;
    if (audioCtx) audioCtx.close();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

  updateComplexity(algoSelect.value);
  generateArray();
  resize();
})();
