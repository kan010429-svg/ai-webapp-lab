# Browser Toys

ビルド不要・依存ゼロのバニラ JavaScript アプリを **28本** 厳選した公開用ギャラリーです。

## 使い方

```bash
npx serve .
# または index.html をブラウザで直接開く
```

## GitHub Pages

詳細は [PUBLISH.md](PUBLISH.md) を参照。

公開後: `https://kantafukui.github.io/browser-toys/`

## アプリ一覧

### 🧰 ツール・生産性

| アプリ | 説明 |
|--------|------|
| 🎰 **[Dice Roller](apps/dice/index.html)** | サイコロシミュレーター。D4〜D20対応、複数個同時振り、履歴記録、アニメーション。 |
| 🔤 **[文字数カウンター](apps/charcount/index.html)** | 文字数カウンター。改行・空白の扱い別カウントと全角・半角の内訳、原稿用紙換算・SNS文字数チェックに対応。 |
| 🖼️ **[画像リサイズ・圧縮](apps/imgresize/index.html)** | 画像リサイズ・圧縮ツール。JPEG/PNG/WebP出力と品質調整に対応。処理はすべてブラウザ内Canvasで完結。 |

### ⏰ 時計・タイマー

| アプリ | 説明 |
|--------|------|
| ⏰ **[ClockTools](apps/clocktools/index.html)** | 時計・タイマー統合アプリ。クロック（デジタル・ワード・2進数）・世界時計・ストップウォッチ・タイマー・ポモドーロ・インターバルの5機能。 |

### 🧮 計算機

| アプリ | 説明 |
|--------|------|
| 🧮 **[CalcTools](apps/calctools/index.html)** | 計算機統合アプリ。電卓・関数グラフ・単位変換・割り勘・営業日・和暦西暦・BMI・ローン・ハッシュの9機能を1画面で。 |

### 📊 ビジュアライゼーション

| アプリ | 説明 |
|--------|------|
| ☀️ **[Solar System](apps/solar-system/index.html)** | 太陽系ビューアー。惑星の軌道アニメーション、詳細情報表示。直径・質量・公転周期・温度・衛星数などのデータ付き。 |
| 📊 **[SortViz](apps/sortviz/index.html)** | 8種類のソートアルゴリズムをリアルタイムで可視化。比較・交換回数の統計、計算量の表示付き。 |

### 🔬 シミュレーション

| アプリ | 説明 |
|--------|------|
| 🦠 **[Life](apps/life/index.html)** | Conway's Game of Life。セルオートマトンをインタラクティブに操作。グライダー銃など有名パターンのプリセット付き。 |
| 🛸 **[Orbit Simulator](apps/orbit/index.html)** | 軌道シミュレーター。太陽系・連星系・トロヤ群・8の字軌道。トレイル描画、速度調整。 |
| 🔔 **[Pendulum Wave](apps/pendulum/index.html)** | 振り子波シミュレーション。ウェーブ・二重振り子・自由モード、トレイル効果。 |

### 🎵 音楽・オーディオ

| アプリ | 説明 |
|--------|------|
| 🎶 **[Metronome](apps/metronome/index.html)** | 音楽練習用メトロノーム。BPM調整、タップテンポ、プリセット、アクセント設定。 |
| 🎛️ **[Synthy](apps/synthy/index.html)** | Web Audio APIシンセサイザー。4波形、フィルター、ADSR、波形ビジュアライザー付き。PCキーボードで演奏可能。 |
| 🎸 **[Tuner](apps/tuner/index.html)** | 楽器チューナー。マイク入力で音程検出、セント表示、基準音再生。 |
| 📻 **[Waveform](apps/waveform/index.html)** | マイク入力に反応するオーディオビジュアライザー。有機体・幾何学・パーティクル・波紋・オーロラの5モード。全画面没入体験。 |

### 🎨 ジェネラティブアート

| アプリ | 説明 |
|--------|------|
| 🌌 **[Cosmos](apps/cosmos/index.html)** | プロシージャル宇宙ジェネレーター。星雲・星・流れ星をシード値で生成。5種のカラーパレット、PNG保存対応。 |
| 🎆 **[Fireworks](apps/fireworks/index.html)** | 花火シミュレーション。クリックで打ち上げ、自動モード、パーティクル物理。 |
| 📺 **[Glitch Art](apps/glitch/index.html)** | グリッチアートジェネレーター。RGBシフト、ピクセルソート、スキャンライン、VHS、色収差。7エフェクト。 |
| 🟩 **[Matrix Rain](apps/matrix/index.html)** | マトリックスデジタルレイン。カタカナ・バイナリ・HEX・漢字の4文字セット、5カラースキーム。 |
| 🎪 **[Spirograph](apps/spirograph/index.html)** | スピログラフ。R/r/dパラメータで幾何学模様を描画。4カラーモード、PNG保存。 |
| ⭐ **[Starfield](apps/starfield/index.html)** | スターフィールド。ワープスピード風の星空アニメーション。マウスで方向操作。 |
| 🌤️ **[Weather Art](apps/weather/index.html)** | 天気アート。晴れ・雨・雪・嵐・オーロラの5つの天気をビジュアル表現。 |

### 💻 開発ツール

| アプリ | 説明 |
|--------|------|
| 🔍 **[Color Contrast Checker](apps/contrast-checker/index.html)** | カラーコントラストチェッカー。前景色・背景色のコントラスト比を計算、WCAG AA/AAA基準の合否判定。アクセシビリティ対応に最適。 |
| 🔐 **[Crypto Lab](apps/crypto/index.html)** | 暗号・ハッシュ・パスワード生成ツール。古典暗号は学習用。SHAハッシュとステガノグラフィー対応。 |
| 🔀 **[Diff Viewer](apps/diffview/index.html)** | テキスト差分ビューア。2つのテキストを行単位で比較し、追加・削除をハイライト表示。サンプル読み込み付き。 |
| 📝 **[Lorem Generator](apps/loremgen/index.html)** | ダミーテキスト生成ツール。Lorem Ipsumと日本語に対応し、段落・文・単語単位で数量を指定して生成。 |
| 🔍 **[Regex Lab](apps/regex/index.html)** | 正規表現ビジュアルデバッガー。リアルタイムマッチハイライト、グループ表示、7プリセット、チートシート付き。 |

### 📚 学習・教育

| アプリ | 説明 |
|--------|------|
| 🎡 **[Fourier Draw](apps/fourier/index.html)** | フーリエ変換お絵かき。手描き図形をエピサイクル（回転円の連鎖）で再現。ハート・星・π等プリセット。 |
| 🎲 **[ProbSim](apps/probsim/index.html)** | 確率シミュレーター。モンティ・ホール、誕生日のパラドックス、モンテカルロ法など複数の実験。 |

## 技術

- フレームワーク / ビルドツールなし
- 外部 CDN・npm 依存なし
- 各アプリは `apps/<name>/` に自己完結
