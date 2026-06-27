# Markdown Multi Tab Preview

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/santkoh.markdown-multi-tab-preview)](https://marketplace.visualstudio.com/items?itemName=santkoh.markdown-multi-tab-preview)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/santkoh.markdown-multi-tab-preview)](https://marketplace.visualstudio.com/items?itemName=santkoh.markdown-multi-tab-preview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> [日本語版 README はこちら](docs/README.ja.md)

Preview multiple Markdown files simultaneously with independent preview panels. Each file gets its own preview tab — no more losing your place when switching between documents.

<!-- ![Markdown Multi Tab Preview Screenshot](media/screenshot.png) -->

## Features

- **Independent Preview Panels** — Each Markdown file opens in its own preview tab. Work with multiple documents side by side without interference.
- **Auto Preview** — Automatically opens a preview panel when you open a `.md` or `.markdown` file. Can be disabled via settings.
- **Real-time Update** — Preview updates as you type with debounced rendering (300ms).
- **Bidirectional Scroll Sync** — Editor and preview scroll positions stay in sync in both directions.
- **Mermaid Diagrams** — Renders `mermaid` code blocks as diagrams with pan/zoom controls. Theme follows your VS Code color theme.
- **Syntax Highlighting** — Code blocks are highlighted with [highlight.js](https://highlightjs.org/) and include a copy-to-clipboard button on hover.
- **Outline Sidebar** — Collapsible sidebar showing document headings for quick navigation. Click a heading to scroll to it. Depth level is configurable.
- **Color Swatch Decorator** — Displays inline color swatches next to color codes (Hex, RGB/RGBA, HSL/HSLA) in both code blocks and body text.
- **Frontmatter Display** — YAML frontmatter is rendered as a labeled code block at the top of the preview.
- **Task List Support** — `- [x]` and `- [ ]` items render as styled checkboxes.
- **Heading Prefix Display** — Shows `#` / `##` / `###` prefixes in a subtle gray style alongside heading text.
- **Image Support** — Relative image paths are resolved correctly within the webview. Remote images can be toggled via settings.
- **Theme Integration** — Fully follows VS Code's Light, Dark, and High Contrast themes.

## How this differs from VS Code's built-in Markdown preview

VS Code's built-in preview is excellent, and many of its capabilities overlap with this extension. If your only need is "one preview tab per Markdown file", you can already get that without any extension by chaining the built-in commands `markdown.showPreview` and `markdown.preview.toggleLock` via `runCommands` (see [#65](https://github.com/santkoh/markdown-multi-tab-preview/issues/65)):

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

This extension exists for everything **on top of** that — opinionated UX touches and features that are not in the built-in preview:

| Capability | Built-in preview | This extension |
| --- | --- | --- |
| One preview tab per file | ✅ via `runCommands` keybinding | ✅ default, zero setup |
| Auto-open preview when a `.md` is opened | ❌ | ✅ (`autoPreview`) |
| Mermaid pan/zoom (Figma-like wheel = scroll, Cmd/Ctrl + wheel = zoom) | ❌ | ✅ |
| Outline sidebar **inside** the preview pane | ❌ | ✅ (depth configurable) |
| Inline color swatches for Hex / RGB(A) / HSL(A) | ❌ | ✅ |
| Rich Diff vs `HEAD` (rendered side-by-side) | ❌ | ✅ |
| GFM Alerts (`> [!NOTE]` etc.) with 5 themed color schemes | partial | ✅ |
| YAML frontmatter as a labeled block | ❌ | ✅ |
| Copy-to-clipboard button on code blocks (hover) | ❌ | ✅ |
| Soft / Classic theme presets (rounded corners, zebra tables, etc.) | ❌ | ✅ |
| Heading prefix (`#` / `##`) styled in subtle gray | ❌ | ✅ |

If most of the items in the right column don't matter to you, the built-in preview plus the keybinding above will likely serve you better. If they do, this extension bundles them together with strict CSP + DOMPurify sanitization.

## Usage

### Auto Preview

When `mdMultiTabPreview.autoPreview` is enabled (default), opening any `.md` file automatically shows its preview in a side panel.

### Toggle Preview

- **Keyboard shortcut**: `Ctrl+Shift+V` (Mac: `Cmd+Shift+V`)
- **Command Palette**: `Markdown Multi Tab Preview: Toggle Preview`
- **Title bar button**: Click the preview icon in the editor title bar

### Show Editor from Preview

Click the edit icon in the preview panel's title bar, or use the Command Palette: `Markdown Multi Tab Preview: Show Editor`.

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mdMultiTabPreview.autoPreview` | `boolean` | `true` | Automatically show preview when opening a Markdown file |
| `mdMultiTabPreview.retainContextWhenHidden` | `boolean` | `true` | Keep preview state when the tab is hidden (disable to reduce memory usage) |
| `mdMultiTabPreview.allowRemoteImages` | `boolean` | `true` | Allow loading remote images (`https://`) in preview |
| `mdMultiTabPreview.colorDecorator` | `boolean` | `true` | Show color swatches next to color codes in preview |
| `mdMultiTabPreview.toc.enabled` | `boolean` | `true` | Show Outline (heading navigation) sidebar in preview |
| `mdMultiTabPreview.toc.maxDepth` | `number` | `3` | Maximum heading depth shown in the Outline (1–6) |
| `mdMultiTabPreview.codeFontFamily` | `string` | `""` | Override the code font (`font-family`). When empty, the bundled CJK-aware monospace **Sarasa Mono** is used so that ASCII art / box-drawing tables stay column-aligned even when half-width and full-width (CJK) characters are mixed. |

### Code block font & CJK ASCII art alignment

Code blocks render in the bundled **Sarasa Mono** font by default. Because its full-width (CJK) glyphs are exactly twice the width of its half-width glyphs, ASCII-art UI mockups and box-drawing tables that mix Japanese and ASCII stay aligned in the preview — unlike most editor monospace fonts, which lack CJK glyphs and fall back to a system font with a non-2:1 advance width.

To use your own font instead, set `mdMultiTabPreview.codeFontFamily` (e.g. `"Sarasa Mono J"`, `"'HackGen', monospace"`). For ASCII-art alignment, pick a monospace font whose full-width characters are exactly 2× the half-width advance.

## Requirements

- VS Code `1.109.0` or later

## Release Notes

See the [Changelog](CHANGELOG.md) for a full list of changes in each version.

## Known Issues

- VS Code's built-in Markdown preview coexists with this extension. Use the command prefix to distinguish them.

## License

[MIT](LICENSE)

### Bundled font

This extension bundles **Sarasa Mono** (更紗等幅ゴシック), © Renzhi Li and contributors, licensed under the [SIL Open Font License 1.1](media/fonts/LICENSE-Sarasa.txt). The font is redistributed unmodified (re-packaged from TTF to WOFF2). Source: <https://github.com/be5invis/Sarasa-Gothic>.
