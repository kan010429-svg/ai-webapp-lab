'use strict';

(function() {
  const diceDisplay = document.getElementById('diceDisplay');
  const resultEl = document.getElementById('result');
  const statsEl = document.getElementById('stats');
  const rollBtn = document.getElementById('rollBtn');
  const diceButtons = document.querySelectorAll('.dice-btn');
  const decreaseBtn = document.getElementById('decreaseCount');
  const increaseBtn = document.getElementById('increaseCount');
  const diceCountEl = document.getElementById('diceCount');
  const decreaseModBtn = document.getElementById('decreaseModifier');
  const increaseModBtn = document.getElementById('increaseModifier');
  const modifierEl = document.getElementById('modifier');
  const historyEl = document.getElementById('history');
  const customBtn = document.getElementById('customBtn');
  const savePresetBtn = document.getElementById('savePreset');
  const loadPresetBtn = document.getElementById('loadPreset');
  const exportHistoryBtn = document.getElementById('exportHistory');

  let currentSides = 6;
  let diceCount = 1;
  let modifier = 0;
  let history = [];
  let allRolls = [];

  function rollDice(sides) {
    // Unbiased crypto random integer in [1, sides]
    const max = Math.floor(0x100000000 / sides) * sides;
    const buf = new Uint32Array(1);
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= max);
    return (x % sides) + 1;
  }

  function animateRoll() {
    const rolls = [];
    diceDisplay.innerHTML = '';

    for (let i = 0; i < diceCount; i++) {
      const roll = rollDice(currentSides);
      rolls.push(roll);

      const dieEl = document.createElement('div');
      dieEl.className = 'die';
      dieEl.textContent = roll;
      diceDisplay.appendChild(dieEl);
    }

    const sum = rolls.reduce((s, r) => s + r, 0);
    const total = sum + modifier;
    resultEl.textContent = total;
    
    if (modifier !== 0) {
      resultEl.textContent += ` (${sum}${modifier >= 0 ? '+' : ''}${modifier})`;
    }

    allRolls.push(...rolls);
    updateStats();
    addToHistory(rolls, total, sum);
  }

  function updateStats() {
    if (allRolls.length === 0) return;
    const avg = (allRolls.reduce((s, r) => s + r, 0) / allRolls.length).toFixed(2);
    const max = Math.max(...allRolls);
    const min = Math.min(...allRolls);
    const expected = ((currentSides + 1) / 2 * diceCount + modifier).toFixed(2);
    statsEl.innerHTML = `平均: ${avg} | 最大: ${max} | 最小: ${min} | 期待値: ${expected}`;
  }

  function addToHistory(rolls, total, sum) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const historyItem = {
      rolls,
      total,
      sum,
      sides: currentSides,
      count: diceCount,
      modifier,
      timestamp
    };

    history.unshift(historyItem);
    if (history.length > 20) {
      history.pop();
    }

    renderHistory();
    saveToLocalStorage();
  }

  function renderHistory() {
    historyEl.innerHTML = history.map(item => {
      const modStr = item.modifier !== 0 ? ` ${item.modifier >= 0 ? '+' : ''}${item.modifier}` : '';
      return `
        <div class="history-item">
          ${item.timestamp} - ${item.count}D${item.sides}${modStr}: [${item.rolls.join(', ')}] = ${item.total}
        </div>
      `;
    }).join('');
  }

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem('dice_history', JSON.stringify(history.slice(0, 20)));
    } catch (_) {}
  }

  function loadFromLocalStorage() {
    history = safeParse(localStorage.getItem('dice_history'), []);
    if (!Array.isArray(history)) history = [];
    renderHistory();
  }

  function savePreset() {
    const name = prompt('プリセット名を入力してください:');
    if (!name) return;
    const presets = safeParse(localStorage.getItem('dice_presets'), {});
    presets[name] = { sides: currentSides, count: diceCount, modifier };
    try {
      localStorage.setItem('dice_presets', JSON.stringify(presets));
    } catch (_) {}
    alert('保存しました！');
  }

  function loadPreset() {
    const presets = safeParse(localStorage.getItem('dice_presets'), {});
    const names = Object.keys(presets);
    if (names.length === 0) {
      alert('保存されたプリセットがありません');
      return;
    }
    const name = prompt(`プリセットを選択:\n${names.join('\n')}`);
    if (!name || !presets[name]) return;
    const preset = presets[name];
    currentSides = preset.sides;
    diceCount = preset.count;
    modifier = preset.modifier;
    diceCountEl.textContent = diceCount;
    modifierEl.textContent = modifier >= 0 ? `+${modifier}` : modifier;
    diceButtons.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.sides) === currentSides);
    });
  }

  function exportHistory() {
    if (history.length === 0) {
      alert('履歴がありません');
      return;
    }
    const csv = 'Timestamp,Dice,Rolls,Total\n' + history.map(item => {
      const modStr = item.modifier !== 0 ? `${item.modifier >= 0 ? '+' : ''}${item.modifier}` : '';
      return `${item.timestamp},${item.count}D${item.sides}${modStr},"[${item.rolls.join(', ')}]",${item.total}`;
    }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dice_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  rollBtn.addEventListener('click', animateRoll);

  diceButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.id === 'customBtn') {
        const sides = prompt('面数を入力してください (2-1000):', '6');
        const num = parseInt(sides);
        if (num >= 2 && num <= 1000) {
          currentSides = num;
          diceButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          button.textContent = `D${num}`;
        }
        return;
      }
      diceButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentSides = parseInt(button.dataset.sides);
    });
  });

  decreaseBtn.addEventListener('click', () => {
    if (diceCount > 1) {
      diceCount--;
      diceCountEl.textContent = diceCount;
      updateStats();
    }
  });

  increaseBtn.addEventListener('click', () => {
    if (diceCount < 20) {
      diceCount++;
      diceCountEl.textContent = diceCount;
      updateStats();
    }
  });

  decreaseModBtn.addEventListener('click', () => {
    modifier--;
    modifierEl.textContent = modifier >= 0 ? `+${modifier}` : modifier;
    updateStats();
  });

  increaseModBtn.addEventListener('click', () => {
    modifier++;
    modifierEl.textContent = modifier >= 0 ? `+${modifier}` : modifier;
    updateStats();
  });

  savePresetBtn.addEventListener('click', savePreset);
  loadPresetBtn.addEventListener('click', loadPreset);
  exportHistoryBtn.addEventListener('click', exportHistory);

  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      animateRoll();
    }
  });

  loadFromLocalStorage();
  updateStats();
})();
