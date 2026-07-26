# 公開リポジトリの作成手順

このブランチ (`gallery-public`) は、GitHub Pages 向けに厳選した 34 アプリだけのソースです。
エージェントの GitHub App トークンは **既存 private リポジトリのみ** にアクセスできるため、
空の public リポジトリは GitHub UI で先に作る必要があります。

## 手順（約2分）

1. https://github.com/new で次を作成
   - Repository name: `ai-app-lab-gallery`
   - Public
   - README なし（空でOK）
2. Cursor / GitHub App のインストール設定で、この新リポジトリへのアクセスを許可
   （または "All repositories"）
3. エージェントに「`ai-app-lab-gallery` へ push して」と依頼

またはローカルから:

```bash
git clone --branch gallery-public --single-branch https://github.com/kan010429-svg/ai-app-lab.git ai-app-lab-gallery
cd ai-app-lab-gallery
git remote set-url origin https://github.com/kan010429-svg/ai-app-lab-gallery.git
git push -u origin gallery-public:main
```

その後 Settings → Pages → Deploy from branch → `main` / root
