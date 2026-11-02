# Markdown Multi Tab Preview

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/santkoh.markdown-multi-tab-preview)](https://marketplace.visualstudio.com/items?itemName=santkoh.markdown-multi-tab-preview)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/santkoh.markdown-multi-tab-preview)](https://marketplace.visualstudio.com/items?itemName=santkoh.markdown-multi-tab-preview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

> [English README](../README.md)

複数の Markdown ファイルを独立したプレビュータブで同時にプレビューできる VS Code 拡張機能です。ファイルごとに専用のプレビュータブが開くため、ドキュメントを切り替えても表示位置を見失うことがありません。

<!-- ![Markdown Multi Tab Preview スクリーンショット](../media/screenshot.png) -->

## 機能

- **独立プレビューパネル** — Markdown ファイルごとに専用のプレビュータブを作成。複数ドキュメントを並べて同時に確認できます。
- **自動プレビュー** — `.md` / `.markdown` ファイルを開くと自動でプレビューパネルを表示。設定で無効化も可能です。
- **リアルタイム更新** — 編集内容がリアルタイムでプレビューに反映されます（debounce 300ms）。
- **プレビュー内検索** — `Ctrl+F`（Mac: `Cmd+F`）で表示中のテキストを検索し、現在位置と総ヒット数を表示。通常プレビューと Rich Diff の両方に対応しています。
- **双方向スクロール同期** — エディタとプレビューのスクロール位置を双方向で同期します。
- **Mermaid ダイアグラム** — `mermaid` コードブロックをダイアグラムとしてレンダリング。パン/ズーム操作にも対応。テーマは VS Code のカラーテーマに追従します。
- **シンタックスハイライト** — コードブロックを [highlight.js](https://highlightjs.org/) でハイライト表示。ホバー時にコピーボタンも表示されます。
- **Outline サイドバー** — ドキュメントの見出し一覧を折りたたみ可能なサイドバーに表示。クリックで該当箇所にスクロール。表示する見出しの深さも設定可能です。
- **カラースウォッチ** — カラーコード（Hex, RGB/RGBA, HSL/HSLA）の横に色見本を表示。コードブロック内・本文テキストの両方に対応しています。
- **フロントマター表示** — YAML フロントマターをプレビュー上部にラベル付きコードブロックとして表示します。
- **タスクリスト** — `- [x]` / `- [ ]` をスタイル付きチェックボックスとして表示します。
- **見出しプレフィックス表示** — `#` / `##` / `###` などのプレフィックスをグレーの控えめなスタイルで表示します。
- **画像表示** — 相対パスの画像を正しく解決して Webview 内に表示。リモート画像の読み込みは設定で切り替えできます。
- **テーマ連動** — VS Code の Light・Dark・High Contrast テーマに完全対応しています。

## VS Code 標準の Markdown プレビューとの違い

VS Code 標準の Markdown プレビューは十分に優秀で、本拡張機能と機能が重なる部分も多くあります。**「Markdown ファイルごとに 1 つのプレビュータブが開く」ことだけが目的**であれば、拡張機能を入れなくても標準の `markdown.showPreview` と `markdown.preview.toggleLock` を `runCommands` でチェーンすれば実現できます（[#65](https://github.com/santkoh/markdown-multi-tab-preview/issues/65) で指摘いただいた通りです）:

```json
{
  "key": "ctrl+shift+v",
  "command": "runCommands",
  "args": {
    "commands": ["markdown.showPreview", "markdown.preview.toggleLock"]
  },
  "when": "editorLangId == markdown"
}
```

本拡張機能は **その上に載せる** UX 改善と、標準プレビューには無い機能のために存在します:

| 機能 | 標準プレビュー | 本拡張機能 |
| --- | --- | --- |
| ファイルごとに 1 タブ | ✅ `runCommands` のキーバインドで可能 | ✅ デフォルト動作（設定不要） |
| `.md` を開いた瞬間に自動でプレビュー表示 | ❌ | ✅ (`autoPreview`) |
| Mermaid の Pan/Zoom（Figma ライクなホイール挙動） | ❌ | ✅ |
| プレビューパネル内に Outline サイドバー（depth 設定可） | ❌ | ✅ |
| Hex / RGB(A) / HSL(A) のインラインカラースウォッチ | ❌ | ✅ |
| `HEAD` との Rich Diff（左右並列レンダリング比較） | ❌ | ✅ |
| GFM Alerts（`> [!NOTE]` 等）をテーマ連動の 5 色で装飾 | 一部 | ✅ |
| YAML フロントマターをラベル付きブロックとして表示 | ❌ | ✅ |
| コードブロックのホバーでコピーボタン | ❌ | ✅ |
| Soft / Classic 外観プリセット（角丸・ゼブラテーブル 等） | ❌ | ✅ |
| 見出しの `#` / `##` プレフィックスを控えめなグレーで表示 | ❌ | ✅ |

右側の項目があまり刺さらなければ、標準プレビュー + 上記キーバインドで十分です。逆にこれらの UX や機能が欲しい場合は、本拡張機能が CSP と DOMPurify のサニタイズを効かせた状態でまとめて提供します。

## 使い方

### 自動プレビュー

`mdMultiTabPreview.autoPreview` が有効（デフォルト）の場合、`.md` ファイルを開くと自動でサイドにプレビューが表示されます。

### プレビューのトグル

- **キーボードショートカット**: `Ctrl+Shift+V`（Mac: `Cmd+Shift+V`）
- **コマンドパレット**: `Markdown Multi Tab Preview: Toggle Preview`
- **タイトルバーボタン**: エディタのタイトルバーにあるプレビューアイコンをクリック

### プレビューからエディタに戻る

プレビューパネルのタイトルバーにある編集アイコンをクリックするか、コマンドパレットから `Markdown Multi Tab Preview: Show Editor` を実行します。

### プレビュー内検索

プレビュー内をクリックして `Ctrl+F`（Mac: `Cmd+F`）を押すか、パネルのタイトルバーにある検索アイコンをクリックします。検索バーに **現在位置 / 総ヒット数**（例: `3 / 12`）を表示し、現在の一致箇所は強調表示と下線で示します。`Enter` / `Shift+Enter` または矢印ボタンで次・前の一致箇所へ移動し、`Escape` で閉じられます。一致がない場合は `0 / 0` と表示します。

大文字・小文字を区別せず、検索文字列をそのまま検索します。Rich Diff では HEAD、Working Tree の順で両側の一致箇所を集計します。文書の変更時には件数を更新し、Outline に重複表示される見出しは集計しません。

## 設定

| 設定キー | 型 | デフォルト | 説明 |
|---------|-----|----------|------|
| `mdMultiTabPreview.autoPreview` | `boolean` | `true` | Markdown ファイルを開いた時にプレビューを自動表示 |
| `mdMultiTabPreview.retainContextWhenHidden` | `boolean` | `true` | タブ非表示時もプレビューの状態を保持（無効にするとメモリ使用量が減少） |
| `mdMultiTabPreview.allowRemoteImages` | `boolean` | `true` | プレビューでリモート画像（`https://`）の読み込みを許可 |
| `mdMultiTabPreview.colorDecorator` | `boolean` | `true` | カラーコードの横に色見本を表示 |
| `mdMultiTabPreview.toc.enabled` | `boolean` | `true` | プレビューに Outline（見出しナビゲーション）サイドバーを表示 |
| `mdMultiTabPreview.toc.maxDepth` | `number` | `3` | Outline に表示する見出しの最大レベル（1〜6） |

## 動作要件

- VS Code `1.118.0` 以上

## リリースノート

各バージョンの変更点は [Changelog](../CHANGELOG.md) をご覧ください。

## 既知の問題

- VS Code 標準の Markdown プレビューと併存します。コマンドプレフィックスで区別してください。

## ライセンス

[MIT](../LICENSE)
