// ==========================================
// ProbSim — Probability Simulator
// ==========================================
(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const expEl = document.getElementById('experiment');
  const runBtn = document.getElementById('runBtn');
  const run1000Btn = document.getElementById('run1000');
  const resetBtn = document.getElementById('resetBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const trialsEl = document.getElementById('trials');
  const infoTitle = document.getElementById('infoTitle');
  const infoDesc = document.getElementById('infoDesc');
  const resultsEl = document.getElementById('results');
  const settingsArea = document.getElementById('settingsArea');

  const INFO = {
    monty: { title: 'モンティ・ホール問題', desc: '3つのドアの1つに賞品。選択後、司会者がハズレを開ける。変更した方が得？理論値: 変更=66.7%, 固定=33.3%' },
    birthday: { title: '誕生日のパラドックス', desc: 'N人の中に同じ誕生日のペアがいる確率。23人で約50%を超える。' },
    pi: { title: 'モンテカルロ法 (π推定)', desc: '正方形内にランダムに点を打ち、円内に入る割合からπを推定。' },
    dice: { title: 'サイコロ分布', desc: '2つのサイコロの合計値の分布。7が最も出やすい。' },
    coin: { title: 'コイン投げ (大数の法則)', desc: '試行回数が増えるほど表の割合が50%に近づく。' },
    gambler: { title: 'ギャンブラーの誤謬', desc: '連続で同じ結果が出ても、次の結果の確率は変わらない。赤が5連続でも次も50%。' },
    petersburg: { title: 'セントペテルブルク', desc: 'コインが表が出るまで投げ続け、n回目で出たら2^n円もらえる。期待値は無限大だが…' },
    bayes: { title: 'ベイズの定理', desc: '病気の検査で陽性。実際に病気の確率は？事前確率と検査精度から計算。' },
    coupon: { title: 'クーポンコレクター', desc: 'N種類のクーポンを全て集めるのに平均何回必要？理論値: N×ln(N)' },
    'random-walk': { title: 'ランダムウォーク', desc: '1次元のランダムウォーク。左右にランダムに移動。原点に戻る確率は？' },
    buffon: { title: 'ビュフォンの針', desc: '平行線上に針を落とす。針が線と交わる確率からπを推定できる。' },
    secretary: { title: '秘書問題', desc: 'N人の候補者を順に面接。最良の候補を選ぶ最適戦略は？37%ルール。' }
  };

  const SETTINGS = {
    birthday: [{ key: 'groupSize', label: '人数', type: 'number', min: 2, max: 100, default: 23 }],
    dice: [{ key: 'numDice', label: 'サイコロの数', type: 'number', min: 1, max: 6, default: 2 }],
    bayes: [
      { key: 'diseaseRate', label: '病気の発生率', type: 'range', min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
      { key: 'testAccuracy', label: '検査精度', type: 'range', min: 0.5, max: 0.99, step: 0.01, default: 0.95 }
    ],
    coupon: [{ key: 'numCoupons', label: 'クーポン種類数', type: 'number', min: 2, max: 50, default: 10 }],
    'random-walk': [{ key: 'maxSteps', label: '最大ステップ数', type: 'number', min: 10, max: 1000, default: 100 }],
    buffon: [
      { key: 'needleLength', label: '針の長さ', type: 'range', min: 0.1, max: 2, step: 0.1, default: 1 },
      { key: 'lineSpacing', label: '線の間隔', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1 }
    ],
    secretary: [{ key: 'numCandidates', label: '候補者数', type: 'number', min: 3, max: 100, default: 10 }]
  };

  let data = {};
  let config = {};
  let totalTrials = 0;
  let settingsVisible = false;
  let animFrame = null;
  let animations = {
    bars: [],
    numbers: {},
    particles: []
  };

  function resetData() {
    totalTrials = 0;
    trialsEl.textContent = '0';
    const exp = expEl.value;
    
    // Load default config
    if (SETTINGS[exp]) {
      SETTINGS[exp].forEach(s => {
        if (config[s.key] === undefined) config[s.key] = s.default;
      });
    }
    
    if (exp === 'monty') data = { switchWin: 0, stayWin: 0 };
    else if (exp === 'birthday') data = { matches: 0, groupSize: config.groupSize || 23, history: [] };
    else if (exp === 'pi') data = { inside: 0, total: 0, points: [] };
    else if (exp === 'dice') data = { counts: new Array((config.numDice || 2) * 6 + 1).fill(0), numDice: config.numDice || 2 };
    else if (exp === 'coin') data = { heads: 0, history: [] };
    else if (exp === 'gambler') data = { streaks: [], afterRed: { red: 0, black: 0 }, afterBlack: { red: 0, black: 0 }, currentStreak: 0, currentColor: null };
    else if (exp === 'petersburg') data = { payouts: [], totalPayout: 0, history: [] };
    else if (exp === 'bayes') data = { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0, diseaseRate: config.diseaseRate || 0.01, testAccuracy: config.testAccuracy || 0.95 };
    else if (exp === 'coupon') data = { collected: new Set(), attempts: [], numCoupons: config.numCoupons || 10 };
    else if (exp === 'random-walk') data = { walks: [], maxSteps: config.maxSteps || 100 };
    else if (exp === 'buffon') data = { hits: 0, total: 0, needles: [], needleLength: config.needleLength || 1, lineSpacing: config.lineSpacing || 1 };
    else if (exp === 'secretary') data = { bestFound: 0, numCandidates: config.numCandidates || 10, strategy: Math.floor((config.numCandidates || 10) / Math.E) };
    
    updateSettings();
    updateInfo();
    draw();
  }

  function updateSettings() {
    const exp = expEl.value;
    const settings = SETTINGS[exp];
    
    if (!settings || settings.length === 0) {
      settingsArea.style.display = 'none';
      return;
    }
    
    if (!settingsVisible) {
      settingsArea.style.display = 'none';
      return;
    }
    
    settingsArea.style.display = 'flex';
    settingsArea.innerHTML = '';
    
    settings.forEach(s => {
      const item = document.createElement('div');
      item.className = 'setting-item';
      
      const label = document.createElement('label');
      label.textContent = s.label;
      item.appendChild(label);
      
      if (s.type === 'range') {
        const container = document.createElement('div');
        container.className = 'range-value';
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = s.min;
        input.max = s.max;
        input.step = s.step || 1;
        input.value = config[s.key] || s.default;
        
        const valueSpan = document.createElement('span');
        valueSpan.textContent = (config[s.key] || s.default).toFixed(s.step < 1 ? 3 : 0);
        
        input.addEventListener('input', (e) => {
          config[s.key] = parseFloat(e.target.value);
          valueSpan.textContent = config[s.key].toFixed(s.step < 1 ? 3 : 0);
          resetData();
        });
        
        container.appendChild(input);
        container.appendChild(valueSpan);
        item.appendChild(container);
      } else {
        const input = document.createElement('input');
        input.type = s.type;
        input.min = s.min;
        input.max = s.max;
        input.value = config[s.key] || s.default;
        
        input.addEventListener('change', (e) => {
          config[s.key] = s.type === 'number' ? parseInt(e.target.value) : e.target.value;
          resetData();
        });
        
        item.appendChild(input);
      }
      
      settingsArea.appendChild(item);
    });
  }

  function toggleSettings() {
    settingsVisible = !settingsVisible;
    updateSettings();
  }

  function runOnce() {
    const exp = expEl.value;
    totalTrials++;
    trialsEl.textContent = totalTrials.toLocaleString();

    if (exp === 'monty') {
      const prize = Math.floor(Math.random() * 3);
      const pick = Math.floor(Math.random() * 3);
      if (pick === prize) data.stayWin++; else data.switchWin++;
      
      // Add particles at bar tops
      const d = window.devicePixelRatio || 1;
      const w = canvas.width / d, h = canvas.height / d;
      const cx = w / 2;
      if (pick === prize) {
        addParticles(cx + 60, h * 0.3, 3, '#38bdf8');
      } else {
        addParticles(cx - 60, h * 0.3, 3, '#f472b6');
      }
    } else if (exp === 'birthday') {
      const bdays = new Set();
      let match = false;
      for (let i = 0; i < data.groupSize; i++) {
        const d = Math.floor(Math.random() * 365);
        if (bdays.has(d)) { match = true; break; }
        bdays.add(d);
      }
      if (match) data.matches++;
      data.history.push(data.matches / totalTrials);
      if (data.history.length > 500) data.history.shift();
    } else if (exp === 'pi') {
      const x = Math.random(), y = Math.random();
      data.total++;
      const inside = x * x + y * y <= 1;
      if (inside) data.inside++;
      if (data.points.length < 5000) data.points.push({ x, y, inside });
      
      // Add particle at point location
      const d = window.devicePixelRatio || 1;
      const w = canvas.width / d, h = canvas.height / d;
      const s = Math.min(w, h) * 0.8;
      const ox = (w - s) / 2, oy = (h - s) / 2;
      addParticles(ox + x * s, oy + (1 - y) * s, 1, inside ? '#f472b6' : '#38bdf8');
    } else if (exp === 'dice') {
      let sum = 0;
      for (let i = 0; i < data.numDice; i++) {
        sum += Math.floor(Math.random() * 6) + 1;
      }
      data.counts[sum]++;
      
      // Add particles at the bar that increased
      const d = window.devicePixelRatio || 1;
      const w = canvas.width / d, h = canvas.height / d;
      const numBars = data.numDice * 6 - data.numDice + 1;
      const barW = Math.min(40, (w - 80) / numBars);
      const gap = 4;
      const startX = (w - (barW + gap) * numBars) / 2;
      const barIdx = sum - data.numDice;
      const x = startX + barIdx * (barW + gap) + barW / 2;
      const hue = barIdx * (300 / numBars);
      addParticles(x, h * 0.5, 2, `hsl(${hue}, 70%, 60%)`);
    } else if (exp === 'coin') {
      if (Math.random() < 0.5) data.heads++;
      data.history.push(data.heads / totalTrials);
      if (data.history.length > 1000) data.history.shift();
    } else if (exp === 'gambler') {
      const result = Math.random() < 0.5 ? 'red' : 'black';
      if (data.currentColor === result) {
        data.currentStreak++;
      } else {
        if (data.currentStreak >= 3) {
          data.streaks.push({ color: data.currentColor, length: data.currentStreak });
        }
        data.currentStreak = 1;
        data.currentColor = result;
      }
      if (data.currentStreak >= 5) {
        const next = Math.random() < 0.5 ? 'red' : 'black';
        if (data.currentColor === 'red') {
          if (next === 'red') data.afterRed.red++;
          else data.afterRed.black++;
        } else {
          if (next === 'red') data.afterBlack.red++;
          else data.afterBlack.black++;
        }
      }
    } else if (exp === 'petersburg') {
      let flips = 0;
      while (Math.random() >= 0.5 && flips < 20) flips++;
      const payout = Math.pow(2, flips);
      data.payouts.push(payout);
      data.totalPayout += payout;
      const avg = data.totalPayout / totalTrials;
      data.history.push(avg);
      if (data.history.length > 500) data.history.shift();
    } else if (exp === 'bayes') {
      const hasDis = Math.random() < data.diseaseRate;
      const testPos = hasDis ? 
        (Math.random() < data.testAccuracy) : 
        (Math.random() < (1 - data.testAccuracy));
      
      if (hasDis && testPos) data.truePositive++;
      else if (!hasDis && testPos) data.falsePositive++;
      else if (!hasDis && !testPos) data.trueNegative++;
      else if (hasDis && !testPos) data.falseNegative++;
    } else if (exp === 'coupon') {
      const collected = new Set();
      let attempts = 0;
      while (collected.size < data.numCoupons) {
        attempts++;
        collected.add(Math.floor(Math.random() * data.numCoupons));
      }
      data.attempts.push(attempts);
    } else if (exp === 'random-walk') {
      let pos = 0;
      const walk = [0];
      for (let i = 0; i < data.maxSteps; i++) {
        pos += Math.random() < 0.5 ? -1 : 1;
        walk.push(pos);
      }
      data.walks.push(walk);
      if (data.walks.length > 50) data.walks.shift();
    } else if (exp === 'buffon') {
      const angle = Math.random() * Math.PI;
      const center = Math.random() * data.lineSpacing;
      const halfLen = data.needleLength / 2;
      const y1 = center - halfLen * Math.sin(angle);
      const y2 = center + halfLen * Math.sin(angle);
      const hit = Math.floor(y1 / data.lineSpacing) !== Math.floor(y2 / data.lineSpacing);
      if (hit) data.hits++;
      data.total++;
      if (data.needles.length < 500) data.needles.push({ center, angle, hit });
    } else if (exp === 'secretary') {
      const candidates = Array.from({ length: data.numCandidates }, (_, i) => i + 1);
      candidates.sort(() => Math.random() - 0.5);
      let maxSeen = 0;
      let selected = 0;
      for (let i = 0; i < data.numCandidates; i++) {
        if (i < data.strategy) {
          maxSeen = Math.max(maxSeen, candidates[i]);
        } else {
          if (candidates[i] > maxSeen) {
            selected = candidates[i];
            break;
          }
        }
      }
      if (selected === data.numCandidates) data.bestFound++;
    }
    updateInfo();
    draw();
  }

  function updateInfo() {
    const exp = expEl.value;
    const info = INFO[exp];
    infoTitle.textContent = info.title;
    infoDesc.textContent = info.desc;
    let html = '';
    if (exp === 'monty') {
      const sw = totalTrials ? (data.switchWin / totalTrials * 100).toFixed(1) : '—';
      const st = totalTrials ? (data.stayWin / totalTrials * 100).toFixed(1) : '—';
      html = `<div class="result-row"><span class="label">変更して勝ち</span><span class="value">${sw}%</span></div>
              <div class="result-row"><span class="label">固定して勝ち</span><span class="value">${st}%</span></div>`;
    } else if (exp === 'birthday') {
      const rate = totalTrials ? (data.matches / totalTrials * 100).toFixed(1) : '—';
      html = `<div class="result-row"><span class="label">一致率 (${data.groupSize}人)</span><span class="value">${rate}%</span></div>`;
    } else if (exp === 'pi') {
      const pi = data.total ? (4 * data.inside / data.total).toFixed(6) : '—';
      const err = data.total ? (Math.abs(4 * data.inside / data.total - Math.PI)).toFixed(6) : '—';
      html = `<div class="result-row"><span class="label">π推定値</span><span class="value">${pi}</span></div>
              <div class="result-row"><span class="label">誤差</span><span class="value">${err}</span></div>`;
    } else if (exp === 'dice') {
      const max = Math.max(...data.counts.slice(2));
      for (let i = 2; i <= 12; i++) {
        const pct = totalTrials ? (data.counts[i] / totalTrials * 100).toFixed(1) : '0';
        html += `<div class="result-row"><span class="label">${i}</span><span class="value">${pct}%</span></div>`;
      }
    } else if (exp === 'coin') {
      const rate = totalTrials ? (data.heads / totalTrials * 100).toFixed(2) : '—';
      html = `<div class="result-row"><span class="label">表の割合</span><span class="value">${rate}%</span></div>`;
    } else if (exp === 'gambler') {
      const totalAfterRed = data.afterRed.red + data.afterRed.black;
      const totalAfterBlack = data.afterBlack.red + data.afterBlack.black;
      const redAfterRed = totalAfterRed ? (data.afterRed.red / totalAfterRed * 100).toFixed(1) : '—';
      const blackAfterBlack = totalAfterBlack ? (data.afterBlack.black / totalAfterBlack * 100).toFixed(1) : '—';
      html = `<div class="result-row"><span class="label">赤5連続後→赤</span><span class="value">${redAfterRed}%</span></div>
              <div class="result-row"><span class="label">黒5連続後→黒</span><span class="value">${blackAfterBlack}%</span></div>
              <div class="result-row"><span class="label">現在の連続</span><span class="value">${data.currentStreak} ${data.currentColor || ''}</span></div>`;
    } else if (exp === 'petersburg') {
      const avg = totalTrials ? (data.totalPayout / totalTrials).toFixed(2) : '—';
      const median = data.payouts.length ? [...data.payouts].sort((a,b) => a-b)[Math.floor(data.payouts.length/2)] : '—';
      const max = data.payouts.length ? Math.max(...data.payouts) : '—';
      html = `<div class="result-row"><span class="label">平均獲得額</span><span class="value">¥${avg}</span></div>
              <div class="result-row"><span class="label">中央値</span><span class="value">¥${median}</span></div>
              <div class="result-row"><span class="label">最高額</span><span class="value">¥${max}</span></div>`;
    } else if (exp === 'bayes') {
      const totalPos = data.truePositive + data.falsePositive;
      const probDis = totalPos ? (data.truePositive / totalPos * 100).toFixed(1) : '—';
      const sensitivity = (data.truePositive + data.falseNegative) ? 
        (data.truePositive / (data.truePositive + data.falseNegative) * 100).toFixed(1) : '—';
      const specificity = (data.trueNegative + data.falsePositive) ? 
        (data.trueNegative / (data.trueNegative + data.falsePositive) * 100).toFixed(1) : '—';
      html = `<div class="result-row"><span class="label">陽性時の病気確率</span><span class="value">${probDis}%</span></div>
              <div class="result-row"><span class="label">感度(真陽性率)</span><span class="value">${sensitivity}%</span></div>
              <div class="result-row"><span class="label">特異度(真陰性率)</span><span class="value">${specificity}%</span></div>`;
    } else if (exp === 'coupon') {
      const avg = data.attempts.length ? (data.attempts.reduce((a, b) => a + b, 0) / data.attempts.length).toFixed(1) : '—';
      const theory = (data.numCoupons * Math.log(data.numCoupons) + 0.5772 * data.numCoupons).toFixed(1);
      const min = data.attempts.length ? Math.min(...data.attempts) : '—';
      const max = data.attempts.length ? Math.max(...data.attempts) : '—';
      html = `<div class="result-row"><span class="label">平均試行回数</span><span class="value">${avg}</span></div>
              <div class="result-row"><span class="label">理論値</span><span class="value">${theory}</span></div>
              <div class="result-row"><span class="label">最小/最大</span><span class="value">${min} / ${max}</span></div>`;
    } else if (exp === 'random-walk') {
      const atOrigin = data.walks.filter(w => w[w.length - 1] === 0).length;
      const returnRate = totalTrials ? (atOrigin / totalTrials * 100).toFixed(1) : '—';
      const avgDist = data.walks.length ? 
        (data.walks.reduce((sum, w) => sum + Math.abs(w[w.length - 1]), 0) / data.walks.length).toFixed(1) : '—';
      html = `<div class="result-row"><span class="label">原点復帰率</span><span class="value">${returnRate}%</span></div>
              <div class="result-row"><span class="label">平均最終距離</span><span class="value">${avgDist}</span></div>
              <div class="result-row"><span class="label">ステップ数</span><span class="value">${data.maxSteps}</span></div>`;
    } else if (exp === 'buffon') {
      const hitRate = data.total ? (data.hits / data.total) : 0;
      const piEst = hitRate > 0 ? (2 * data.needleLength / (data.lineSpacing * hitRate)).toFixed(6) : '—';
      const err = piEst !== '—' ? Math.abs(parseFloat(piEst) - Math.PI).toFixed(6) : '—';
      html = `<div class="result-row"><span class="label">π推定値</span><span class="value">${piEst}</span></div>
              <div class="result-row"><span class="label">誤差</span><span class="value">${err}</span></div>
              <div class="result-row"><span class="label">交差率</span><span class="value">${(hitRate * 100).toFixed(1)}%</span></div>`;
    } else if (exp === 'secretary') {
      const successRate = totalTrials ? (data.bestFound / totalTrials * 100).toFixed(1) : '—';
      const theory = (1 / Math.E * 100).toFixed(1);
      html = `<div class="result-row"><span class="label">最良選択率</span><span class="value">${successRate}%</span></div>
              <div class="result-row"><span class="label">理論値</span><span class="value">${theory}%</span></div>
              <div class="result-row"><span class="label">戦略</span><span class="value">${data.strategy}人目まで見送り</span></div>`;
    }
    resultsEl.innerHTML = html;
  }

  function resize() {
    const d = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * d;
    canvas.height = rect.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateNumber(key, target, duration = 300) {
    const start = animations.numbers[key]?.current || 0;
    const startTime = Date.now();
    
    animations.numbers[key] = {
      start,
      target,
      startTime,
      duration,
      current: start
    };
  }

  function updateAnimations() {
    const now = Date.now();
    let needsRedraw = false;
    
    // Update number animations
    Object.keys(animations.numbers).forEach(key => {
      const anim = animations.numbers[key];
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const eased = easeOutCubic(progress);
      anim.current = anim.start + (anim.target - anim.start) * eased;
      if (progress < 1) needsRedraw = true;
    });
    
    // Update bar animations
    animations.bars.forEach(bar => {
      const elapsed = now - bar.startTime;
      const progress = Math.min(elapsed / bar.duration, 1);
      const eased = easeOutCubic(progress);
      bar.current = bar.start + (bar.target - bar.start) * eased;
      if (progress < 1) needsRedraw = true;
    });
    
    // Update particles
    animations.particles = animations.particles.filter(p => {
      p.life -= 0.02;
      p.y += p.vy;
      p.x += p.vx;
      p.vy += 0.1;
      return p.life > 0;
    });
    if (animations.particles.length > 0) needsRedraw = true;
    
    if (needsRedraw) {
      draw();
      animFrame = requestAnimationFrame(updateAnimations);
    } else {
      animFrame = null;
    }
  }

  function startAnimation() {
    if (!animFrame) {
      animFrame = requestAnimationFrame(updateAnimations);
    }
  }

  function addParticles(x, y, count = 5, color = '#f472b6') {
    for (let i = 0; i < count; i++) {
      animations.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1,
        color
      });
    }
    startAnimation();
  }

  function draw() {
    const d = window.devicePixelRatio || 1;
    const w = canvas.width / d, h = canvas.height / d;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);
    const exp = expEl.value;

    if (exp === 'monty') drawMonty(w, h);
    else if (exp === 'birthday') drawLine(w, h, data.history, '一致率', 0.5);
    else if (exp === 'pi') drawPi(w, h);
    else if (exp === 'dice') drawBars(w, h);
    else if (exp === 'coin') drawLine(w, h, data.history, '表の割合', 0.5);
    else if (exp === 'gambler') drawGambler(w, h);
    else if (exp === 'petersburg') drawPetersburg(w, h);
    else if (exp === 'bayes') drawBayes(w, h);
    else if (exp === 'coupon') drawCoupon(w, h);
    else if (exp === 'random-walk') drawRandomWalk(w, h);
    else if (exp === 'buffon') drawBuffon(w, h);
    else if (exp === 'secretary') drawSecretary(w, h);
  }

  function drawMonty(w, h) {
    const total = data.switchWin + data.stayWin || 1;
    const sw = data.switchWin / total;
    const st = data.stayWin / total;
    const barW = 120, gap = 60;
    const cx = w / 2;
    const maxH = h * 0.6;
    
    // Animate bar heights
    if (!animations.numbers['monty_sw']) {
      animateNumber('monty_sw', sw, 500);
      animateNumber('monty_st', st, 500);
    } else {
      if (Math.abs(animations.numbers['monty_sw'].target - sw) > 0.001) {
        animateNumber('monty_sw', sw, 300);
      }
      if (Math.abs(animations.numbers['monty_st'].target - st) > 0.001) {
        animateNumber('monty_st', st, 300);
      }
    }
    
    const swAnim = animations.numbers['monty_sw']?.current || sw;
    const stAnim = animations.numbers['monty_st']?.current || st;
    
    // Switch bar with glow
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 12;
    const swGrad = ctx.createLinearGradient(0, h * 0.8, 0, h * 0.8 - swAnim * maxH);
    swGrad.addColorStop(0, '#f472b6');
    swGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = swGrad;
    const sh = swAnim * maxH;
    ctx.fillRect(cx - barW - gap / 2, h * 0.8 - sh, barW, sh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('変更', cx - barW / 2 - gap / 2, h * 0.8 + 20);
    ctx.fillText((swAnim * 100).toFixed(1) + '%', cx - barW / 2 - gap / 2, h * 0.8 - sh - 10);
    
    // Stay bar with glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    const stGrad = ctx.createLinearGradient(0, h * 0.8, 0, h * 0.8 - stAnim * maxH);
    stGrad.addColorStop(0, '#38bdf8');
    stGrad.addColorStop(1, '#0ea5e9');
    ctx.fillStyle = stGrad;
    const sth = stAnim * maxH;
    ctx.fillRect(cx + gap / 2, h * 0.8 - sth, barW, sth);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.fillText('固定', cx + barW / 2 + gap / 2, h * 0.8 + 20);
    ctx.fillText((stAnim * 100).toFixed(1) + '%', cx + barW / 2 + gap / 2, h * 0.8 - sth - 10);
    
    // Theory line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([4, 4]);
    const y67 = h * 0.8 - 0.667 * maxH;
    ctx.beginPath(); ctx.moveTo(cx - barW - gap, y67); ctx.lineTo(cx + barW + gap, y67); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('理論値 66.7%', cx + barW + gap + 4, y67 + 4);
    
    // Draw particles
    animations.particles.forEach(p => {
      ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPi(w, h) {
    const s = Math.min(w, h) * 0.8;
    const ox = (w - s) / 2, oy = (h - s) / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, s, s);
    ctx.beginPath();
    ctx.arc(ox, oy + s, s, -Math.PI / 2, 0);
    ctx.stroke();
    
    // Animate points appearing
    const visiblePoints = Math.min(data.points.length, Math.floor(data.points.length));
    data.points.slice(0, visiblePoints).forEach((p, idx) => {
      const age = (visiblePoints - idx) / visiblePoints;
      const alpha = p.inside ? (0.3 + age * 0.3) : (0.2 + age * 0.1);
      const size = 1 + age * 0.5;
      ctx.fillStyle = p.inside ? `rgba(244,114,182,${alpha})` : `rgba(56,189,248,${alpha})`;
      ctx.beginPath();
      ctx.arc(ox + p.x * s, oy + (1 - p.y) * s, size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    if (data.total > 0) {
      const piVal = (4 * data.inside / data.total);
      
      // Animate pi value
      if (!animations.numbers['pi_value']) {
        animateNumber('pi_value', piVal, 500);
      } else if (Math.abs(animations.numbers['pi_value'].target - piVal) > 0.0001) {
        animateNumber('pi_value', piVal, 300);
      }
      const piAnim = animations.numbers['pi_value']?.current || piVal;
      
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '600 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('π ≈ ' + piAnim.toFixed(6), w / 2, oy - 16);
      
      // Error indicator with pulse
      const err = Math.abs(piAnim - Math.PI);
      const errColor = err < 0.01 ? '#22c55e' : err < 0.1 ? '#fbbf24' : '#ef4444';
      const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
      ctx.fillStyle = errColor;
      ctx.globalAlpha = pulse;
      ctx.font = '12px monospace';
      ctx.fillText(`誤差: ${err.toFixed(6)}`, w / 2, oy - 2);
      ctx.globalAlpha = 1;
    }
    
    // Draw particles
    animations.particles.forEach(p => {
      ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawBars(w, h) {
    const max = Math.max(...data.counts.slice(data.numDice), 1);
    const numBars = data.numDice * 6 - data.numDice + 1;
    const barW = Math.min(40, (w - 80) / numBars);
    const gap = 4;
    const startX = (w - (barW + gap) * numBars) / 2;
    const maxH = h * 0.7;
    
    // Initialize bar animations if needed
    if (animations.bars.length === 0) {
      for (let i = data.numDice; i <= data.numDice * 6; i++) {
        animations.bars.push({
          index: i,
          start: 0,
          target: 0,
          current: 0,
          startTime: Date.now(),
          duration: 400
        });
      }
    }
    
    // Update targets and animate
    for (let i = data.numDice; i <= data.numDice * 6; i++) {
      const barIdx = i - data.numDice;
      if (barIdx < animations.bars.length) {
        const bar = animations.bars[barIdx];
        const targetHeight = (data.counts[i] / max) * maxH;
        if (Math.abs(bar.target - targetHeight) > 0.5) {
          bar.start = bar.current;
          bar.target = targetHeight;
          bar.startTime = Date.now();
          startAnimation();
        }
      }
    }
    
    for (let i = data.numDice; i <= data.numDice * 6; i++) {
      const barIdx = i - data.numDice;
      const bar = animations.bars[barIdx];
      const bh = bar?.current || 0;
      const x = startX + barIdx * (barW + gap);
      const hue = barIdx * (300 / numBars);
      
      // Glow
      ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
      ctx.shadowBlur = 8;
      const grad = ctx.createLinearGradient(x, h * 0.85 - bh, x, h * 0.85);
      grad.addColorStop(0, `hsl(${hue}, 80%, 65%)`);
      grad.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, h * 0.85 - bh, barW, bh);
      ctx.shadowBlur = 0;
      
      // Top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, h * 0.85 - bh, barW, Math.min(3, bh));
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i, x + barW / 2, h * 0.85 + 16);
      
      // Percentage on top
      if (totalTrials > 0 && bh > 20) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px monospace';
        ctx.fillText((data.counts[i] / totalTrials * 100).toFixed(0) + '%', x + barW / 2, h * 0.85 - bh - 6);
      }
    }
    
    // Draw particles
    animations.particles.forEach(p => {
      ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawLine(w, h, history, label, target) {
    if (history.length < 2) return;
    const pad = 40;
    const gw = w - pad * 2, gh = h - pad * 2;
    
    // Target line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([4, 4]);
    const ty = pad + gh * (1 - target);
    ctx.beginPath(); ctx.moveTo(pad, ty); ctx.lineTo(pad + gw, ty); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((target * 100) + '%', pad + gw + 4, ty + 4);
    
    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, pad, 0, pad + gh);
    grad.addColorStop(0, 'rgba(244,114,182,0.15)');
    grad.addColorStop(1, 'rgba(244,114,182,0)');
    ctx.beginPath();
    ctx.moveTo(pad, pad + gh);
    history.forEach((v, i) => {
      const x = pad + (i / (history.length - 1)) * gw;
      const y = pad + gh * (1 - v);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad + gw, pad + gh);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Draw line with gradient opacity (older = more transparent)
    ctx.lineWidth = 2;
    history.forEach((v, i) => {
      if (i === 0) return;
      const x1 = pad + ((i - 1) / (history.length - 1)) * gw;
      const y1 = pad + gh * (1 - history[i - 1]);
      const x2 = pad + (i / (history.length - 1)) * gw;
      const y2 = pad + gh * (1 - v);
      
      const alpha = 0.3 + (i / history.length) * 0.7;
      ctx.strokeStyle = `rgba(244,114,182,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    
    // Glow on recent section
    const recentStart = Math.max(0, history.length - 50);
    ctx.strokeStyle = 'rgba(244,114,182,0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    history.slice(recentStart).forEach((v, i) => {
      const actualIdx = recentStart + i;
      const x = pad + (actualIdx / (history.length - 1)) * gw;
      const y = pad + gh * (1 - v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Current value dot with pulse
    const lastV = history[history.length - 1];
    const lastX = pad + gw;
    const lastY = pad + gh * (1 - lastV);
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.fillStyle = '#f472b6';
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 12 * pulse;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Value label
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText((lastV * 100).toFixed(1) + '%', lastX - 8, lastY - 8);
    
    // Draw particles
    animations.particles.forEach(p => {
      ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Request animation if pulse is active
    if (history.length > 0) startAnimation();
  }

  function drawGambler(w, h) {
    // Show roulette wheel with streak visualization
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.3;
    
    // Draw roulette wheel
    const segments = 18; // 9 red, 9 black
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#1f2937';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle1, angle2);
      ctx.closePath();
      ctx.fill();
    }
    
    // Center circle
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Show current streak
    if (data.currentColor) {
      ctx.fillStyle = data.currentColor === 'red' ? '#ef4444' : '#1f2937';
      ctx.shadowColor = data.currentColor === 'red' ? '#ef4444' : '#60a5fa';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy - r - 40, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '600 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.currentStreak}連続`, cx, cy - r - 60);
    }
    
    // Show probability bars after streaks
    const totalAfterRed = data.afterRed.red + data.afterRed.black;
    const totalAfterBlack = data.afterBlack.red + data.afterBlack.black;
    
    if (totalAfterRed > 0 || totalAfterBlack > 0) {
      const barY = cy + r + 60;
      const barW = 80, barH = 100;
      
      // After red streak
      if (totalAfterRed > 0) {
        const redPct = data.afterRed.red / totalAfterRed;
        const blackPct = data.afterRed.black / totalAfterRed;
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - barW - 20, barY - redPct * barH, barW, redPct * barH);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(cx - barW - 20, barY - redPct * barH - blackPct * barH, barW, blackPct * barH);
        
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('赤5連続後', cx - barW / 2 - 20, barY + 20);
        ctx.fillText((redPct * 100).toFixed(0) + '%', cx - barW / 2 - 20, barY - redPct * barH / 2);
      }
      
      // After black streak
      if (totalAfterBlack > 0) {
        const redPct = data.afterBlack.red / totalAfterBlack;
        const blackPct = data.afterBlack.black / totalAfterBlack;
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx + 20, barY - redPct * barH, barW, redPct * barH);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(cx + 20, barY - redPct * barH - blackPct * barH, barW, blackPct * barH);
        
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('黒5連続後', cx + barW / 2 + 20, barY + 20);
        ctx.fillText((blackPct * 100).toFixed(0) + '%', cx + barW / 2 + 20, barY - blackPct * barH / 2);
      }
      
      // 50% reference line
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - barW - 40, barY - barH * 0.5);
      ctx.lineTo(cx + barW + 40, barY - barH * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawPetersburg(w, h) {
    // Show average payout over time
    if (data.history.length < 2) {
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('試行を開始してください', w / 2, h / 2);
      return;
    }
    
    const pad = 40;
    const gw = w - pad * 2, gh = h - pad * 2;
    
    // Find max for scaling
    const maxVal = Math.max(...data.history, 10);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad + (i / 5) * gh;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + gw, y);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('¥' + (maxVal * (1 - i / 5)).toFixed(0), pad - 5, y + 4);
    }
    
    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad, 0, pad + gh);
    grad.addColorStop(0, 'rgba(34,197,94,0.2)');
    grad.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.beginPath();
    ctx.moveTo(pad, pad + gh);
    data.history.forEach((v, i) => {
      const x = pad + (i / (data.history.length - 1)) * gw;
      const y = pad + gh * (1 - Math.min(v / maxVal, 1));
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad + gw, pad + gh);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Main line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.history.forEach((v, i) => {
      const x = pad + (i / (data.history.length - 1)) * gw;
      const y = pad + gh * (1 - Math.min(v / maxVal, 1));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Current value
    const lastV = data.history[data.history.length - 1];
    const lastX = pad + gw;
    const lastY = pad + gh * (1 - Math.min(lastV / maxVal, 1));
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Label
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('平均獲得額の推移', w / 2, pad - 10);
    ctx.font = '12px monospace';
    ctx.fillText('¥' + lastV.toFixed(2), lastX - 40, lastY - 10);
  }

  function drawBayes(w, h) {
    // Draw confusion matrix
    const cx = w / 2, cy = h / 2;
    const boxSize = Math.min(w, h) * 0.35;
    const gap = 10;
    
    const total = data.truePositive + data.falsePositive + data.trueNegative + data.falseNegative || 1;
    const tp = data.truePositive / total;
    const fp = data.falsePositive / total;
    const tn = data.trueNegative / total;
    const fn = data.falseNegative / total;
    
    // True Positive (top-left)
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10;
    ctx.fillRect(cx - boxSize - gap / 2, cy - boxSize - gap / 2, boxSize, boxSize);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('真陽性', cx - boxSize / 2 - gap / 2, cy - boxSize / 2 - gap / 2 - 20);
    ctx.font = '600 24px monospace';
    ctx.fillText((tp * 100).toFixed(1) + '%', cx - boxSize / 2 - gap / 2, cy - boxSize / 2 - gap / 2 + 10);
    ctx.font = '11px sans-serif';
    ctx.fillText(`(${data.truePositive})`, cx - boxSize / 2 - gap / 2, cy - boxSize / 2 - gap / 2 + 30);
    
    // False Positive (top-right)
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillRect(cx + gap / 2, cy - boxSize - gap / 2, boxSize, boxSize);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('偽陽性', cx + boxSize / 2 + gap / 2, cy - boxSize / 2 - gap / 2 - 20);
    ctx.font = '600 24px monospace';
    ctx.fillText((fp * 100).toFixed(1) + '%', cx + boxSize / 2 + gap / 2, cy - boxSize / 2 - gap / 2 + 10);
    ctx.font = '11px sans-serif';
    ctx.fillText(`(${data.falsePositive})`, cx + boxSize / 2 + gap / 2, cy - boxSize / 2 - gap / 2 + 30);
    
    // False Negative (bottom-left)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillRect(cx - boxSize - gap / 2, cy + gap / 2, boxSize, boxSize);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('偽陰性', cx - boxSize / 2 - gap / 2, cy + boxSize / 2 + gap / 2 - 20);
    ctx.font = '600 24px monospace';
    ctx.fillText((fn * 100).toFixed(1) + '%', cx - boxSize / 2 - gap / 2, cy + boxSize / 2 + gap / 2 + 10);
    ctx.font = '11px sans-serif';
    ctx.fillText(`(${data.falseNegative})`, cx - boxSize / 2 - gap / 2, cy + boxSize / 2 + gap / 2 + 30);
    
    // True Negative (bottom-right)
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.fillRect(cx + gap / 2, cy + gap / 2, boxSize, boxSize);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('真陰性', cx + boxSize / 2 + gap / 2, cy + boxSize / 2 + gap / 2 - 20);
    ctx.font = '600 24px monospace';
    ctx.fillText((tn * 100).toFixed(1) + '%', cx + boxSize / 2 + gap / 2, cy + boxSize / 2 + gap / 2 + 10);
    ctx.font = '11px sans-serif';
    ctx.fillText(`(${data.trueNegative})`, cx + boxSize / 2 + gap / 2, cy + boxSize / 2 + gap / 2 + 30);
    
    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('実際に病気', cx - boxSize / 2 - gap / 2, cy - boxSize - gap / 2 - 10);
    ctx.fillText('実際は健康', cx + boxSize / 2 + gap / 2, cy - boxSize - gap / 2 - 10);
    ctx.save();
    ctx.translate(cx - boxSize - gap / 2 - 30, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('検査陽性', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(cx - boxSize - gap / 2 - 30, cy + boxSize + gap);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('検査陰性', 0, 0);
    ctx.restore();
  }

  function drawCoupon(w, h) {
    if (data.attempts.length === 0) {
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('試行を開始してください', w / 2, h / 2);
      return;
    }
    
    // Histogram of attempts
    const max = Math.max(...data.attempts);
    const bins = Math.min(20, max);
    const binSize = Math.ceil(max / bins);
    const hist = new Array(bins).fill(0);
    
    data.attempts.forEach(a => {
      const bin = Math.min(Math.floor(a / binSize), bins - 1);
      hist[bin]++;
    });
    
    const maxCount = Math.max(...hist, 1);
    const barW = Math.min(30, (w - 80) / bins);
    const gap = 2;
    const startX = (w - (barW + gap) * bins) / 2;
    const maxH = h * 0.6;
    
    for (let i = 0; i < bins; i++) {
      const bh = (hist[i] / maxCount) * maxH;
      const x = startX + i * (barW + gap);
      const hue = 280 + i * 5;
      
      ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
      ctx.shadowBlur = 8;
      const grad = ctx.createLinearGradient(x, h * 0.8 - bh, x, h * 0.8);
      grad.addColorStop(0, `hsl(${hue}, 80%, 65%)`);
      grad.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, h * 0.8 - bh, barW, bh);
      ctx.shadowBlur = 0;
    }
    
    // Theory line
    const theory = data.numCoupons * Math.log(data.numCoupons) + 0.5772 * data.numCoupons;
    const theoryBin = Math.floor(theory / binSize);
    if (theoryBin < bins) {
      const tx = startX + theoryBin * (barW + gap) + barW / 2;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tx, h * 0.2);
      ctx.lineTo(tx, h * 0.8);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#22c55e';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('理論値', tx, h * 0.15);
    }
    
    // Title
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('試行回数の分布', w / 2, 30);
  }

  function drawRandomWalk(w, h) {
    if (data.walks.length === 0) {
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('試行を開始してください', w / 2, h / 2);
      return;
    }
    
    const pad = 40;
    const gw = w - pad * 2, gh = h - pad * 2;
    
    // Find range
    let minY = 0, maxY = 0;
    data.walks.forEach(walk => {
      walk.forEach(v => {
        minY = Math.min(minY, v);
        maxY = Math.max(maxY, v);
      });
    });
    const range = Math.max(Math.abs(minY), Math.abs(maxY), 1);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + gh / 2);
    ctx.lineTo(pad + gw, pad + gh / 2);
    ctx.stroke();
    
    // Draw walks
    data.walks.forEach((walk, idx) => {
      const alpha = 0.3 + (idx / data.walks.length) * 0.5;
      const hue = (idx / data.walks.length) * 60 + 280;
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
      ctx.lineWidth = idx === data.walks.length - 1 ? 2 : 1;
      
      ctx.beginPath();
      walk.forEach((v, i) => {
        const x = pad + (i / (walk.length - 1)) * gw;
        const y = pad + gh / 2 - (v / range) * (gh / 2) * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    
    // Labels
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', pad - 20, pad + gh / 2 + 4);
    ctx.fillText(data.maxSteps, pad + gw, pad + gh + 20);
  }

  function drawBuffon(w, h) {
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.35;
    
    // Draw parallel lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    const numLines = 5;
    for (let i = -numLines; i <= numLines; i++) {
      const y = cy + i * (scale / numLines) * (data.lineSpacing / 1);
      ctx.beginPath();
      ctx.moveTo(cx - scale, y);
      ctx.lineTo(cx + scale, y);
      ctx.stroke();
    }
    
    // Draw needles
    data.needles.forEach(n => {
      const y = cy - scale + (n.center / data.lineSpacing) * (scale * 2 / numLines);
      const halfLen = (data.needleLength / data.lineSpacing) * (scale / numLines) / 2;
      const dx = halfLen * Math.cos(n.angle);
      const dy = halfLen * Math.sin(n.angle);
      
      ctx.strokeStyle = n.hit ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + dx, y - dy);
      ctx.lineTo(cx - dx, y + dy);
      ctx.stroke();
    });
    
    // Pi estimate
    if (data.total > 0) {
      const hitRate = data.hits / data.total;
      const piEst = hitRate > 0 ? 2 * data.needleLength / (data.lineSpacing * hitRate) : 0;
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '600 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('π ≈ ' + piEst.toFixed(4), w / 2, 30);
    }
  }

  function drawSecretary(w, h) {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.3;
    
    // Draw strategy visualization
    const strategyAngle = (data.strategy / data.numCandidates) * Math.PI * 2;
    
    // Observation phase (gray)
    ctx.fillStyle = 'rgba(100,100,120,0.3)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + strategyAngle);
    ctx.closePath();
    ctx.fill();
    
    // Selection phase (green)
    ctx.fillStyle = 'rgba(34,197,94,0.3)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2 + strategyAngle, -Math.PI / 2 + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Strategy line
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const sx = cx + r * Math.cos(-Math.PI / 2 + strategyAngle);
    const sy = cy + r * Math.sin(-Math.PI / 2 + strategyAngle);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('観察フェーズ', cx - r / 2, cy - 10);
    ctx.fillText('選択フェーズ', cx + r / 2, cy + 10);
    
    ctx.font = '600 18px sans-serif';
    ctx.fillText(`${data.strategy} / ${data.numCandidates}`, cx, cy + r + 40);
    
    // Success rate
    if (totalTrials > 0) {
      const rate = (data.bestFound / totalTrials * 100).toFixed(1);
      ctx.font = '600 24px monospace';
      ctx.fillText(rate + '%', cx, cy - r - 30);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('最良選択率', cx, cy - r - 50);
    }
  }

  // --- Events ---
  runBtn.addEventListener('click', runOnce);
  run1000Btn.addEventListener('click', () => { for (let i = 0; i < 1000; i++) runOnce(); });
  resetBtn.addEventListener('click', resetData);
  settingsBtn.addEventListener('click', toggleSettings);
  expEl.addEventListener('change', () => {
    settingsVisible = false;
    resetData();
  });
  window.addEventListener('resize', resize);
  
  // Cleanup
  function cleanup() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

  resetData();
  resize();
})();
