# Browser Toys

ビルド不要・依存ゼロのバニラ JavaScript アプリを **10本** 厳選した公開用ギャラリーです。

## 使い方

```bash
npx serve .
# または index.html をブラウザで直接開く
```

## GitHub Pages

詳細は [PUBLISH.md](PUBLISH.md) を参照。

公開後: `https://kantafukui.github.io/browser-toys/`

## アプリ一覧

4つのカテゴリに整理しています。関連する単機能アプリはハブ（統合アプリ）にまとめています。ハブは各アプリを1画面で切り替えて利用できます。

### 🛠 ツール

| アプリ | 説明 |
|--------|------|
| 📝 **[TextTools](apps/texttools/index.html)** | テキスト統合ハブ。文字数カウンター・Lorem Generator・Diff Viewer・Regex Lab を1画面で切り替え。 |
| 🖼️ **[画像リサイズ・圧縮](apps/imgresize/index.html)** | 画像リサイズ・圧縮ツール。JPEG/PNG/WebP出力と品質調整に対応。処理はすべてブラウザ内Canvasで完結。 |
| 🔍 **[Color Contrast Checker](apps/contrast-checker/index.html)** | カラーコントラストチェッカー。前景色・背景色のコントラスト比を計算、WCAG AA/AAA基準の合否判定。アクセシビリティ対応に最適。 |
| 🔐 **[Crypto Lab](apps/crypto/index.html)** | 暗号・ハッシュ・パスワード生成ツール。古典暗号は学習用。SHAハッシュとステガノグラフィー対応。 |
| 🧮 **[CalcTools](apps/calctools/index.html)** | 計算機統合アプリ。電卓・関数グラフ・単位変換・割り勘・営業日・和暦西暦・BMI・ローン・サイコロの9機能を1画面で。 |
| ⏰ **[ClockTools](apps/clocktools/index.html)** | 時計・タイマー統合アプリ。クロック（デジタル・ワード・2進数）・世界時計・ストップウォッチ・タイマー・ポモドーロ・インターバルの5機能。 |

### 🎨 ビジュアル・アート

| アプリ | 説明 |
|--------|------|
| 🎨 **[ArtLab](apps/artlab/index.html)** | ジェネラティブアート・ランチャー。Cosmos・Fireworks・Glitch Art・Matrix Rain・Spirograph・Starfield・Weather Art を1画面で切り替え、iframeプレビュー＋全画面表示できるハブ。 |

### 🔬 シミュレーション・科学

| アプリ | 説明 |
|--------|------|
| 🪐 **[PhysicsLab](apps/physicslab/index.html)** | 物理・天体シミュレーション統合ハブ。Life・Orbit Simulator・Pendulum Wave・Solar System を1画面で切り替え。 |
| 📈 **[LearnViz](apps/learnviz/index.html)** | 学習・可視化統合ハブ。SortViz・ProbSim・Fourier Draw を1画面で切り替え。 |

### 🎵 音・オーディオ

| アプリ | 説明 |
|--------|------|
| 🎵 **[SoundLab](apps/soundlab/index.html)** | 音・オーディオ統合ハブ。Metronome・Tuner・Synthy・Waveform を1画面で切り替え。 |

## テーマ

ギャラリー・各ハブ・個別アプリは **Cyber**（デフォルト）/ **Lab** を右上（またはツールバー）の切替で変更できます。選択は `localStorage`（`bt-theme`）に保存され、ページ間で共有されます。ギャラリーカードにはアプリごとのミニプレビュー（Canvas）を表示します。

## 技術

- フレームワーク / ビルドツールなし
- npm 依存なし（テーマ用フォントのみ Google Fonts を任意利用。オフライン時はシステムフォントにフォールバック）
- 各アプリは `apps/<name>/` に自己完結
- 共有テーマ: `theme.css` / `theme.js`
