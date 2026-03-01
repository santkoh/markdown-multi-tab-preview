# Markdown Multi Tab Preview

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/santkoh.markdown-multi-tab-preview)](https://marketplace.visualstudio.com/items?itemName=santkoh.markdown-multi-tab-preview)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/santkoh.markdown-multi-tab-preview)](https://marketplace.visualstudio.com/items?itemName=santkoh.markdown-multi-tab-preview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

> [English README](../README.md)

複数の Markdown ファイルを独立したプレビュータブで同時にプレビューできる VS Code 拡張機能です。ファイルごとに専用のプレビュータブが開くため、ドキュメントを切り替えても表示位置を見失うことがありません。

<!-- ![Markdown Multi Tab Preview スクリーンショット](../media/screenshot.png) -->

## 機能

- **独立プレビューパネル** — Markdown ファイルごとに専用のプレビュータブを作成。複数ドキュメントを並べて同時に確認できます。
- **自動プレビュー** — `.md` ファイルを開くと自動でプレビューパネルを表示。設定で無効化も可能です。
- **リアルタイム更新** — 編集内容がリアルタイムでプレビューに反映されます（debounce 300ms）。
- **スクロール同期** — エディタのスクロール位置をプレビューに同期します（エディタ → プレビュー方向）。
- **Mermaid ダイアグラム** — `mermaid` コードブロックをダイアグラムとしてレンダリング。テーマは VS Code のカラーテーマに追従します。
- **シンタックスハイライト** — コードブロックを [highlight.js](https://highlightjs.org/) でハイライト表示。言語の自動検出にも対応しています。
- **見出しプレフィックス表示** — `#` / `##` / `###` などのプレフィックスをグレーの控えめなスタイルで表示します。
- **画像表示** — 相対パスの画像を正しく解決して Webview 内に表示します。
- **テーマ連動** — VS Code の Light・Dark・High Contrast テーマに完全対応しています。

## 使い方

### 自動プレビュー

`mdMultiTabPreview.autoPreview` が有効（デフォルト）の場合、`.md` ファイルを開くと自動でサイドにプレビューが表示されます。

### プレビューのトグル

- **キーボードショートカット**: `Ctrl+Shift+V`（Mac: `Cmd+Shift+V`）
- **コマンドパレット**: `Markdown Multi Tab Preview: Toggle Preview`
- **タイトルバーボタン**: エディタのタイトルバーにあるプレビューアイコンをクリック

### プレビューからエディタに戻る

プレビューパネルのタイトルバーにある編集アイコンをクリックするか、コマンドパレットから `Markdown Multi Tab Preview: Show Editor` を実行します。

## 設定

| 設定キー | 型 | デフォルト | 説明 |
|---------|-----|----------|------|
| `mdMultiTabPreview.autoPreview` | `boolean` | `true` | `.md` ファイルを開いた時にプレビューを自動表示 |

## 動作要件

- VS Code `1.100.0` 以上

## 既知の問題

- VS Code 標準の Markdown プレビューと併存します。コマンドプレフィックスで区別してください。

## ライセンス

[MIT](../LICENSE)
