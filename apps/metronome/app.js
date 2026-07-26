(function() {
  'use strict';

  const visualBeat = document.getElementById('visualBeat');
  const currentBeatEl = document.getElementById('currentBeat');
  const totalBeatsEl = document.getElementById('totalBeats');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmValue = document.getElementById('bpmValue');
  const timeSignature = document.getElementById('timeSignature');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const accentFirst = document.getElementById('accentFirst');
  const startBtn = document.getElementById('startBtn');
  const tapBtn = document.getElementById('tapBtn');
  const subdivisionSelect = document.getElementById('subdivision');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const presetSelect = document.getElementById('presetSelect');
  const deletePresetBtn = document.getElementById('deletePresetBtn');

  let audioContext = null;
  let isPlaying = false;
  let intervalId = null;
  let currentBeat = 0;
  let currentSubdivision = 0;
  let bpm = 120;
  let beats = 4;
  let subdivision = 1;
  let volume = 0.8;
  let tapTimes = [];
  let presets = JSON.parse(localStorage.getItem('metronomePresets') || '[]');

  // BPMプリセット
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetBpm = parseInt(btn.dataset.bpm);
      bpmSlider.value = presetBpm;
      bpm = presetBpm;
      bpmValue.textContent = presetBpm;
      if (isPlaying) {
        stop();
        start();
      }
    });
  });

  bpmSlider.addEventListener('input', () => {
    bpm = parseInt(bpmSlider.value);
    bpmValue.textContent = bpm;
    if (isPlaying) {
      stop();
      start();
    }
  });

  timeSignature.addEventListener('change', () => {
    beats = parseInt(timeSignature.value);
    totalBeatsEl.textContent = beats;
    currentBeat = 0;
    currentBeatEl.textContent = '1';
  });

  volumeSlider.addEventListener('input', () => {
    volume = parseInt(volumeSlider.value) / 100;
    volumeValue.textContent = volumeSlider.value;
  });

  subdivisionSelect.addEventListener('change', () => {
    subdivision = parseInt(subdivisionSelect.value);
    if (isPlaying) {
      stop();
      start();
    }
  });

  startBtn.addEventListener('click', () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  });

  // タップテンポ
  tapBtn.addEventListener('click', () => {
    const now = Date.now();
    tapTimes.push(now);
    
    // 2秒以上前のタップは削除
    tapTimes = tapTimes.filter(t => now - t < 2000);
    
    tapBtn.classList.add('tapping');
    setTimeout(() => tapBtn.classList.remove('tapping'), 100);
    
    if (tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i-1]);
      }
      const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        bpm = calculatedBpm;
        bpmSlider.value = calculatedBpm;
        bpmValue.textContent = calculatedBpm;
        
        if (isPlaying) {
          stop();
          start();
        }
      }
    }
  });

  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playClick(isAccent) {
    if (!audioContext) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    // アクセント拍は高い音、通常拍は低い音、分割音はさらに低い音
    let frequency = 800;
    let gainValue = volume * 0.6;
    
    if (isAccent) {
      frequency = 1200;
      gainValue = volume;
    } else if (currentSubdivision > 0) {
      frequency = 600;
      gainValue = volume * 0.4;
    }
    
    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }

  function tick() {
    currentSubdivision++;
    
    // 分割が完了したら次の拍へ
    if (currentSubdivision >= subdivision) {
      currentSubdivision = 0;
      currentBeat = (currentBeat % beats) + 1;
      currentBeatEl.textContent = currentBeat;
    }
    
    const isMainBeat = currentSubdivision === 0;
    const isAccent = accentFirst.checked && currentBeat === 1 && isMainBeat;
    
    // ビジュアルフィードバック（メイン拍のみ）
    if (isMainBeat) {
      visualBeat.classList.remove('pulse', 'accent');
      void visualBeat.offsetWidth; // リフロー
      visualBeat.classList.add('pulse');
      if (isAccent) {
        visualBeat.classList.add('accent');
      }
      
      setTimeout(() => {
        visualBeat.classList.remove('pulse', 'accent');
      }, 100);
    }
    
    // サウンド
    playClick(isAccent);
  }

  function start() {
    initAudio();
    isPlaying = true;
    currentBeat = 0;
    currentSubdivision = subdivision - 1; // 最初のtickで0になるように
    startBtn.textContent = 'Stop';
    startBtn.classList.add('active');
    
    const interval = 60000 / (bpm * subdivision);
    
    // 最初の拍を即座に再生
    tick();
    
    intervalId = setInterval(tick, interval);
  }

  function stop() {
    isPlaying = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    startBtn.textContent = 'Start';
    startBtn.classList.remove('active');
    currentBeat = 0;
    currentSubdivision = 0;
    currentBeatEl.textContent = '1';
    visualBeat.classList.remove('pulse', 'accent');
  }

  // プリセット機能
  function loadPresets() {
    presetSelect.innerHTML = '<option value="">プリセットを選択...</option>';
    presets.forEach((preset, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = preset.name;
      presetSelect.appendChild(option);
    });
  }

  function savePreset() {
    const name = prompt('プリセット名を入力してください:');
    if (!name) return;
    
    const preset = {
      name,
      bpm,
      beats,
      subdivision,
      volume: volume * 100,
      accentFirst: accentFirst.checked
    };
    
    presets.push(preset);
    localStorage.setItem('metronomePresets', JSON.stringify(presets));
    loadPresets();
    alert(`プリセット「${name}」を保存しました`);
  }

  function loadPreset(index) {
    const preset = presets[index];
    if (!preset) return;
    
    bpm = preset.bpm;
    bpmSlider.value = bpm;
    bpmValue.textContent = bpm;
    
    beats = preset.beats;
    timeSignature.value = beats;
    totalBeatsEl.textContent = beats;
    
    subdivision = preset.subdivision;
    subdivisionSelect.value = subdivision;
    
    volume = preset.volume / 100;
    volumeSlider.value = preset.volume;
    volumeValue.textContent = preset.volume;
    
    accentFirst.checked = preset.accentFirst;
    
    if (isPlaying) {
      stop();
      start();
    }
  }

  function deletePreset() {
    const index = parseInt(presetSelect.value);
    if (isNaN(index)) {
      alert('削除するプリセットを選択してください');
      return;
    }
    
    const preset = presets[index];
    if (confirm(`プリセット「${preset.name}」を削除しますか？`)) {
      presets.splice(index, 1);
      localStorage.setItem('metronomePresets', JSON.stringify(presets));
      loadPresets();
      alert('プリセットを削除しました');
    }
  }

  savePresetBtn.addEventListener('click', savePreset);
  deletePresetBtn.addEventListener('click', deletePreset);
  presetSelect.addEventListener('change', (e) => {
    const index = parseInt(e.target.value);
    if (!isNaN(index)) {
      loadPreset(index);
    }
  });

  // クリーンアップ
  function cleanup() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

  // 初期化
  totalBeatsEl.textContent = beats;
  loadPresets();
})();
