# Link Click Test

プレビュー内のリンククリック動作を検証するためのテストファイル。

## 相対パスリンク（同ディレクトリ）

- [basic.md](./basic.md) — 同階層のファイルを開く
- [mermaid.md](mermaid.md) — `./` なしの相対パス
- [code-highlight.md](./code-highlight.md) — シンタックスハイライトテスト

## 相対パスリンク（親ディレクトリ）

- [README.md](../README.md) — 親ディレクトリのファイル
- [package.json](../package.json) — 非 Markdown ファイル

## 相対パスリンク（サブディレクトリ）

- [PR テストファイル](./pr/) — ディレクトリへのリンク（警告が出るはず）

## フラグメント付きリンク

- [basic.md#headings](./basic.md#headings) — `## Headings` セクションへスクロール
- [basic.md#text-formatting](./basic.md#text-formatting) — `## Text Formatting` セクションへスクロール
- [basic.md#task-list](./basic.md#task-list) — `### Task List` セクションへスクロール
- [basic.md#存在しない-slug](./basic.md#nonexistent-slug) — マッチしないフラグメント（ファイルは開くがスクロールなし）

## 外部 URL

- [Google](https://www.google.com) — HTTPS（ブラウザで開く）
- [Example](http://example.com) — HTTP（ブラウザで開く）
- [メール](mailto:test@example.com) — mailto リンク

## アンカーリンク（ページ内）

- [このページの先頭へ](#link-click-test) — ページ内アンカー（何も起きない）
- [外部URLセクション](#外部-url) — 日本語アンカー（何も起きない）

## 存在しないファイル

- [存在しないファイル](./nonexistent.md) — 警告メッセージが出るはず
- [存在しないパス](../no-such-dir/file.md) — 警告メッセージが出るはず

## 画像リンク（入れ子テスト）

[![画像リンク](https://via.placeholder.com/150)](./basic.md)

上の画像をクリックすると `basic.md` が開くはず（`closest('a')` で親の `<a>` を検出）。

## Protocol-relative URL

- [Protocol-relative](//example.com/path) — ブラウザで開く
