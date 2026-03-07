# Mermaid Advanced Diagrams Test

Additional diagram types and complex diagrams for pan/zoom testing.

## 1. Gantt Chart

```mermaid
gantt
    title Project Schedule
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements     :a1, 2026-01-01, 14d
    Design           :a2, after a1, 10d
    section Development
    Extension Host   :b1, after a2, 20d
    Webview          :b2, after a2, 18d
    Mermaid Support  :b3, after b2, 7d
    section Testing
    Manual Testing   :c1, after b1, 10d
    Bug Fixes        :c2, after c1, 7d
    section Release
    Marketplace      :d1, after c2, 3d
```

## 2. ER Diagram

```mermaid
erDiagram
    USER ||--o{ DOCUMENT : opens
    DOCUMENT ||--|{ PREVIEW_PANEL : "has preview"
    PREVIEW_PANEL {
        string id PK
        string title
        boolean active
        boolean isDirty
    }
    DOCUMENT {
        string uri PK
        string languageId
        string content
        int lineCount
    }
    USER {
        string name
        string workspace
    }
    DOCUMENT ||--o{ CHANGE_EVENT : triggers
    CHANGE_EVENT {
        int version
        string contentChanges
    }
    PREVIEW_PANEL ||--|| WEBVIEW : contains
    WEBVIEW {
        string html
        boolean enableScripts
        string cspSource
    }
```

## 3. Git Graph

```mermaid
gitGraph
    commit id: "init"
    commit id: "basic preview"
    branch feature/mermaid
    commit id: "add mermaid"
    commit id: "add panzoom"
    checkout main
    branch feature/scroll-sync
    commit id: "editor to preview"
    commit id: "preview to editor"
    checkout main
    merge feature/scroll-sync id: "merge scroll"
    merge feature/mermaid id: "merge mermaid"
    commit id: "v0.3.0"
    branch feature/color-swatch
    commit id: "color detection"
    commit id: "swatch rendering"
    checkout main
    merge feature/color-swatch id: "merge colors"
    commit id: "v0.5.0"
```

## 4. Mindmap

```mermaid
mindmap
  root((Markdown Preview))
    Rendering
      Markdown to HTML
      Mermaid Diagrams
      Syntax Highlighting
      Color Swatches
      Frontmatter
      Image Resolution
    UX
      Auto Preview
      Multi Tab
      Toggle Command
      Scroll Sync
        Editor to Preview
        Preview to Editor
      Copy Button
      Pan/Zoom
    Security
      CSP Nonce
      DOMPurify
      LocalResourceRoots
      No eval/exec
    Architecture
      Extension Host
        Node.js
        CommonJS
      Webview
        Browser
        IIFE Bundle
```

## 5. Timeline

```mermaid
timeline
    title Extension Release History
    section v0.1.0
        Basic Preview : Auto preview on file open
                      : Multiple independent panels
    section v0.2.0
        Mermaid : Diagram rendering
               : Error display
    section v0.3.0
        Scroll Sync : Editor to Preview sync
                    : Preview to Editor sync
    section v0.4.0
        Security : CSP hardening
                 : CodeQL integration
                 : Dependabot setup
    section v0.5.0
        Color Swatch : Hex/RGB/HSL detection
                     : Code block support
```

## 6. Complex Flowchart (Pan/Zoom Test)

This large diagram is designed to test the pan/zoom toolbar.

```mermaid
flowchart TB
    subgraph Extension["Extension Host (Node.js)"]
        direction TB
        ACT[activate] --> REG[Register Commands]
        REG --> CMD1[showPreview]
        REG --> CMD2[showEditor]
        REG --> CMD3[togglePreview]

        ACT --> LST[Register Listeners]
        LST --> L1[onDidChangeActiveTextEditor]
        LST --> L2[onDidCloseTextDocument]
        LST --> L3[onDidChangeTextDocument]
        LST --> L4[onDidChangeTextEditorVisibleRanges]
        LST --> L5[onDidChangeConfiguration]

        L1 --> AUTO[Auto Preview Logic]
        L3 --> DEB[Debounce 300ms]
        DEB --> RND[renderMarkdown]

        subgraph Renderer["Markdown Renderer"]
            RND --> LEX[Lexer Phase]
            LEX --> MAP[Build Line Map]
            MAP --> PRS[Parser Phase]
            PRS --> FM[Frontmatter HTML]
            PRS --> HD[Headings with data-line]
            PRS --> CD[Code Blocks]
            PRS --> IMG[Image Resolution]
            PRS --> TBL[Tables]
            PRS --> BQ[Blockquotes]
            PRS --> LSS[Lists with Tasks]
            CD --> MRM{Mermaid?}
            MRM -->|Yes| B64[Base64 Encode]
            MRM -->|No| ESC[escapeHtml]
        end
    end

    subgraph Webview["Webview (Browser)"]
        direction TB
        MSG[onMessage] --> UPD[update handler]
        MSG --> SCR[scroll handler]

        UPD --> SAN[DOMPurify Sanitize]
        SAN --> MRD[Mermaid Render]
        MRD --> HLJ[highlight.js]
        HLJ --> CPY[Copy Buttons]
        CPY --> CLR[Color Swatches]

        MRD --> PZ[Panzoom Setup]
        PZ --> TB[Toolbar: Move/Zoom/Reset]

        SCR --> EXS[executeScroll]
        EXS --> DL[Find data-line elements]
        DL --> INT[Interpolate position]

        WS[window scroll] --> SDB[Debounce 50ms]
        SDB --> PST[postMessage scrollEditor]
    end

    Extension -->|postMessage update| Webview
    Extension -->|postMessage scroll| Webview
    Webview -->|postMessage scrollEditor| Extension
    Webview -->|postMessage ready| Extension
```

## 7. Sequence Diagram with Complex Interactions

```mermaid
sequenceDiagram
    actor User
    participant Editor as VS Code Editor
    participant Ext as Extension Host
    participant PM as PreviewManager
    participant PP as PreviewPanel
    participant WV as Webview

    User->>Editor: Open file.md
    Editor->>Ext: onDidChangeActiveTextEditor
    Ext->>Ext: isMarkdownFile() check
    Ext->>PM: openPreview(document)
    PM->>PM: Check panels Map
    alt Panel exists
        PM->>PP: reveal()
    else Panel not found
        PM->>PP: new PreviewPanel()
        PP->>WV: createWebviewPanel()
        PP->>WV: setHtml() with CSP
        WV-->>PP: postMessage(ready)
        PP->>PP: update()
        PP->>PP: renderMarkdown()
        PP->>WV: postMessage(update, html)
        WV->>WV: DOMPurify.sanitize()
        WV->>WV: applyMermaid()
        WV->>WV: applyHighlight()
        WV->>WV: applyCopyButtons()
        WV->>WV: applyColorSwatches()
    end

    User->>Editor: Type in editor
    Editor->>PP: onDidChangeTextDocument
    PP->>PP: scheduleUpdate (300ms debounce)
    PP->>PP: renderMarkdown()
    PP->>WV: postMessage(update, html)

    User->>Editor: Scroll editor
    Editor->>PP: onDidChangeTextEditorVisibleRanges
    PP->>WV: postMessage(scroll, line)
    WV->>WV: scrollToLine()

    User->>WV: Scroll preview
    WV->>WV: Find closest data-line
    WV-->>PP: postMessage(scrollEditor, line)
    PP->>Editor: revealRange()
```

---

Test complete. Verify:
- All diagram types render without errors
- Pan/zoom toolbar appears on hover for all diagrams
- Complex diagrams are navigable with pan/zoom controls
- Theme (dark/light) applies to all diagram types
