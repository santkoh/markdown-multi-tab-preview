# Mermaid Diagrams Test

## Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Extension
    participant Webview

    User->>Editor: Open .md file
    Editor->>Extension: onDidOpenTextDocument
    Extension->>Webview: Create WebviewPanel
    Extension->>Webview: postMessage(update)
    Webview->>Webview: Render HTML
    User->>Editor: Edit text
    Editor->>Extension: onDidChangeTextDocument
    Extension->>Webview: postMessage(update)
```

## Class Diagram

```mermaid
classDiagram
    class PreviewManager {
        -panels: Map
        +openPreview()
        +togglePreview()
        +closePreview()
        +dispose()
    }
    class PreviewPanel {
        -panel: WebviewPanel
        -document: TextDocument
        +reveal()
        +dispose()
    }
    PreviewManager "1" --> "*" PreviewPanel : manages
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: openPreview()
    Open --> Closed: dispose()
    Open --> Open: update()
    Open --> Open: scroll()
    Closed --> [*]
```

## Pie Chart

```mermaid
pie title Extension Components
    "Extension Host" : 40
    "Webview" : 35
    "CSS" : 15
    "Config" : 10
```

## Invalid Mermaid (Error Test)

```mermaid
graph TD
    A --> B
    this is invalid syntax %%%
    C -->
```
