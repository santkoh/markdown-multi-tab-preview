# Changelog

All notable changes to the **Markdown Multi Tab Preview** extension will be
documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.8.1] - 2026-05-02

### Fixed

- ドキュメント内 fragment リンク (`[xxx](#yyy)`) で対応する見出しに飛べない不具合を修正、smooth scroll でアニメーションするように改善 (#68)

### Security

- 推移的依存に含まれる `uuid <14.0.0` の moderate 脆弱性 (GHSA-w5hq-g745-h8pq) を `pnpm.overrides` で解消 (#66)

### Changed

- 最低サポート VS Code バージョンを 1.118.0 に更新 (#66, #67)
- ランタイム依存を更新: marked 17.0.5 → 17.0.6 / dompurify 3.4.0 → 3.4.1 / @panzoom/panzoom 4.6.1 → 4.6.2 (#64)
- 開発依存と CI 依存をまとめて最新化 (#53, #60, #62, #63)

## [0.8.0] - 2026-04-19

### Added

- **Rich Diff Preview** (#57) — 新コマンド `mdMultiTabPreview.showDiffPreview` (エディタタイトルの `git-compare` アイコン) を追加。Side-by-side で HEAD 版と Working Tree 版のレンダリング済み Markdown を比較。変更ブロックを theme-adaptive な色（`--vscode-diffEditor-insertedTextBackground` / `--vscode-gitDecoration-addedResourceForeground` 等）でハイライト、両パネルを比率でスクロール同期。
- `mdMultiTabPreview.theme.preset` 設定 (`"soft"` | `"classic"`)
- **GFM Alerts サポート** — `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` の 5 種類のアラートを色付きでレンダリング
  - 背景色とアクセント帯が種類ごとに切り替わる (青 / 緑 / 紫 / 黄 / 赤)
  - Light / Dark / High Contrast の各テーマに対応した配色

### Changed

- **デフォルトテーマが Soft (角丸 + 柔らかい枠線) に変更**
  - 従来の直線的なデザインに戻すには VS Code 設定で `mdMultiTabPreview.theme.preset` を `"classic"` に変更してください
  - 角丸: テーブル・Mermaid・コードブロック・引用・frontmatter
  - line-height / padding を微調整し可読性向上
- **Blockquote の左側アクセント帯を背景カードと一体化** (Soft テーマ)
  - 従来は浮いた `::before` 要素で描画していた帯を削除し、カードの `border-left` として統合。違和感を解消
  - 通常の Blockquote にも Note と同じ配色（青アクセント + うっすら水色背景）を適用し視覚的統一
  - Classic テーマは従来の挙動を維持
- **テーブルにゼブラストライプとホバーハイライト** (Soft テーマ)
  - 偶数行の背景色が交互に表示され、行数の多いテーブルでも行の追跡が容易に
  - ホバーで行全体が強調される
  - ヘッダーは small-caps タイポグラフィ + 強 tint background + 2px bottom border で本文と明確に分離
- **Mermaid Pan/Zoom UX を Figma ライクに変更** (#54)
  - Pan/Zoom モード ON 時でも素の wheel はページ縦スクロールを通過させる
  - ズームは Cmd (Mac) / Ctrl + wheel に限定
  - ドラッグでの pan は従来どおり

### Fixed

- **Color swatch の GitHub Issue/PR 誤検出を修正** (#55)
  - `Issue #123` / `PR #456` / `fix #789` など GitHub 参照キーワード直後の `#xxx` を swatch 対象外に
  - 3/4 桁 hex は a-f を最低 1 文字含むものに限定（純数字 `#123` を除外）
  - Markdown リンクのアンカー内テキストを swatch 対象外に

### Security

- プレビューの DOMPurify サニタイズ設定で `<style>` タグと `style` 属性を明示的に禁止 (`FORBID_TAGS` / `FORBID_ATTR`)。インライン CSS による挙動改変やフィンガープリンティングを抑止。

## [0.7.5] - 2026-04-04

### Security

- Fixed 5 high/moderate vulnerabilities in transitive dependencies (`brace-expansion`, `lodash`, `lodash-es`, `picomatch`) via pnpm overrides.
- Updated Mermaid from 11.13.0 to 11.14.0.

## [0.7.4] - 2026-03-26

### Security

- Updated marked from 17.0.4 to 17.0.5 to fix ReDoS vulnerability (catastrophic backtracking in link/reflink label regex).

## [0.7.3] - 2026-03-16

### Added

- Published to [Open VSX Registry](https://open-vsx.org/) in addition to VS Code Marketplace, expanding availability to VS Code-compatible editors.

## [0.7.2] - 2026-03-16

### Changed

- Updated Mermaid from 11.12.3 to 11.13.0 (new diagram types, bug fixes).
- Updated DOMPurify from 3.3.2 to 3.3.3 (Node.js engine compatibility fix).

## [0.7.1] - 2026-03-16

### Security

- Fixed high-severity vulnerabilities in transitive dependencies (`undici`
  7.22.0 → ≥7.24.0, `yauzl` 2.10.0 → ≥3.2.1) via pnpm overrides.

## [0.7.0] - 2026-03-13

### Added

- **Outline sidebar** — collapsible sidebar showing document headings for quick
  navigation. Click a heading to smooth-scroll to it. Configurable via
  `mdMultiTabPreview.toc.enabled` and `mdMultiTabPreview.toc.maxDepth`.
  Visibility state is persisted per workspace.

### Fixed

- Fixed Mermaid error SVG (bomb icon) rendering at the top-right corner of the
  page instead of being hidden when a diagram has a syntax error.

## [0.6.1] - 2026-03-09

### Fixed

- Fixed Mermaid diagram border becoming invisible behind SVG elements when
  zoomed in (switched from CSS `outline` to a `::after` pseudo-element with
  proper z-index).
- Fixed cursor changing to move icon when hovering over Mermaid diagrams
  without entering pan/zoom mode.

## [0.6.0] - 2026-03-08

### Added

- **Color swatch decorator** — inline color swatches are now displayed next to
  color codes (Hex, RGB/RGBA, HSL/HSLA) in both code blocks and body text.
  Configurable via `mdMultiTabPreview.colorDecorator` (default: true).

### Security

- Updated DOMPurify from 3.3.1 to 3.3.2 to fix XSS vulnerability
  (GHSA-v2wj-7wpq-c8vv).

## [0.5.0] - 2026-03-03

### Added

- **CHANGELOG.md** — full version history now available on the Marketplace
  "Changelog" tab and linked from README.

### Fixed

- Preview now opens for `.md` files even when another extension overrides the
  language ID (e.g. skill files in `.claude/skills/`). Detection falls back to
  file extension when `languageId` is not `markdown`.

## [0.4.2] - 2026-03-02

### Security

- Internal CI security hardening (pinned Actions to commit SHAs, added
  OpenSSF Scorecard, least-privilege permissions).

## [0.4.0] - 2026-03-01

### Fixed

- Fixed Mermaid diagrams breaking when they contained Japanese text
  (Base64 encoding applied to diagram source).
- Improved editor ↔ preview scroll sync accuracy.

## [0.3.0] - 2026-03-01

### Added

- **Mermaid pan/zoom mode** — toggle button on Mermaid diagrams enables
  drag-to-pan and scroll-to-zoom via [@panzoom/panzoom](https://github.com/timmywil/panzoom).

## [0.2.1] - 2026-03-01

### Changed

- Excluded sourcemaps from the VSIX package, reducing download size.

## [0.2.0] - 2026-03-01

### Added

- **Checkbox / Task list support** — `- [x]` and `- [ ]` items now render
  as styled checkboxes in the preview.

### Fixed

- Restored Mermaid diagram rendering that had been broken by the DOMPurify
  integration.
- Sanitized Mermaid SVG output with DOMPurify to prevent XSS.

## [0.1.1] - 2026-03-01

### Fixed

- Regenerated extension icon at 256 × 256 px with transparent background
  to meet Marketplace requirements.

## [0.1.0] - 2026-03-01

### Added

- **Independent preview panels** — each Markdown file gets its own preview
  tab that persists when you switch between documents.
- **Auto preview** — preview panel opens automatically when a `.md` file is
  opened (configurable via `mdMultiTabPreview.autoPreview`).
- **Real-time update** — preview re-renders on every edit with 300 ms
  debounce.
- **Editor → Preview scroll sync** — scrolling the editor scrolls the
  preview to the matching position.
- **Mermaid diagram rendering** — fenced code blocks with `mermaid` language
  are rendered as SVG diagrams.
- **Syntax highlighting** — code blocks are highlighted with
  [highlight.js](https://highlightjs.org/) with language auto-detection.
- **Heading prefix display** — `#` / `##` / `###` markers shown in a
  subtle gray style.
- **Relative image resolution** — images referenced by relative paths are
  resolved correctly inside the webview.
- **Theme integration** — follows VS Code Light, Dark, and High Contrast
  themes.
- **Toggle shortcut** — `Ctrl+Shift+V` / `Cmd+Shift+V` toggles between
  editor and preview.

### Security

- Sanitized all HTML output with DOMPurify to prevent XSS.

[0.8.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.7.5...v0.8.0
[0.7.5]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.4.2...v0.5.0
[0.4.2]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.4.0...v0.4.2
[0.4.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/santkoh/markdown-multi-tab-preview/releases/tag/v0.1.0
