# Changelog

All notable changes to the **Markdown Multi Tab Preview** extension will be
documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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

[0.4.2]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.4.0...v0.4.2
[0.4.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/santkoh/markdown-multi-tab-preview/releases/tag/v0.1.0
