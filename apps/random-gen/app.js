(function() {
  'use strict';

  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });

  const genNumberBtn = document.getElementById('gen-number');
  const minNumInput = document.getElementById('min-num');
  const maxNumInput = document.getElementById('max-num');
  const numberResult = document.getElementById('number-result');

  genNumberBtn.addEventListener('click', () => {
    const min = parseInt(minNumInput.value);
    const max = parseInt(maxNumInput.value);
    
    if (min > max) {
      numberResult.textContent = 'エラー: 最小値 > 最大値';
      return;
    }
    
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    numberResult.textContent = random;
  });

  const genStringBtn = document.getElementById('gen-string');
  const stringLengthInput = document.getElementById('string-length');
  const useUpperCheck = document.getElementById('use-upper');
  const useLowerCheck = document.getElementById('use-lower');
  const useNumbersCheck = document.getElementById('use-numbers');
  const useSymbolsCheck = document.getElementById('use-symbols');
  const stringResult = document.getElementById('string-result');

  genStringBtn.addEventListener('click', () => {
    const length = parseInt(stringLengthInput.value);
    let chars = '';
    
    if (useUpperCheck.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLowerCheck.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbersCheck.checked) chars += '0123456789';
    if (useSymbolsCheck.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (chars.length === 0) {
      stringResult.textContent = 'エラー: 文字種を選択してください';
      return;
    }
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    stringResult.textContent = result;
  });

  const genListBtn = document.getElementById('gen-list');
  const listItemsInput = document.getElementById('list-items');
  const listResult = document.getElementById('list-result');

  genListBtn.addEventListener('click', () => {
    const items = listItemsInput.value.split('\n').filter(item => item.trim() !== '');
    
    if (items.length === 0) {
      listResult.textContent = 'エラー: リストが空です';
      return;
    }
    
    const randomItem = items[Math.floor(Math.random() * items.length)];
    listResult.textContent = randomItem;
  });

  const rollDiceBtn = document.getElementById('roll-dice');
  const diceCountInput = document.getElementById('dice-count');
  const diceSidesSelect = document.getElementById('dice-sides');
  const diceResultsDiv = document.getElementById('dice-results');
  const diceTotalDiv = document.getElementById('dice-total');

  rollDiceBtn.addEventListener('click', () => {
    const count = parseInt(diceCountInput.value);
    const sides = parseInt(diceSidesSelect.value);
    
    diceResultsDiv.innerHTML = '';
    let total = 0;
    
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      total += roll;
      
      const diceItem = document.createElement('div');
      diceItem.className = 'dice-item';
      diceItem.textContent = roll;
      diceResultsDiv.appendChild(diceItem);
    }
    
    diceTotalDiv.textContent = `合計: ${total}`;
  });

  const flipCoinBtn = document.getElementById('flip-coin');
  const coinCountInput = document.getElementById('coin-count');
  const coinResultsDiv = document.getElementById('coin-results');
  const coinSummaryDiv = document.getElementById('coin-summary');

  flipCoinBtn.addEventListener('click', () => {
    const count = parseInt(coinCountInput.value);
    
    coinResultsDiv.innerHTML = '';
    let heads = 0;
    let tails = 0;
    
    for (let i = 0; i < count; i++) {
      const isHeads = Math.random() < 0.5;
      if (isHeads) heads++;
      else tails++;
      
      const coinItem = document.createElement('div');
      coinItem.className = 'coin-item';
      coinItem.textContent = isHeads ? '表' : '裏';
      coinResultsDiv.appendChild(coinItem);
    }
    
    coinSummaryDiv.textContent = `表: ${heads} | 裏: ${tails}`;
  });

  function cleanup() {
    tabs.forEach(tab => {
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
    });
    
    genNumberBtn.removeEventListener('click', () => {});
    genStringBtn.removeEventListener('click', () => {});
    genListBtn.removeEventListener('click', () => {});
    rollDiceBtn.removeEventListener('click', () => {});
    flipCoinBtn.removeEventListener('click', () => {});
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
