(() => {
  'use strict';

  const inputA = document.getElementById('inputA');
  const inputB = document.getElementById('inputB');
  const compareBtn = document.getElementById('compareBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const clearBtn = document.getElementById('clearBtn');
  const ignoreWhitespace = document.getElementById('ignoreWhitespace');
  const status = document.getElementById('status');
  const diffOutput = document.getElementById('diffOutput');
  const addedCount = document.getElementById('addedCount');
  const removedCount = document.getElementById('removedCount');
  const unchangedCount = document.getElementById('unchangedCount');

  const SAMPLE_A = [
    'function greet(name) {',
    '  console.log("Hello " + name);',
    '  return true;',
    '}',
    '',
    'const list = [1, 2, 3];',
    'console.log(list.length);'
  ].join('\n');

  const SAMPLE_B = [
    'function greet(name) {',
    '  console.log(`Hello, ${name}!`);',
    '  return true;',
    '}',
    '',
    'const list = [1, 2, 3, 4];',
    'console.log(list.length);',
    'console.log("done");'
  ].join('\n');

  // Myers diff algorithm, ported from lib/diff.js (Diff.compute / Diff._buildResult).
  function computeDiff(aLines, bLines) {
    const n = aLines.length;
    const m = bLines.length;
    const max = n + m;
    const v = new Array(2 * max + 1).fill(0);
    const trace = [];

    if (max === 0) return [];

    for (let d = 0; d <= max; d++) {
      trace.push(v.slice());
      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max])) {
          x = v[k + 1 + max];
        } else {
          x = v[k - 1 + max] + 1;
        }
        let y = x - k;
        while (x < n && y < m && aLines[x] === bLines[y]) { x++; y++; }
        v[k + max] = x;
        if (x >= n && y >= m) return buildResult(trace, aLines, bLines, max);
      }
    }
    return [];
  }

  function buildResult(trace, a, b, max) {
    const ops = [];
    let x = a.length;
    let y = b.length;
    for (let d = trace.length - 1; d >= 0; d--) {
      const v = trace[d];
      const k = x - y;
      let prevK;
      if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max])) prevK = k + 1;
      else prevK = k - 1;
      const prevX = v[prevK + max];
      const prevY = prevX - prevK;
      while (x > prevX && y > prevY) {
        x--; y--;
        ops.unshift({ type: 'equal', value: a[x] });
      }
      if (d > 0) {
        if (x === prevX) { y--; ops.unshift({ type: 'insert', value: b[y] }); }
        else { x--; ops.unshift({ type: 'delete', value: a[x] }); }
      }
    }
    return ops;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function normalize(text) {
    return ignoreWhitespace.checked ? text.trim().replace(/\s+/g, ' ') : text;
  }

  function compare() {
    const rawA = inputA.value;
    const rawB = inputB.value;

    if (!rawA && !rawB) {
      showStatus('比較するテキストを入力してください', 'error');
      return;
    }

    const linesA = rawA.split('\n');
    const linesB = rawB.split('\n');
    const cmpA = linesA.map(normalize);
    const cmpB = linesB.map(normalize);

    // Compute diff on the (possibly normalized) comparison lines but display
    // the original line text for readability.
    const opsRaw = computeDiff(cmpA, cmpB);

    let ai = 0, bi = 0;
    let added = 0, removed = 0, unchanged = 0;
    const rows = [];

    opsRaw.forEach(op => {
      if (op.type === 'equal') {
        rows.push({ type: 'equal', oldNum: ai + 1, newNum: bi + 1, text: linesA[ai] });
        ai++; bi++; unchanged++;
      } else if (op.type === 'delete') {
        rows.push({ type: 'delete', oldNum: ai + 1, newNum: null, text: linesA[ai] });
        ai++; removed++;
      } else {
        rows.push({ type: 'insert', oldNum: null, newNum: bi + 1, text: linesB[bi] });
        bi++; added++;
      }
    });

    renderDiff(rows);
    addedCount.textContent = added;
    removedCount.textContent = removed;
    unchangedCount.textContent = unchanged;
    showStatus(` 比較完了 (追加 ${added} / 削除 ${removed})`, 'success');
  }

  function renderDiff(rows) {
    if (rows.length === 0) {
      diffOutput.innerHTML = '<div class="empty-state">差分はありません</div>';
      return;
    }

    const html = rows.map(row => {
      const cls = row.type === 'insert' ? 'diff-line diff-add'
        : row.type === 'delete' ? 'diff-line diff-remove'
        : 'diff-line diff-equal';
      const marker = row.type === 'insert' ? '+' : row.type === 'delete' ? '-' : ' ';
      const oldNum = row.oldNum !== null ? row.oldNum : '';
      const newNum = row.newNum !== null ? row.newNum : '';
      const text = escapeHtml(row.text) || '&nbsp;';
      return `<div class="${cls}"><span class="line-num old">${oldNum}</span><span class="line-num new">${newNum}</span><span class="line-marker">${marker}</span><span class="line-text">${text}</span></div>`;
    }).join('');

    diffOutput.innerHTML = html;
  }

  function loadSample() {
    inputA.value = SAMPLE_A;
    inputB.value = SAMPLE_B;
    showStatus(' サンプルを読み込みました', 'success');
  }

  function clearAll() {
    inputA.value = '';
    inputB.value = '';
    diffOutput.innerHTML = '<div class="empty-state">左右にテキストを入力して「差分を表示」を押してください</div>';
    addedCount.textContent = '0';
    removedCount.textContent = '0';
    unchangedCount.textContent = '0';
    showStatus(' クリアしました', 'success');
  }

  function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
  }

  compareBtn.addEventListener('click', compare);
  sampleBtn.addEventListener('click', loadSample);
  clearBtn.addEventListener('click', clearAll);

  function cleanup() {}
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
