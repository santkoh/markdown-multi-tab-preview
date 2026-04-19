# Color Swatch — GitHub Issue/PR 誤検出修正テスト

`#` を色か GitHub 参照かを見分けるロジック (3/4 桁は a-f を必須、キーワード直後は除外、リンク内テキストは除外) を確認するためのサンプル。

---

## 1. Swatch が表示されるべき

### 3 / 4 桁 hex (a-f を含む)
- `#3af` (f を含む短縮 RGB)
- `#abcd` (4 桁 RGBA)
- `#fff` (すべて f)
- 大文字も同様: `#ABC`, `#FFF`, `#DeAd`

### 6 / 8 桁 hex (純数字でも表示)
- `#333333` (CSS グレー、6 桁)
- `#ffffff` (白)
- `#00000088` (黒 + alpha、8 桁)
- `#1a2b3c4d` (8 桁 RGBA)

### 関数形式
- `rgb(255, 100, 50)`
- `rgba(0, 0, 0, 0.5)`
- `hsl(120, 50%, 50%)`
- `hsla(240, 100%, 50%, 0.3)`

### 文中の hex も swatch 表示
文中の #f00 / #abc / #0969da も swatch が挟まれます。

---

## 2. Swatch が表示されないべき — GitHub 参照

以下はキーワード直後の `#` + 数字/hex を除外するケース。

- Issue #123
- Issues #42
- PR #456
- PRs #88
- Pull #10 / pull #200
- fix #789 / fixed #9
- close #1 / closes #100 / closed #55
- resolve #2 / resolves #3 / resolved #4
- merged #12
- ref #5 / see #6 / related #7

### a-f を含む hex でもキーワード直後なら除外
- PR #4e1 (`e` を含むが、キーワード直後のため swatch 非表示)
- closes #abc (3 桁 hex として a-f を満たすが、キーワード直後のため除外)

---

## 3. Swatch が表示されないべき — 純数字 3/4 桁

GitHub 参照キーワードが無くても、純数字の 3/4 桁 hex は誤検出回避のため除外。6/8 桁や a-f 入りは引き続き表示。

- #123（全数字、3 桁）
- #4567（全数字、4 桁）
- #000（全数字、3 桁）
- #333（全数字、3 桁 — CSS グレーも除外。必要なら `#333333` を推奨）
- #999（全数字、3 桁）

---

## 4. Swatch が表示されないべき — アンカータグ内

Markdown リンクで囲まれたテキストは swatch を挟まない。

- [#123](https://github.com/example/repo/issues/123)
- [#3af](https://example.com)（a-f を含むがリンク内なので除外）
- [color `#abcdef`](https://example.com)（リンク内の inline code も除外）

---

## 5. コードブロック内も同じルールが適用される

```css
.header {
  color: #fff;               /* 表示: f を含む */
  background: #333333;       /* 表示: 6 桁 */
  border-color: #0969da;     /* 表示: 6 桁 */
  outline: 1px solid #333;   /* 非表示: 純数字 3 桁 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);  /* 表示: rgba */
}
```

```yaml
theme:
  bg: "#1e1e1e"    # 表示
  fg: "#d4d4d4"    # 表示
  ref: "#333"      # 非表示（純数字）
```

---

## 6. エッジケース

### HTML エンティティ / URL は除外
- HTML entity: `&#xff;` (除外: `&` が先行)
- URL fragment: https://example.com/#section (除外: `e` 先行)

### 単語境界
- the#fff (除外: `e` が `#` の直前にある)
- space前 #fff (表示: スペース区切り)

### 句読点隣接
- 文末の #3af.
- カッコ内 (#abc)
- カンマ前 #0f0, 次の語
- コロン後: #abcdef
