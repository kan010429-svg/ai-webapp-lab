(function() {
  'use strict';

  const fgColorInput = document.getElementById('fg-color');
  const fgHexInput = document.getElementById('fg-hex');
  const bgColorInput = document.getElementById('bg-color');
  const bgHexInput = document.getElementById('bg-hex');
  const previewBox = document.getElementById('preview-box');
  const ratioValue = document.getElementById('ratio-value');
  const aaNormalBadge = document.getElementById('aa-normal-badge');
  const aaLargeBadge = document.getElementById('aa-large-badge');
  const aaaNormalBadge = document.getElementById('aaa-normal-badge');
  const aaaLargeBadge = document.getElementById('aaa-large-badge');

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function getContrastRatio(fg, bg) {
    const fgRgb = hexToRgb(fg);
    const bgRgb = hexToRgb(bg);
    
    if (!fgRgb || !bgRgb) return 1;
    
    const l1 = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const l2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  function updateBadge(badge, passes) {
    badge.textContent = passes ? '合格' : '不合格';
    badge.className = passes ? 'wcag-badge pass' : 'wcag-badge fail';
  }

  function updateContrast() {
    const fgColor = fgColorInput.value;
    const bgColor = bgColorInput.value;
    
    const ratio = getContrastRatio(fgColor, bgColor);
    
    previewBox.style.color = fgColor;
    previewBox.style.backgroundColor = bgColor;
    
    ratioValue.textContent = `${ratio.toFixed(2)}:1`;
    
    updateBadge(aaNormalBadge, ratio >= 4.5);
    updateBadge(aaLargeBadge, ratio >= 3);
    updateBadge(aaaNormalBadge, ratio >= 7);
    updateBadge(aaaLargeBadge, ratio >= 4.5);
  }

  function syncColorToHex(colorInput, hexInput) {
    hexInput.value = colorInput.value.toUpperCase();
    updateContrast();
  }

  function syncHexToColor(hexInput, colorInput) {
    const hex = hexInput.value.trim();
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      colorInput.value = hex;
      updateContrast();
    }
  }

  fgColorInput.addEventListener('input', () => syncColorToHex(fgColorInput, fgHexInput));
  bgColorInput.addEventListener('input', () => syncColorToHex(bgColorInput, bgHexInput));
  
  fgHexInput.addEventListener('input', () => syncHexToColor(fgHexInput, fgColorInput));
  bgHexInput.addEventListener('input', () => syncHexToColor(bgHexInput, bgColorInput));

  updateContrast();

  function cleanup() {
    fgColorInput.removeEventListener('input', syncColorToHex);
    bgColorInput.removeEventListener('input', syncColorToHex);
    fgHexInput.removeEventListener('input', syncHexToColor);
    bgHexInput.removeEventListener('input', syncHexToColor);
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
