# Pan/Zoom UX Test

モード OFF: wheel でページスクロール、Cmd+wheel でも何もしない。
モード ON (右上アイコンクリック): wheel でページスクロール通過、Cmd/Ctrl+wheel でズーム、ドラッグで pan。

```mermaid
graph LR
  A[Start] --> B{Choice}
  B -->|Yes| C[Action 1]
  B -->|No| D[Action 2]
  C --> E[End]
  D --> E
```
