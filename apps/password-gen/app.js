(function() {
  'use strict';

  const passwordInput = document.getElementById('password');
  const copyBtn = document.getElementById('copy');
  const generateBtn = document.getElementById('generate');
  const uppercaseCheck = document.getElementById('uppercase');
  const lowercaseCheck = document.getElementById('lowercase');
  const numbersCheck = document.getElementById('numbers');
  const symbolsCheck = document.getElementById('symbols');
  const lengthSlider = document.getElementById('length');
  const lengthValue = document.getElementById('lengthValue');
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text span');

  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  function generatePassword() {
    let charset = '';
    if (uppercaseCheck.checked) charset += UPPERCASE;
    if (lowercaseCheck.checked) charset += LOWERCASE;
    if (numbersCheck.checked) charset += NUMBERS;
    if (symbolsCheck.checked) charset += SYMBOLS;

    if (charset === '') {
      passwordInput.value = '';
      return;
    }

    const length = parseInt(lengthSlider.value);
    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    passwordInput.value = password;
    updateStrength(password, charset.length);
  }

  function updateStrength(password, charsetSize) {
    const length = password.length;
    const entropy = length * Math.log2(charsetSize);
    
    let strength = 0;
    let strengthLabel = '';
    let color = '';

    if (entropy < 40) {
      strength = 25;
      strengthLabel = '弱い';
      color = '#ef4444';
    } else if (entropy < 60) {
      strength = 50;
      strengthLabel = '普通';
      color = '#f59e0b';
    } else if (entropy < 80) {
      strength = 75;
      strengthLabel = '強い';
      color = '#10b981';
    } else {
      strength = 100;
      strengthLabel = '非常に強い';
      color = '#059669';
    }

    strengthBar.style.setProperty('--strength-width', `${strength}%`);
    strengthBar.style.setProperty('--strength-color', color);
    strengthText.textContent = strengthLabel;
    strengthText.style.color = color;
  }

  lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
  });

  generateBtn.addEventListener('click', generatePassword);

  copyBtn.addEventListener('click', () => {
    if (passwordInput.value) {
      navigator.clipboard.writeText(passwordInput.value).then(() => {
        copyBtn.textContent = '✓';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 2000);
      });
    }
  });

  [uppercaseCheck, lowercaseCheck, numbersCheck, symbolsCheck].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const anyChecked = uppercaseCheck.checked || lowercaseCheck.checked || 
                        numbersCheck.checked || symbolsCheck.checked;
      generateBtn.disabled = !anyChecked;
    });
  });

  generatePassword();

  function cleanup() {}

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
