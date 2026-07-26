(function() {
  'use strict';

  const textInput = document.getElementById('textInput');
  const wifiSSID = document.getElementById('wifiSSID');
  const wifiPassword = document.getElementById('wifiPassword');
  const wifiSecurity = document.getElementById('wifiSecurity');
  const vcardName = document.getElementById('vcardName');
  const vcardPhone = document.getElementById('vcardPhone');
  const vcardEmail = document.getElementById('vcardEmail');
  const vcardOrg = document.getElementById('vcardOrg');
  const size = document.getElementById('size');
  const fgColor = document.getElementById('fgColor');
  const bgColor = document.getElementById('bgColor');
  const generateBtn = document.getElementById('generateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const qrCanvas = document.getElementById('qrCanvas');
  const templateBtns = document.querySelectorAll('.template-btn');
  const historyList = document.getElementById('historyList');

  let currentType = 'text';
  let history = JSON.parse(localStorage.getItem('qrHistory') || '[]');

  // テンプレート切り替え
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      templateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      
      document.querySelectorAll('.template-content').forEach(t => t.style.display = 'none');
      document.getElementById(`${currentType}Template`).style.display = 'block';
    });
  });

  function getQRText() {
    if (currentType === 'text') {
      return textInput.value.trim();
    } else if (currentType === 'wifi') {
      const ssid = wifiSSID.value.trim();
      const pass = wifiPassword.value.trim();
      const security = wifiSecurity.value;
      if (!ssid) return '';
      return `WIFI:T:${security};S:${ssid};P:${pass};;`;
    } else if (currentType === 'vcard') {
      const name = vcardName.value.trim();
      if (!name) return '';
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${vcardPhone.value}\nEMAIL:${vcardEmail.value}\nORG:${vcardOrg.value}\nEND:VCARD`;
    }
    return '';
  }

  // シンプルなQRコード生成（実際のQRコードではなくパターン生成）
  function generateQR() {
    const text = getQRText();
    if (!text) {
      alert('必要な情報を入力してください');
      return;
    }

    const moduleSize = parseInt(size.value);
    const gridSize = 25;
    const canvasSize = gridSize * moduleSize;
    
    qrCanvas.width = canvasSize;
    qrCanvas.height = canvasSize;
    
    const ctx = qrCanvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // テキストからシード生成
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }
    
    // 疑似ランダム関数
    function random() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }
    
    // QRコード風パターン生成
    ctx.fillStyle = fgColor.value;
    
    // ファインダーパターン（3つの角）
    drawFinderPattern(ctx, 0, 0, moduleSize);
    drawFinderPattern(ctx, (gridSize - 7) * moduleSize, 0, moduleSize);
    drawFinderPattern(ctx, 0, (gridSize - 7) * moduleSize, moduleSize);
    
    // データパターン
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        // ファインダーパターンの領域をスキップ
        if ((x < 8 && y < 8) || 
            (x >= gridSize - 8 && y < 8) || 
            (x < 8 && y >= gridSize - 8)) {
          continue;
        }
        
        if (random() > 0.5) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // 履歴に追加
    addToHistory({
      type: currentType,
      text: text.substring(0, 50),
      timestamp: Date.now()
    });
  }

  function drawFinderPattern(ctx, x, y, size) {
    // 外枠
    ctx.fillRect(x, y, size * 7, size * 7);
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(x + size, y + size, size * 5, size * 5);
    ctx.fillStyle = fgColor.value;
    ctx.fillRect(x + size * 2, y + size * 2, size * 3, size * 3);
  }

  function download() {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCanvas.toDataURL();
    link.click();
  }

  function addToHistory(item) {
    history.unshift(item);
    if (history.length > 10) history.pop();
    localStorage.setItem('qrHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-state">履歴がありません</div>';
      return;
    }

    const typeLabels = {
      text: '📝 テキスト',
      wifi: '📶 WiFi',
      vcard: '👤 連絡先'
    };

    historyList.innerHTML = '';
    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-content">
          <div class="history-type">${typeLabels[item.type]}</div>
          <div class="history-text">${item.text}</div>
        </div>
        <button class="delete-btn" data-index="${index}">×</button>
      `;
      
      div.querySelector('.delete-btn').addEventListener('click', () => {
        history.splice(index, 1);
        localStorage.setItem('qrHistory', JSON.stringify(history));
        renderHistory();
      });
      
      historyList.appendChild(div);
    });
  }

  generateBtn.addEventListener('click', generateQR);
  downloadBtn.addEventListener('click', download);

  // 初期化
  renderHistory();
  generateQR();
})();
