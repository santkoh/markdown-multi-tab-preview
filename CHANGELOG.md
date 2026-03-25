# Changelog

All notable changes to the **Markdown Multi Tab Preview** extension will be
documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
