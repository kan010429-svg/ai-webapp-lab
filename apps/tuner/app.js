(function() {
  'use strict';

  const waveformCanvas = document.getElementById('waveform');
  const waveformCtx = waveformCanvas.getContext('2d');
  const noteCircle = document.getElementById('noteCircle');
  const noteName = document.getElementById('noteName');
  const frequency = document.getElementById('frequency');
  const cents = document.getElementById('cents');
  const meterNeedle = document.getElementById('meterNeedle');
  const startBtn = document.getElementById('startBtn');
  const tuningMode = document.getElementById('tuningMode');
  const a4Freq = document.getElementById('a4Freq');
  const a4Value = document.getElementById('a4Value');
  const stringGuide = document.getElementById('stringGuide');
  const autoAlert = document.getElementById('autoAlert');
  const tuneCount = document.getElementById('tuneCount');
  const avgAccuracy = document.getElementById('avgAccuracy');
  const historyList = document.getElementById('historyList');
  const clearHistory = document.getElementById('clearHistory');

  let audioContext = null;
  let analyser = null;
  let microphone = null;
  let isListening = false;
  let animationId = null;
  let a4 = 440;
  let lastInTuneTime = 0;
  let tuningHistory = [];
  let accuracyData = [];

  const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const tunings = {
    guitar: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    bass: ['E1', 'A1', 'D2', 'G2'],
    ukulele: ['G4', 'C4', 'E4', 'A4']
  };

  function resizeWaveform() {
    waveformCanvas.width = waveformCanvas.offsetWidth;
    waveformCanvas.height = waveformCanvas.offsetHeight;
  }
  window.addEventListener('resize', resizeWaveform);
  resizeWaveform();

  function loadHistory() {
    const saved = localStorage.getItem('tuner_history');
    if (saved) {
      tuningHistory = JSON.parse(saved);
      renderHistory();
    }
    const savedAccuracy = localStorage.getItem('tuner_accuracy');
    if (savedAccuracy) {
      accuracyData = JSON.parse(savedAccuracy);
      updateStats();
    }
  }

  function saveHistory() {
    localStorage.setItem('tuner_history', JSON.stringify(tuningHistory.slice(0, 20)));
    localStorage.setItem('tuner_accuracy', JSON.stringify(accuracyData.slice(0, 100)));
  }

  function addToHistory(note, freq, centsOff) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    tuningHistory.unshift({ note, freq: freq.toFixed(1), cents: centsOff, timestamp });
    if (tuningHistory.length > 20) tuningHistory.pop();
    renderHistory();
    saveHistory();
  }

  function renderHistory() {
    historyList.innerHTML = tuningHistory.map(h =>`<div class="history-item"><span>${h.timestamp}</span><span>${h.note}</span><span>${h.freq} Hz</span><span class="${Math.abs(h.cents) < 5 ? 'in-tune' : ''}">${h.cents > 0 ? '+' : ''}${h.cents}¢</span></div>`
    ).join('') || '<div class="history-empty">履歴なし</div>';
  }

  function updateStats() {
    tuneCount.textContent = accuracyData.length;
    if (accuracyData.length > 0) {
      const avg = accuracyData.reduce((sum, val) => sum + Math.abs(val), 0) / accuracyData.length;
      avgAccuracy.textContent = `±${avg.toFixed(1)}¢`;
    }
  }

  a4Freq.addEventListener('input', () => {
    a4 = parseInt(a4Freq.value);
    a4Value.textContent = a4;
  });

  tuningMode.addEventListener('change', updateStringGuide);

  clearHistory.addEventListener('click', () => {
    if (confirm('履歴をクリアしますか？')) {
      tuningHistory = [];
      accuracyData = [];
      localStorage.removeItem('tuner_history');
      localStorage.removeItem('tuner_accuracy');
      renderHistory();
      updateStats();
    }
  });

  startBtn.addEventListener('click', () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  });

  function updateStringGuide() {
    const mode = tuningMode.value;
    stringGuide.innerHTML = '';
    
    if (mode !== 'chromatic' && tunings[mode]) {
      tunings[mode].forEach(note => {
        const btn = document.createElement('button');
        btn.className = 'string-btn';
        btn.textContent = note;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.string-btn').forEach(b => b.classList.remove('target'));
          btn.classList.add('target');
        });
        stringGuide.appendChild(btn);
      });
    }
  }

  async function start() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      isListening = true;
      startBtn.textContent = 'Stop';
      startBtn.classList.add('active');
      
      detectPitch();
    } catch (err) {
      alert('マイクへのアクセスが拒否されました');
    }
  }

  function stop() {
    isListening = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (microphone) {
      microphone.disconnect();
      microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    startBtn.textContent = 'Start';
    startBtn.classList.remove('active');
    noteName.textContent = '-';
    frequency.textContent = '-- Hz';
    cents.textContent = '0¢';
    noteCircle.className = 'note-circle';
    meterNeedle.style.left = '50%';
    waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
  }

  function drawWaveform(buffer) {
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    waveformCtx.clearRect(0, 0, width, height);
    waveformCtx.strokeStyle = 'rgba(255,255,255,0.6)';
    waveformCtx.lineWidth = 2;
    waveformCtx.beginPath();
    const sliceWidth = width / buffer.length;
    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i];
      const y = (v + 1) * height / 2;
      if (i === 0) waveformCtx.moveTo(x, y);
      else waveformCtx.lineTo(x, y);
      x += sliceWidth;
    }
    waveformCtx.stroke();
  }

  function detectPitch() {
    if (!isListening) return;
    
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    drawWaveform(buffer);
    
    const freq = autoCorrelate(buffer, audioContext.sampleRate);
    
    if (freq > 0) {
      const note = frequencyToNote(freq);
      const centsOff = getCents(freq, note.frequency);
      
      noteName.textContent = note.name;
      frequency.textContent = `${freq.toFixed(1)} Hz`;
      cents.textContent = `${centsOff > 0 ? '+' : ''}${centsOff}¢`;
      
      const meterPos = 50 + (centsOff / 50) * 50;
      meterNeedle.style.left = `${Math.max(0, Math.min(100, meterPos))}%`;
      
      noteCircle.classList.remove('in-tune', 'sharp', 'flat');
      if (Math.abs(centsOff) < 5) {
        noteCircle.classList.add('in-tune');
        const now = Date.now();
        if (now - lastInTuneTime > 2000) {
          addToHistory(note.name, freq, centsOff);
          accuracyData.push(centsOff);
          updateStats();
          saveHistory();
          lastInTuneTime = now;
          if (autoAlert.checked) {
            playBeep();
          }
        }
      } else if (centsOff > 0) {
        noteCircle.classList.add('sharp');
      } else {
        noteCircle.classList.add('flat');
      }
    }
    
    animationId = requestAnimationFrame(detectPitch);
  }

  function playBeep() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.stop(audioContext.currentTime + 0.1);
  }

  function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;
    
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    if (rms < 0.01) return -1;
    
    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > best_correlation;
        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }
      
      lastCorrelation = correlation;
    }
    
    if (best_correlation > 0.01) {
      return sampleRate / best_offset;
    }
    return -1;
  }

  function frequencyToNote(freq) {
    const noteNum = 12 * (Math.log(freq / a4) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const noteName = noteStrings[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    const noteFreq = a4 * Math.pow(2, (noteIndex - 69) / 12);
    
    return {
      name: noteName + octave,
      frequency: noteFreq,
      cents: Math.floor((freq - noteFreq) / noteFreq * 1200)
    };
  }

  function getCents(freq, targetFreq) {
    return Math.floor(1200 * Math.log(freq / targetFreq) / Math.log(2));
  }

  function cleanup() {
    if (isListening) {
      stop();
    }
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

  updateStringGuide();
  loadHistory();
})();
