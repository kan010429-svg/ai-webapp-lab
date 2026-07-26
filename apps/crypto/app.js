'use strict';

// Tab switching
document.getElementById('tabs').addEventListener('click', (e) => {
  if (!e.target.classList.contains('tab')) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  e.target.classList.add('active');
  document.getElementById('panel-' + e.target.dataset.tab).classList.remove('hidden');
});

// ── Cipher ──
const CIPHERS = {
  caesar: {
    encrypt(text, key) { const shift = parseInt(key) || 3; return text.split('').map(c => shiftChar(c, shift)).join(''); },
    decrypt(text, key) { const shift = parseInt(key) || 3; return text.split('').map(c => shiftChar(c, -shift)).join(''); },
  },
  vigenere: {
    encrypt(text, key) { const k = (key || 'KEY').toUpperCase(); let ki = 0; return text.split('').map(c => { if (!/[a-zA-Z]/.test(c)) return c; const shift = k.charCodeAt(ki++ % k.length) - 65; return shiftChar(c, shift); }).join(''); },
    decrypt(text, key) { const k = (key || 'KEY').toUpperCase(); let ki = 0; return text.split('').map(c => { if (!/[a-zA-Z]/.test(c)) return c; const shift = k.charCodeAt(ki++ % k.length) - 65; return shiftChar(c, -shift); }).join(''); },
  },
  rot13: {
    encrypt(text) { return text.split('').map(c => shiftChar(c, 13)).join(''); },
    decrypt(text) { return this.encrypt(text); },
  },
  atbash: {
    encrypt(text) { return text.split('').map(c => { if (/[a-z]/.test(c)) return String.fromCharCode(219 - c.charCodeAt(0)); if (/[A-Z]/.test(c)) return String.fromCharCode(155 - c.charCodeAt(0)); return c; }).join(''); },
    decrypt(text) { return this.encrypt(text); },
  },
  base64: {
    encrypt(text) { try { return btoa(unescape(encodeURIComponent(text))); } catch { return 'Error'; } },
    decrypt(text) { try { return decodeURIComponent(escape(atob(text))); } catch { return 'Error'; } },
  },
};

function shiftChar(c, shift) {
  if (/[a-z]/.test(c)) return String.fromCharCode(((c.charCodeAt(0) - 97 + shift + 260) % 26) + 97);
  if (/[A-Z]/.test(c)) return String.fromCharCode(((c.charCodeAt(0) - 65 + shift + 260) % 26) + 65);
  return c;
}

document.getElementById('btn-encrypt').addEventListener('click', () => {
  const type = document.getElementById('cipher-type').value;
  const key = document.getElementById('cipher-key').value;
  const text = document.getElementById('cipher-input').value;
  document.getElementById('cipher-output').value = CIPHERS[type].encrypt(text, key);
});
document.getElementById('btn-decrypt').addEventListener('click', () => {
  const type = document.getElementById('cipher-type').value;
  const key = document.getElementById('cipher-key').value;
  const text = document.getElementById('cipher-input').value;
  document.getElementById('cipher-output').value = CIPHERS[type].decrypt(text, key);
});

// ── Hash ──
async function computeHash(algo, text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.getElementById('hash-input').addEventListener('input', async function() {
  const text = this.value;
  const results = document.getElementById('hash-results');
  if (!text) { results.innerHTML = ''; return; }
  const algos = [['SHA-1','SHA-1'],['SHA-256','SHA-256'],['SHA-384','SHA-384'],['SHA-512','SHA-512']];
  let html = '';
  for (const [name, algo] of algos) {
    const hash = await computeHash(algo, text);
    html += `<div class="hash-item" onclick="navigator.clipboard.writeText('${hash}')"><div class="hash-label">${name}</div><span>${hash}</span></div>`;
  }
  // Inject hash fade animation
  if (!document.getElementById('hashAnimStyle')) {
    const style = document.createElement('style');
    style.id = 'hashAnimStyle';
    style.textContent = '@keyframes hashFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }
  results.innerHTML = html;
  // Re-apply fade-in with correct delays
  results.querySelectorAll('.hash-item span').forEach((el, i) => {
    el.style.animation = `hashFadeIn 0.3s ${i * 0.08}s forwards`;
  });
});

// ── Password ──
document.getElementById('pw-length').addEventListener('input', function() { document.getElementById('pw-len-val').textContent = this.value; });

function randomFromCharset(chars, len) {
  const out = [];
  const buf = new Uint32Array(1);
  const max = Math.floor(0x100000000 / chars.length) * chars.length;
  for (let i = 0; i < len; i++) {
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= max);
    out.push(chars[x % chars.length]);
  }
  return out.join('');
}

document.getElementById('btn-gen-pw').addEventListener('click', () => {
  const len = parseInt(document.getElementById('pw-length').value, 10);
  let chars = '';
  if (document.getElementById('pw-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (document.getElementById('pw-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (document.getElementById('pw-digits').checked) chars += '0123456789';
  if (document.getElementById('pw-symbols').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
  const pw = randomFromCharset(chars, len);
  const out = document.getElementById('pw-output');
  out.textContent = pw + '  （クリックでコピー）';
  out.onclick = () => {
    navigator.clipboard.writeText(pw).then(() => {
      out.textContent = pw + '  （コピーしました）';
      setTimeout(() => { out.textContent = pw + '  （クリックでコピー）'; }, 1200);
    });
  };
  showStrength(pw, 'pw-strength');
});

function showStrength(pw, targetId) {
  let score = 0;
  if (pw.length >= 8) score++; if (pw.length >= 12) score++; if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw)) score++; if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++; if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 20) score++;
  const levels = ['非常に弱い','弱い','普通','強い','非常に強い'];
  const colors = ['#ef4444','#f59e0b','#eab308','#22c55e','#3fb950'];
  const level = Math.min(4, Math.floor(score / 2));
  const el = document.getElementById(targetId);
  el.innerHTML = `<div class="meter-bar"><div class="meter-fill" style="width:${(level+1)*20}%;background:${colors[level]};box-shadow:0 0 12px ${colors[level]}88;transition:width 0.4s ease,box-shadow 0.4s ease"></div></div><span style="color:${colors[level]};font-size:0.8rem;text-shadow:0 0 8px ${colors[level]}44">${levels[level]} (スコア: ${score}/8)</span>`;
}

document.getElementById('pw-check').addEventListener('input', function() {
  if (this.value) showStrength(this.value, 'pw-meter');
  else document.getElementById('pw-meter').innerHTML = '';
});

// ── Steganography (UTF-8 LSB in red channel) ──
const stegCanvas = document.getElementById('steg-canvas');
const sctx = stegCanvas.getContext('2d');
let stegImage = null;
let stegObjectUrl = null;

function bytesToBits(bytes) {
  let bits = '';
  for (let i = 0; i < bytes.length; i++) bits += bytes[i].toString(2).padStart(8, '0');
  return bits;
}

function bitsToBytes(bits) {
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(out);
}

document.getElementById('btn-steg-upload').addEventListener('click', () => document.getElementById('steg-file').click());
document.getElementById('steg-file').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (stegObjectUrl) URL.revokeObjectURL(stegObjectUrl);
  const img = new Image();
  img.onload = () => {
    const maxSide = 1600;
    let w = img.width, h = img.height;
    if (Math.max(w, h) > maxSide) {
      const scale = maxSide / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    stegCanvas.width = w; stegCanvas.height = h;
    sctx.drawImage(img, 0, 0, w, h);
    stegImage = sctx.getImageData(0, 0, w, h);
    stegCanvas.classList.add('visible');
    document.getElementById('steg-result').textContent = `容量目安: 約 ${Math.floor((w * h) / 8) - 1} バイト`;
  };
  stegObjectUrl = URL.createObjectURL(file);
  img.src = stegObjectUrl;
});

document.getElementById('btn-steg-encode').addEventListener('click', () => {
  if (!stegImage) {
    document.getElementById('steg-result').textContent = '先に画像を選択してください';
    return;
  }
  const text = document.getElementById('steg-text').value;
  const payload = new TextEncoder().encode(text);
  const bits = bytesToBits(payload) + '00000000';
  const capacity = stegImage.width * stegImage.height; // bits in red channel
  if (bits.length > capacity) {
    document.getElementById('steg-result').textContent =
      `テキストが長すぎます（必要 ${bits.length} bit / 容量 ${capacity} bit）`;
    return;
  }
  const data = new Uint8ClampedArray(stegImage.data);
  for (let i = 0; i < bits.length; i++) {
    data[i * 4] = (data[i * 4] & 0xFE) | (bits[i] === '1' ? 1 : 0);
  }
  const imgData = new ImageData(data, stegImage.width, stegImage.height);
  sctx.putImageData(imgData, 0, 0);
  stegImage = imgData;
  document.getElementById('steg-result').textContent = `${payload.length} バイト（UTF-8）を埋め込みました`;
});

document.getElementById('btn-steg-decode').addEventListener('click', () => {
  if (!stegCanvas.width) {
    document.getElementById('steg-result').textContent = '先に画像を選択してください';
    return;
  }
  const imgData = sctx.getImageData(0, 0, stegCanvas.width, stegCanvas.height);
  let bits = '';
  for (let i = 0; i < imgData.data.length / 4; i++) {
    bits += (imgData.data[i * 4] & 1).toString();
    if (bits.length % 8 === 0 && bits.slice(-8) === '00000000') {
      bits = bits.slice(0, -8);
      break;
    }
  }
  try {
    const text = new TextDecoder().decode(bitsToBytes(bits));
    document.getElementById('steg-result').textContent = text || '(テキストが見つかりません)';
  } catch (_) {
    document.getElementById('steg-result').textContent = '(テキストを解読できませんでした)';
  }
});

document.getElementById('btn-steg-save').addEventListener('click', () => {
  if (!stegCanvas.width) return;
  const a = document.createElement('a'); a.download = 'steg.png'; a.href = stegCanvas.toDataURL('image/png'); a.click();
});

function cleanup() {
  if (stegCanvas) sctx.clearRect(0, 0, stegCanvas.width, stegCanvas.height);
  if (stegObjectUrl) { URL.revokeObjectURL(stegObjectUrl); stegObjectUrl = null; }
  stegImage = null;
}
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);
