// ==========================================
// Synthy — Web Audio Synthesizer
// ==========================================
(function () {
  'use strict';

  let audioCtx = null;
  const activeNotes = new Map();

  const waveformEl = document.getElementById('waveform');
  const attackEl = document.getElementById('attack');
  const releaseEl = document.getElementById('release');
  const filterFreqEl = document.getElementById('filterFreq');
  const volumeEl = document.getElementById('volume');
  const octValueEl = document.getElementById('octValue');
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  const keyboardEl = document.getElementById('keyboard');

  let octave = 4;
  let analyser = null;
  let masterGain = null;
  let filterNode = null;
  let animId = null;

  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const KEY_MAP = {
    'a':'C','w':'C#','s':'D','e':'D#','d':'E','f':'F',
    't':'F#','g':'G','y':'G#','h':'A','u':'A#','j':'B',
    'k':'C+','o':'C#+','l':'D+'
  };

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volumeEl.value / 100;
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = Number(filterFreqEl.value);
    filterNode.Q.value = 2;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    filterNode.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
    drawVisualizer();
  }

  function noteFreq(note, oct) {
    const idx = NOTE_NAMES.indexOf(note);
    return 440 * Math.pow(2, (oct - 4) + (idx - 9) / 12);
  }

  function noteOn(note, oct) {
    initAudio();
    const key = note + oct;
    if (activeNotes.has(key)) return;
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    osc.type = waveformEl.value;
    osc.frequency.value = noteFreq(note, oct);
    env.gain.setValueAtTime(0, audioCtx.currentTime);
    env.gain.linearRampToValueAtTime(1, audioCtx.currentTime + Number(attackEl.value) / 1000);
    osc.connect(env);
    env.connect(filterNode);
    osc.start();
    activeNotes.set(key, { osc, env });
    highlightKey(note, oct, true);
  }

  function noteOff(note, oct) {
    const key = note + oct;
    const n = activeNotes.get(key);
    if (!n) return;
    const rel = Number(releaseEl.value) / 1000;
    n.env.gain.cancelScheduledValues(audioCtx.currentTime);
    n.env.gain.setValueAtTime(n.env.gain.value, audioCtx.currentTime);
    n.env.gain.linearRampToValueAtTime(0, audioCtx.currentTime + rel);
    n.osc.stop(audioCtx.currentTime + rel + 0.05);
    activeNotes.delete(key);
    highlightKey(note, oct, false);
  }

  function highlightKey(note, oct, on) {
    const el = keyboardEl.querySelector(`[data-note="${note}"][data-oct="${oct}"]`);
    if (el) el.classList.toggle('active', on);
  }

  // --- Keyboard UI ---
  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    for (let o = octave; o <= octave + 1; o++) {
      for (let i = 0; i < 12; i++) {
        const note = NOTE_NAMES[i];
        const isBlack = note.includes('#');
        const key = document.createElement('div');
        key.className = `key ${isBlack ? 'key-black' : 'key-white'}`;
        key.dataset.note = note;
        key.dataset.oct = o;
        if (!isBlack) key.textContent = note + o;
        key.addEventListener('pointerdown', (e) => { e.preventDefault(); noteOn(note, o); });
        key.addEventListener('pointerup', () => noteOff(note, o));
        key.addEventListener('pointerleave', () => noteOff(note, o));
        keyboardEl.appendChild(key);
      }
    }
  }

  // --- Visualizer ---
  function drawVisualizer() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const cH = rect.height - (window.innerWidth <= 800 ? 140 : 180) - 52;
    canvas.width = rect.width * dpr;
    canvas.height = Math.max(100, cH) * dpr;
    canvas.style.height = Math.max(100, cH) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function frame() {
      animId = requestAnimationFrame(frame);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, w, h);
      if (!analyser) return;
      const bufLen = analyser.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      analyser.getByteTimeDomainData(data);

      // Waveform glow layer
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(167,139,250,0.15)';
      ctx.beginPath();
      const sliceW = w / bufLen;
      for (let i = 0; i < bufLen; i++) {
        const v = data[i] / 128.0;
        const y = v * h / 2;
        if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * sliceW, y);
      }
      ctx.stroke();

      // Main waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(167,139,250,0.7)';
      ctx.beginPath();
      for (let i = 0; i < bufLen; i++) {
        const v = data[i] / 128.0;
        const y = v * h / 2;
        if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * sliceW, y);
      }
      ctx.stroke();

      // Frequency bars with gradient
      const freqData = new Uint8Array(bufLen);
      analyser.getByteFrequencyData(freqData);
      const barW = w / 64;
      for (let i = 0; i < 64; i++) {
        const val = freqData[i * 4] / 255;
        const barH = val * h * 0.4;
        // Color gradient based on frequency
        const hue = 260 + (i / 64) * 60;
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${0.15 + val * 0.4})`;
        ctx.fillRect(i * barW, h - barH, barW - 1, barH);
        // Glow on top of active bars
        if (val > 0.3) {
          ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${val * 0.15})`;
          ctx.fillRect(i * barW - 1, h - barH - 2, barW + 1, 4);
        }
      }

      // Center line
      ctx.strokeStyle = 'rgba(167,139,250,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    }
    frame();
  }

  // --- Controls ---
  volumeEl.addEventListener('input', () => { if (masterGain) masterGain.gain.value = volumeEl.value / 100; });
  filterFreqEl.addEventListener('input', () => { if (filterNode) filterNode.frequency.value = Number(filterFreqEl.value); });
  document.getElementById('octDown').addEventListener('click', () => { if (octave > 1) { octave--; octValueEl.textContent = octave; buildKeyboard(); } });
  document.getElementById('octUp').addEventListener('click', () => { if (octave < 7) { octave++; octValueEl.textContent = octave; buildKeyboard(); } });

  // --- PC Keyboard ---
  const pressedKeys = new Set();
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    const mapped = KEY_MAP[e.key.toLowerCase()];
    if (!mapped) return;
    e.preventDefault();
    const k = e.key.toLowerCase();
    if (pressedKeys.has(k)) return;
    pressedKeys.add(k);
    const isPlus = mapped.endsWith('+');
    const note = isPlus ? mapped.slice(0, -1) : mapped;
    const oct = isPlus ? octave + 1 : octave;
    noteOn(note, oct);
  });
  document.addEventListener('keyup', (e) => {
    const mapped = KEY_MAP[e.key.toLowerCase()];
    if (!mapped) return;
    pressedKeys.delete(e.key.toLowerCase());
    const isPlus = mapped.endsWith('+');
    const note = isPlus ? mapped.slice(0, -1) : mapped;
    const oct = isPlus ? octave + 1 : octave;
    noteOff(note, oct);
  });

  window.addEventListener('resize', () => { cancelAnimationFrame(animId); drawVisualizer(); });
  function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (audioCtx) audioCtx.close();
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  buildKeyboard();
})();
