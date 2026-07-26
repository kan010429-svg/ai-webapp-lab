# Browser Toys

ビルド不要・依存ゼロのバニラ JavaScript アプリ集（静的サイト）。各アプリは `apps/<name>/` に自己完結し、ルートの `index.html` がギャラリーページです。

## Cursor Cloud specific instructions

- 純粋な静的サイトです。**依存関係のインストール・ビルド・テスト・Lint の仕組みはありません**（`package.json` / lockfile / テストランナーは存在しません）。更新スクリプトで導入すべきものは何もありません。
- ローカルで動作確認するには、リポジトリルートから任意の静的サーバーを起動します。例:
  - `python3 -m http.server 8000`（Python 利用可）
  - `npx serve .`（README 記載の方法。ネットワークが必要）
- 起動後は `http://localhost:8000/index.html` がギャラリー、各アプリは `http://localhost:8000/apps/<name>/index.html` で開けます。
- ホットリロードはありません。ファイル変更後はブラウザを再読み込みしてください。
- 公開は GitHub Pages（`main` / root）で、ビルドステップなしでそのまま配信されます（詳細は `PUBLISH.md`）。
