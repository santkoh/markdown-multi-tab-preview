# Pan/Zoom UX Test

Mermaid 図の Pan/Zoom モードを Figma ライクな UX で確認する。

## 動作

| 状態 | wheel | Cmd (Mac) / Ctrl + wheel | ドラッグ |
|:-----|:------|:------------------------|:---------|
| モード OFF | ページスクロール | ページスクロール (効果なし) | 効果なし |
| モード ON | ページスクロール通過 | ズーム (in/out) | Pan (図を移動) |

モード ON は図の右上ボタン (✣ アイコン) または図上でクリックして切替。モード ON 時は図の周囲にフォーカス枠が表示される。

## Mermaid サンプル

```mermaid
graph LR
  A[Start] --> B{Choice}
  B -->|Yes| C[Action 1]
  B -->|No| D[Action 2]
  C --> E[End]
  D --> E
```

## もう一つ (ズーム動作の比較用)

```mermaid
sequenceDiagram
  participant U as User
  participant E as Editor
  participant P as Preview
  U->>E: 編集
  E->>P: 300ms debounce
  P->>P: Render
  P-->>U: 表示
```

スクロールして上記図の近くで wheel を動かしても、ページスクロールが止まらないことを確認。
