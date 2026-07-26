# GitHub Pages で公開する

このリポジトリは静的ファイルのみで構成されています。ビルド不要で、GitHub Pages からそのまま配信できます。

## 手順

1. GitHub のリポジトリページで **Settings → Pages** を開く
2. **Source**: Deploy from a branch
3. **Branch**: `main` / `/ (root)` を選択して Save

数分後に次の URL で公開されます。

`https://kantafukui.github.io/browser-toys/`

## ローカル確認

```bash
npx serve .
# または index.html をブラウザで直接開く
```
