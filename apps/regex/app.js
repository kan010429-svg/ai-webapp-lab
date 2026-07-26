'use strict';
(function() {
const audio = new (window.AudioContext || window.webkitAudioContext)();
function beep(f, d) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.connect(g); g.connect(audio.destination);
  o.frequency.value = f; g.gain.setValueAtTime(0.05, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + d);
  o.start(); o.stop(audio.currentTime + d);
}

const PRESETS = [
  { name: 'メールアドレス', regex: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', flags: 'g', test: 'user@example.com\ninvalid@\ntest.name@domain.co.jp' },
  { name: 'URL', regex: 'https?://[\\w./\\-?=&#]+', flags: 'g', test: 'Visit https://example.com or http://test.org/path?q=1' },
  { name: 'HTMLタグ', regex: '<(\\w+)(\\s[^>]*)?>([^<]*)<\\/\\1>', flags: 'g', test: '<div class="box">Hello</div>\n<p>World</p>\n<span>!</span>' },
  { name: '日付 (YYYY-MM-DD)', regex: '(\\d{4})-(\\d{2})-(\\d{2})', flags: 'g', test: '2025-01-15\n2024-12-31\nnot-a-date' },
  { name: '電話番号', regex: '0\\d{1,4}-\\d{1,4}-\\d{4}', flags: 'g', test: '03-1234-5678\n090-1234-5678\n0120-123-4567' },
  { name: 'IPv4', regex: '(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})', flags: 'g', test: '192.168.1.1\n10.0.0.255\n999.999.999.999' },
  { name: 'カラーコード', regex: '#([0-9a-fA-F]{3,8})', flags: 'gi', test: '#ff6b6b\n#333\n#58a6ff80\nno color here' },
];

const CHEATSHEET = [
  { title: '文字クラス', items: [
    ['.', '任意の1文字（改行以外）'], ['\\d', '数字 [0-9]'], ['\\w', '単語文字 [a-zA-Z0-9_]'],
    ['\\s', '空白文字'], ['\\D', '数字以外'], ['\\W', '単語文字以外'], ['\\S', '空白以外'],
  ]},
  { title: 'アンカー', items: [
    ['^', '行頭'], ['$', '行末'], ['\\b', '単語境界'],
  ]},
  { title: '量指定子', items: [
    ['*', '0回以上'], ['+', '1回以上'], ['?', '0回か1回'],
    ['{n}', 'ちょうどn回'], ['{n,m}', 'n〜m回'], ['{n,}', 'n回以上'],
  ]},
  { title: 'グループ・参照', items: [
    ['(abc)', 'キャプチャグループ'], ['(?:abc)', '非キャプチャグループ'],
    ['(?<name>abc)', '名前付きグループ'], ['\\1', '後方参照'],
    ['a|b', 'OR（aまたはb）'],
  ]},
  { title: '先読み・後読み', items: [
    ['(?=abc)', '肯定先読み'], ['(?!abc)', '否定先読み'],
    ['(?<=abc)', '肯定後読み'], ['(?<!abc)', '否定後読み'],
  ]},
  { title: 'フラグ', items: [
    ['g', 'グローバル（全マッチ）'], ['i', '大文字小文字無視'],
    ['m', '複数行モード'], ['s', 'dotAll（.が改行にもマッチ）'],
  ]},
];

const GROUP_COLORS = ['var(--group1)', 'var(--group2)', 'var(--group3)', 'var(--group4)'];

const regexInput = document.getElementById('regex-input');
const flagsInput = document.getElementById('flags-input');
const testInput = document.getElementById('test-input');
const testDisplay = document.getElementById('test-display');
const matchResults = document.getElementById('match-results');
const regexError = document.getElementById('regex-error');
const regexExplain = document.getElementById('regex-explain');
const matchCount = document.getElementById('match-count');
const groupCount = document.getElementById('group-count');
const execTime = document.getElementById('exec-time');
const presetsSelect = document.getElementById('presets');
const modeTabs = document.querySelectorAll('.mode-tab');
const testMode = document.getElementById('testMode');
const replaceMode = document.getElementById('replaceMode');
const replaceInput = document.getElementById('replace-input');
const replaceSource = document.getElementById('replace-source');
const replaceResult = document.getElementById('replace-result');
const btnReplace = document.getElementById('btn-replace');
const btnSave = document.getElementById('btn-save');
const btnSaved = document.getElementById('btn-saved');
const savedModal = document.getElementById('savedModal');
const savedList = document.getElementById('saved-list');

let savedRegexes = JSON.parse(localStorage.getItem('savedRegexes') || '[]');
let currentMode = 'test';

// Populate presets
PRESETS.forEach((p, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = p.name;
  presetsSelect.appendChild(opt);
});

presetsSelect.addEventListener('change', () => {
  const p = PRESETS[presetsSelect.value];
  if (p) {
    regexInput.value = p.regex;
    flagsInput.value = p.flags;
    testInput.value = p.test;
    replaceSource.value = p.test;
    evaluate();
    beep(400, 0.1);
  }
});

// Mode switching
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    modeTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
    
    if (currentMode === 'test') {
      testMode.style.display = 'flex';
      replaceMode.style.display = 'none';
    } else {
      testMode.style.display = 'none';
      replaceMode.style.display = 'flex';
    }
  });
});

// Save/Load
btnSave.addEventListener('click', () => {
  const name = prompt('正規表現の名前を入力:');
  if (!name) return;
  
  savedRegexes.push({
    name,
    regex: regexInput.value,
    flags: flagsInput.value,
    timestamp: Date.now()
  });
  
  localStorage.setItem('savedRegexes', JSON.stringify(savedRegexes));
  alert('保存しました');
  beep(500, 0.1);
});

btnSaved.addEventListener('click', () => {
  renderSaved();
  savedModal.style.display = 'flex';
});

document.getElementById('btn-close-saved').addEventListener('click', () => {
  savedModal.style.display = 'none';
});

function renderSaved() {
  if (savedRegexes.length === 0) {
    savedList.innerHTML = '<div class="empty-state">保存された正規表現がありません</div>';
    return;
  }
  
  savedList.innerHTML = '';
  savedRegexes.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `
      <div class="saved-content"><div class="saved-name">${escapeHtml(item.name)}</div><div class="saved-regex">/${escapeHtml(item.regex)}/${item.flags}</div></div><div class="saved-actions"><button class="use-btn" data-index="${index}">Use</button><button class="delete-btn" data-index="${index}">Delete</button></div>`;
    
    div.querySelector('.use-btn').addEventListener('click', () => {
      regexInput.value = item.regex;
      flagsInput.value = item.flags;
      evaluate();
      savedModal.style.display = 'none';
    });
    
    div.querySelector('.delete-btn').addEventListener('click', () => {
      savedRegexes.splice(index, 1);
      localStorage.setItem('savedRegexes', JSON.stringify(savedRegexes));
      renderSaved();
    });
    
    savedList.appendChild(div);
  });
}

// Replace function
btnReplace.addEventListener('click', () => {
  const pattern = regexInput.value;
  const flags = flagsInput.value;
  const text = replaceSource.value;
  const replacement = replaceInput.value;
  
  if (!pattern) {
    alert('正規表現を入力してください');
    return;
  }
  
  try {
    const re = new RegExp(pattern, flags);
    const result = text.replace(re, replacement);
    replaceResult.textContent = result;
  } catch (e) {
    replaceResult.textContent = 'エラー: ' + e.message;
  }
});

// Explain regex
function explainRegex(pattern) {
  if (!pattern) return '';
  
  const explanations = [];
  
  if (pattern.includes('\\d')) explanations.push('数字にマッチ');
  if (pattern.includes('\\w')) explanations.push('単語文字にマッチ');
  if (pattern.includes('\\s')) explanations.push('空白にマッチ');
  if (pattern.includes('+')) explanations.push('1回以上の繰り返し');
  if (pattern.includes('*')) explanations.push('0回以上の繰り返し');
  if (pattern.includes('?')) explanations.push('0回または1回');
  if (pattern.includes('^')) explanations.push('行頭にマッチ');
  if (pattern.includes('$')) explanations.push('行末にマッチ');
  if (pattern.includes('(') && pattern.includes(')')) explanations.push('グループキャプチャ');
  if (pattern.includes('[') && pattern.includes(']')) explanations.push('文字クラス');
  if (pattern.includes('|')) explanations.push('OR条件');
  
  return explanations.length > 0 ? explanations.join(' / ') : '';
}

// Cheatsheet
const cheatBody = document.getElementById('cheat-body');
CHEATSHEET.forEach(section => {
  const div = document.createElement('div');
  div.className = 'cheat-section';
  div.innerHTML = `<h3>${section.title}</h3>` +
    section.items.map(([code, desc]) => `<div class="cheat-row"><code>${escapeHtml(code)}</code><span>${desc}</span></div>`).join('');
  cheatBody.appendChild(div);
});

document.getElementById('btn-cheat').addEventListener('click', () => {
  document.getElementById('cheatsheet').classList.add('visible');
});
document.getElementById('btn-close-cheat').addEventListener('click', () => {
  document.getElementById('cheatsheet').classList.remove('visible');
});
document.getElementById('cheatsheet').addEventListener('click', (e) => {
  if (e.target.id === 'cheatsheet') e.target.classList.remove('visible');
});

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function evaluate() {
  const pattern = regexInput.value;
  const flags = flagsInput.value;
  const text = testInput.value;

  regexError.textContent = '';
  matchResults.innerHTML = '';
  testDisplay.innerHTML = '';
  matchCount.textContent = '0 マッチ';
  groupCount.textContent = '0 グループ';
  execTime.textContent = '0ms';
  regexExplain.textContent = explainRegex(pattern);

  if (!pattern) {
    testDisplay.textContent = text;
    return;
  }

  let re;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    regexError.textContent = e.message;
    testDisplay.textContent = text;
    return;
  }

  const t0 = performance.now();
  const matches = [];
  let m;

  if (flags.includes('g')) {
    while ((m = re.exec(text)) !== null) {
      matches.push({ index: m.index, value: m[0], groups: [...m].slice(1), length: m[0].length });
      if (m[0].length === 0) re.lastIndex++;
      if (matches.length > 500) break;
    }
  } else {
    m = re.exec(text);
    if (m) matches.push({ index: m.index, value: m[0], groups: [...m].slice(1), length: m[0].length });
  }

  const elapsed = (performance.now() - t0).toFixed(2);
  execTime.textContent = elapsed + 'ms';
  matchCount.textContent = matches.length + ' マッチ';

  const numGroups = matches.length > 0 ? matches[0].groups.length : 0;
  groupCount.textContent = numGroups + ' グループ';

  // Highlight text
  let html = '';
  let lastIdx = 0;
  for (const match of matches) {
    html += escapeHtml(text.slice(lastIdx, match.index));
    html += `<mark class="m0" style="box-shadow:0 0 8px rgba(250,180,100,0.4);animation:matchPulse 1.5s ease-in-out infinite;border-radius:2px">${escapeHtml(match.value)}</mark>`;
    lastIdx = match.index + match.length;
  }
  html += escapeHtml(text.slice(lastIdx));
  // Inject pulse animation
  if (!document.getElementById('regexPulseStyle')) {
    const style = document.createElement('style');
    style.id = 'regexPulseStyle';
    style.textContent = '@keyframes matchPulse{0%,100%{box-shadow:0 0 6px rgba(250,180,100,0.3)}50%{box-shadow:0 0 14px rgba(250,180,100,0.6)}}';
    document.head.appendChild(style);
  }
  testDisplay.innerHTML = html;

  // Match results panel
  matches.forEach((match, i) => {
    const div = document.createElement('div');
    div.className = 'match-item';
    div.style.transition = 'transform 0.2s, box-shadow 0.2s';
    div.addEventListener('mouseenter', () => {
      div.style.transform = 'translateX(4px)';
      div.style.boxShadow = '0 0 12px rgba(137,180,250,0.2)';
    });
    div.addEventListener('mouseleave', () => {
      div.style.transform = '';
      div.style.boxShadow = '';
    });
    let inner = `<div class="match-index">マッチ #${i + 1} (位置: ${match.index})</div>`;
    inner += `<div class="match-value">${escapeHtml(match.value)}</div>`;
    if (match.groups.length > 0) {
      inner += '<div class="match-groups">';
      match.groups.forEach((g, gi) => {
        const bg = GROUP_COLORS[gi % GROUP_COLORS.length];
        inner += `<div class="match-group" style="background:${bg}">グループ${gi + 1}: ${g !== undefined ? escapeHtml(g) : '(未マッチ)'}</div>`;
      });
      inner += '</div>';
    }
    div.innerHTML = inner;
    matchResults.appendChild(div);
  });
}

regexInput.addEventListener('input', evaluate);
flagsInput.addEventListener('input', evaluate);
testInput.addEventListener('input', evaluate);
replaceSource.addEventListener('input', () => {
  if (currentMode === 'replace') {
    testInput.value = replaceSource.value;
  }
});

// Default
testInput.value = 'Hello World!\nfoo@bar.com\n2025-02-18\nhttps://example.com';
replaceSource.value = testInput.value;
regexInput.value = '(\\w+)@(\\w+\\.\\w+)';
evaluate();

function cleanup() { audio.close(); }
addEventListener('beforeunload', cleanup);
addEventListener('pagehide', cleanup);
})();
