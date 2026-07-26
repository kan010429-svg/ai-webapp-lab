(() => {
  'use strict';

  const textEl = document.getElementById('text');
  const clearBtn = document.getElementById('clearBtn');
  const sampleBtn = document.getElementById('sampleBtn');

  const statAll = document.getElementById('statAll');
  const statLines = document.getElementById('statLines');
  const statParagraphs = document.getElementById('statParagraphs');
  const statBytes = document.getElementById('statBytes');

  const cntAllAll = document.getElementById('cntAllAll');
  const cntAllNoSpace = document.getElementById('cntAllNoSpace');
  const cntNoNlAll = document.getElementById('cntNoNlAll');
  const cntNoNlNoSpace = document.getElementById('cntNoNlNoSpace');

  const zenCountEl = document.getElementById('zenCount');
  const hanCountEl = document.getElementById('hanCount');
  const zenBar = document.getElementById('zenBar');

  const genkoPages = document.getElementById('genkoPages');
  const genkoExact = document.getElementById('genkoExact');

  const xCountEl = document.getElementById('xCount');
  const xBar = document.getElementById('xBar');

  const SAMPLE_TEXT = 'これは文字数カウンターの動作確認用サンプル文です。\n' +
    '全角文字と半角文字(ABC123)が混在しています。\n\n' +
    '段落が変わるとカウントも変わります。\n\n' +
    '詳しくはこちら https://example.com/sample をご覧ください。';

  function codePointLength(str) {
    return Array.from(str).length;
  }

  function stripNewlines(str) {
    return str.replace(/\r\n|\r|\n/g, '');
  }

  function stripSpaces(str) {
    return str.replace(/[ \t　]/g, '');
  }

  function countLines(str) {
    if (str === '') return 0;
    return str.split(/\r\n|\r|\n/).length;
  }

  function countParagraphs(str) {
    const norm = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = norm.split('\n');
    let count = 0;
    let inParagraph = false;
    for (const line of lines) {
      const blank = line.trim().length === 0;
      if (!blank && !inParagraph) {
        count++;
        inParagraph = true;
      }
      if (blank) inParagraph = false;
    }
    return count;
  }

  function isHankaku(ch) {
    const code = ch.codePointAt(0);
    if (code >= 0x0020 && code <= 0x007e) return true; // half-width ascii incl. space
    if (code >= 0xff61 && code <= 0xff9f) return true; // half-width katakana/punctuation
    if (code === 0x09 || code === 0x0a || code === 0x0d) return true; // tab/newlines treated as narrow
    return false;
  }

  function countZenHan(str) {
    const noNl = stripNewlines(str);
    let zen = 0;
    let han = 0;
    for (const ch of noNl) {
      if (isHankaku(ch)) han++;
      else zen++;
    }
    return { zen, han };
  }

  // URL は半角の URL 構成文字のみ対象(直後の全角文字などを巻き込まない)
  const URL_RE = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;

  function calcXWeight(str) {
    const urls = str.match(URL_RE) || [];
    const withoutUrls = str.replace(URL_RE, '');
    let weight = urls.length * 23;
    for (const ch of withoutUrls) {
      if (ch === '\n' || ch === '\r') {
        weight += 1;
        continue;
      }
      weight += isHankaku(ch) ? 1 : 2;
    }
    return weight;
  }

  function update() {
    const text = textEl.value;

    const all = codePointLength(text);
    statAll.textContent = all.toLocaleString('ja-JP');
    statLines.textContent = countLines(text).toLocaleString('ja-JP');
    statParagraphs.textContent = countParagraphs(text).toLocaleString('ja-JP');
    statBytes.textContent = new TextEncoder().encode(text).length.toLocaleString('ja-JP');

    cntAllAll.textContent = all.toLocaleString('ja-JP');
    cntAllNoSpace.textContent = codePointLength(stripSpaces(text)).toLocaleString('ja-JP');
    cntNoNlAll.textContent = codePointLength(stripNewlines(text)).toLocaleString('ja-JP');
    cntNoNlNoSpace.textContent = codePointLength(stripSpaces(stripNewlines(text))).toLocaleString('ja-JP');

    const { zen, han } = countZenHan(text);
    zenCountEl.textContent = zen.toLocaleString('ja-JP');
    hanCountEl.textContent = han.toLocaleString('ja-JP');
    const zenHanTotal = zen + han;
    zenBar.style.width = zenHanTotal > 0 ? `${(zen / zenHanTotal) * 100}%` : '0%';

    const genkoTotal = all;
    genkoExact.textContent = (genkoTotal / 400).toFixed(2);
    genkoPages.textContent = genkoTotal === 0 ? '0' : Math.ceil(genkoTotal / 400).toLocaleString('ja-JP');

    const xWeight = calcXWeight(text);
    xCountEl.textContent = xWeight.toLocaleString('ja-JP');
    const xRatio = Math.min(xWeight / 280, 1);
    xBar.style.width = `${xRatio * 100}%`;
    xBar.classList.toggle('over', xWeight > 280);
  }

  textEl.addEventListener('input', update);

  clearBtn.addEventListener('click', () => {
    textEl.value = '';
    textEl.focus();
    update();
  });

  sampleBtn.addEventListener('click', () => {
    textEl.value = SAMPLE_TEXT;
    update();
  });

  update();
})();
