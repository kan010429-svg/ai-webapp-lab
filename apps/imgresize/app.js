'use strict';

(() => {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const settingsPanel = document.getElementById('settingsPanel');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const aspectLock = document.getElementById('aspectLock');
  const scaleButtons = document.querySelectorAll('.scale-btn');
  const formatSelect = document.getElementById('formatSelect');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValue = document.getElementById('qualityValue');
  const applyAllBtn = document.getElementById('applyAllBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const fileList = document.getElementById('fileList');
  const cardTemplate = document.getElementById('fileCardTemplate');

  let items = [];
  let nextId = 1;
  let scaleFactor = null;
  const objectUrls = new Set();

  function trackUrl(url) {
    objectUrls.add(url);
    return url;
  }

  function revokeUrl(url) {
    if (url && objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.delete(url);
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function extForFormat(fmt) {
    if (fmt === 'image/png') return 'png';
    if (fmt === 'image/webp') return 'webp';
    return 'jpg';
  }

  function baseName(name) {
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(0, idx) : name;
  }

  function computeTargetSize(item) {
    const ow = item.originalWidth;
    const oh = item.originalHeight;
    if (scaleFactor) {
      return {
        w: Math.max(1, Math.round(ow * scaleFactor)),
        h: Math.max(1, Math.round(oh * scaleFactor)),
      };
    }
    const w = parseInt(widthInput.value, 10) || null;
    const h = parseInt(heightInput.value, 10) || null;
    if (aspectLock.checked) {
      if (w) return { w, h: Math.max(1, Math.round((w * oh) / ow)) };
      if (h) return { w: Math.max(1, Math.round((h * ow) / oh)), h };
      return { w: ow, h: oh };
    }
    return { w: w || ow, h: h || oh };
  }

  function addFiles(fileList_) {
    const files = Array.from(fileList_).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    settingsPanel.hidden = false;
    files.forEach(loadFile);
  }

  function loadFile(file) {
    const url = trackUrl(URL.createObjectURL(file));
    const img = new Image();
    img.onload = () => {
      const item = {
        id: nextId++,
        file,
        name: file.name,
        originalBytes: file.size,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        img,
        resultBlob: null,
        resultUrl: null,
        resultWidth: 0,
        resultHeight: 0,
      };
      revokeUrl(url);
      items.push(item);
      renderCard(item);
      processItem(item);
    };
    img.onerror = () => {
      revokeUrl(url);
    };
    img.src = url;
  }

  function renderCard(item) {
    const node = cardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = String(item.id);

    const srcCanvas = node.querySelector('.src-canvas');
    const outCanvas = node.querySelector('.out-canvas');
    const originalMeta = node.querySelector('.original-meta');
    const resultMeta = node.querySelector('.result-meta');
    const ratioBadge = node.querySelector('.ratio-badge');
    const downloadBtn = node.querySelector('.card-download-btn');
    const removeBtn = node.querySelector('.card-remove-btn');

    const maxThumb = 300;
    const scale = Math.min(1, maxThumb / Math.max(item.originalWidth, item.originalHeight));
    srcCanvas.width = Math.max(1, Math.round(item.originalWidth * scale));
    srcCanvas.height = Math.max(1, Math.round(item.originalHeight * scale));
    const sctx = srcCanvas.getContext('2d');
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(item.img, 0, 0, srcCanvas.width, srcCanvas.height);

    originalMeta.textContent = `${item.name} — ${item.originalWidth}×${item.originalHeight} / ${formatBytes(item.originalBytes)}`;

    downloadBtn.addEventListener('click', () => downloadItem(item));
    removeBtn.addEventListener('click', () => removeItem(item.id, node));

    item.el = node;
    item.outCanvas = outCanvas;
    item.resultMeta = resultMeta;
    item.ratioBadge = ratioBadge;
    item.downloadBtn = downloadBtn;

    fileList.appendChild(node);
  }

  function processItem(item) {
    const { w, h } = computeTargetSize(item);
    item.outCanvas.width = w;
    item.outCanvas.height = h;
    const octx = item.outCanvas.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.clearRect(0, 0, w, h);
    octx.drawImage(item.img, 0, 0, w, h);

    const format = formatSelect.value;
    const quality = parseInt(qualitySlider.value, 10) / 100;
    const args = format === 'image/png' ? [format] : [format, quality];

    item.outCanvas.toBlob((blob) => {
      if (!blob) return;
      if (item.resultUrl) revokeUrl(item.resultUrl);
      item.resultBlob = blob;
      item.resultUrl = trackUrl(URL.createObjectURL(blob));
      item.resultWidth = w;
      item.resultHeight = h;
      updateResultUi(item);
    }, ...args);
  }

  function updateResultUi(item) {
    if (!item.resultBlob) return;
    item.resultMeta.textContent = `${item.resultWidth}×${item.resultHeight} / ${formatBytes(item.resultBlob.size)}`;
    const diff = item.originalBytes - item.resultBlob.size;
    const pct = item.originalBytes ? Math.round((diff / item.originalBytes) * 100) : 0;
    item.ratioBadge.hidden = false;
    if (pct >= 0) {
      item.ratioBadge.textContent = `${pct}% 削減`;
      item.ratioBadge.classList.remove('negative');
    } else {
      item.ratioBadge.textContent = `${Math.abs(pct)}% 増加`;
      item.ratioBadge.classList.add('negative');
    }
    item.downloadBtn.disabled = false;
  }

  function downloadItem(item) {
    if (!item.resultUrl) return;
    const ext = extForFormat(formatSelect.value);
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `${baseName(item.name)}_${item.resultWidth}x${item.resultHeight}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function removeItem(id, node) {
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const item = items[idx];
    if (item.resultUrl) revokeUrl(item.resultUrl);
    items.splice(idx, 1);
    node.remove();
    if (!items.length) settingsPanel.hidden = true;
  }

  function applyToAll() {
    items.forEach(processItem);
  }

  fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    fileInput.value = '';
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  });

  widthInput.addEventListener('input', () => {
    scaleFactor = null;
    scaleButtons.forEach((b) => b.classList.remove('active'));
    if (aspectLock.checked && items.length) {
      const first = items[0];
      const w = parseInt(widthInput.value, 10);
      if (w) heightInput.value = String(Math.max(1, Math.round((w * first.originalHeight) / first.originalWidth)));
    }
  });

  heightInput.addEventListener('input', () => {
    scaleFactor = null;
    scaleButtons.forEach((b) => b.classList.remove('active'));
    if (aspectLock.checked && items.length) {
      const first = items[0];
      const h = parseInt(heightInput.value, 10);
      if (h) widthInput.value = String(Math.max(1, Math.round((h * first.originalWidth) / first.originalHeight)));
    }
  });

  scaleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      scaleFactor = parseFloat(btn.dataset.scale);
      widthInput.value = '';
      heightInput.value = '';
      scaleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyToAll();
    });
  });

  formatSelect.addEventListener('change', () => {
    qualitySlider.disabled = formatSelect.value === 'image/png';
    applyToAll();
  });

  qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value;
  });

  qualitySlider.addEventListener('change', () => applyToAll());

  applyAllBtn.addEventListener('click', applyToAll);

  downloadAllBtn.addEventListener('click', () => {
    items.forEach((item, i) => setTimeout(() => downloadItem(item), i * 300));
  });

  clearAllBtn.addEventListener('click', () => {
    items.forEach((item) => {
      if (item.resultUrl) revokeUrl(item.resultUrl);
    });
    items = [];
    fileList.innerHTML = '';
    settingsPanel.hidden = true;
  });

  function cleanup() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
  }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
