(() => {
  'use strict';

  const langSelect = document.getElementById('langSelect');
  const typeSelect = document.getElementById('typeSelect');
  const countInput = document.getElementById('countInput');
  const htmlWrapToggle = document.getElementById('htmlWrapToggle');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const status = document.getElementById('status');
  const resultOutput = document.getElementById('resultOutput');
  const charCount = document.getElementById('charCount');

  const MAX_COUNT = 50;

  const EN_WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore '
    + 'et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea '
    + 'commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla '
    + 'pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum').split(' ');

  // Natural-sounding Japanese filler sentences (business/UI style dummy text),
  // combined at random to build paragraphs, rather than a naive word salad.
  const JA_SENTENCES = [
    'このサービスは業務効率化を目的として開発されました。',
    '詳細な仕様については別紙を参照してください。',
    '本文はダミーテキストとして自動生成されています。',
    'ご不明な点がございましたら担当者までお問い合わせください。',
    'システムは毎日午前0時に自動的に更新されます。',
    'データはすべて暗号化された状態で保存されます。',
    '今後のスケジュールについては追ってご連絡いたします。',
    '当社は環境保全活動に積極的に取り組んでいます。',
    'このレイアウトは仮のものであり、実際の内容とは異なります。',
    'ユーザーは設定画面からテーマを変更することができます。',
    '定期的なメンテナンスにより、サービスの安定性を高めています。',
    '新機能は来月中旬にリリースされる予定です。',
    '各項目の詳細は下記の表にまとめられています。',
    'このテキストはレイアウト確認用のサンプルです。',
    'お客様の声を元にサービス内容を改善してまいります。',
    '会議の議事録は翌営業日までに共有されます。',
    'アプリケーションはオフラインでも一部機能が利用可能です。',
    '資料の内容は予告なく変更される場合があります。',
    'すべてのデータはローカル環境でのみ処理されます。',
    'この文章はテスト目的で自動的に生成されたものです。',
    '画面の表示速度はネットワーク環境により変動します。',
    '利用規約は必要に応じて改定されることがあります。',
    'サポート窓口の受付時間は平日9時から18時までです。',
    '各種設定はいつでも変更・保存が可能です。'
  ];

  const JA_WORDS = ('吾輩 猫 名前 記憶 人間 書生 見当 所 種族 顔 掌 中 巣 心持 平気 教師 語 学校 生徒 弟子 世話 '
    + '筆記 状態 学問 意味 発明 材料 出産 説明 泡 沖 見物 屋根 存在 感覚 説話 現代').split(' ');

  function randomItem(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function randomInt(min, max) {
    return min + ((Math.random() * (max - min + 1)) | 0);
  }

  function enSentence() {
    const len = randomInt(8, 18);
    const words = Array.from({ length: len }, () => randomItem(EN_WORDS));
    const sentence = words.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  }

  function enParagraph() {
    const count = randomInt(4, 7);
    return Array.from({ length: count }, enSentence).join(' ');
  }

  function jaSentence() {
    return randomItem(JA_SENTENCES);
  }

  function jaParagraph() {
    const count = randomInt(3, 6);
    return Array.from({ length: count }, jaSentence).join('');
  }

  function generateText(lang, type, count) {
    if (type === 'words') {
      const words = lang === 'ja' ? JA_WORDS : EN_WORDS;
      return Array.from({ length: count }, () => randomItem(words)).join(lang === 'ja' ? '、' : ' ');
    }
    if (type === 'sentences') {
      const sentence = lang === 'ja' ? jaSentence : enSentence;
      return Array.from({ length: count }, sentence).join(lang === 'ja' ? '' : ' ');
    }
    // paragraphs
    const paragraph = lang === 'ja' ? jaParagraph : enParagraph;
    return Array.from({ length: count }, paragraph);
  }

  function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
  }

  function generate() {
    const lang = langSelect.value;
    const type = typeSelect.value;
    let count = parseInt(countInput.value, 10);
    if (!Number.isFinite(count) || count < 1) count = 1;
    if (count > MAX_COUNT) count = MAX_COUNT;
    countInput.value = count;

    let text;
    if (type === 'paragraphs') {
      const paragraphs = generateText(lang, type, count);
      text = htmlWrapToggle.checked
        ? paragraphs.map(p => `<p>${p}</p>`).join('\n')
        : paragraphs.join('\n\n');
    } else {
      text = generateText(lang, type, count);
      if (htmlWrapToggle.checked) text = `<p>${text}</p>`;
    }

    resultOutput.value = text;
    charCount.textContent = `${text.length}文字`;
    showStatus('✓ 生成完了', 'success');
  }

  async function copyResult() {
    if (!resultOutput.value) {
      showStatus('✗ コピーするテキストがありません', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(resultOutput.value);
      showStatus('✓ コピーしました', 'success');
    } catch {
      resultOutput.select();
      document.execCommand('copy');
      showStatus('✓ コピーしました', 'success');
    }
  }

  function clearAll() {
    resultOutput.value = '';
    charCount.textContent = '0文字';
    showStatus('');
  }

  function updateCountDefaults() {
    const type = typeSelect.value;
    if (type === 'words') countInput.value = 50;
    else if (type === 'sentences') countInput.value = 5;
    else countInput.value = 3;
  }

  generateBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', copyResult);
  clearBtn.addEventListener('click', clearAll);
  typeSelect.addEventListener('change', updateCountDefaults);

  generate();

  function cleanup() {}
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
