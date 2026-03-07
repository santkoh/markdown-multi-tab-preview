# GFM Extended Features Test

## 1. Table Alignment

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left 1       | Center 1       | Right 1       |
| Left 2       | Center 2       | Right 2       |
| Left 3       | Center 3       | Right 3       |

### Mixed alignment with various content

| Name       | Score | Grade | Comment          |
|:-----------|------:|:-----:|:-----------------|
| Alice      |    95 |   A   | Excellent work   |
| Bob        |    82 |   B   | Good performance |
| Charlie    |    67 |   C   | Needs improvement|

## 2. Ordered List with Custom Start

5. Starting from five
6. Six
7. Seven

---

10. Starting from ten
11. Eleven
12. Twelve

---

1. Normal start
2. Two
3. Three

## 3. Nested Blockquotes

> Level 1 blockquote
>
> > Level 2 nested blockquote
> >
> > > Level 3 deeply nested blockquote
> > >
> > > This should have progressively lighter left borders.
> >
> > Back to level 2.
>
> Back to level 1.

### Blockquote with other elements

> ### Heading inside blockquote
>
> Paragraph with **bold** and *italic*.
>
> - List item 1
> - List item 2
>
> ```js
> const x = "code inside blockquote";
> ```
>
> > Nested quote with `inline code`

## 4. Complex Nested Lists

- Level 1
  - Level 2
    - Level 3
      - Level 4
        - Level 5 (deeply nested)
  - Back to level 2
- Back to level 1

### Mixed ordered and unordered

1. First ordered
   - Unordered inside ordered
   - Another unordered
     1. Ordered inside unordered inside ordered
     2. Second item
2. Second ordered
3. Third ordered

## 5. Task Lists (Extended)

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed
  - [x] Nested completed subtask
  - [ ] Nested incomplete subtask
- [ ] Task with **bold** and `code`

## 6. Strikethrough

~~This text is struck through.~~

Partial ~~strikethrough~~ in a sentence.

~~**Bold and strikethrough**~~ combined.

## 7. Autolinks and Raw URLs

Plain URLs in text are rendered by GFM:

https://github.com/santkoh/markdown-multi-tab-preview

Email-like: user@example.com

Regular link: [Example documentation](https://example.com)

## 8. Inline Code with Special Characters

`<div class="test">`

`const x = 5 > 3 && y < 10;`

`"quotes" and 'apostrophes'`

`` `backtick` inside backticks ``

## 9. Large Table

| # | Feature | Category | Status | Priority | Notes |
|---|---------|----------|--------|----------|-------|
| 1 | Auto Preview | Core | Done | P0 | F-01 |
| 2 | Multi Panel | Core | Done | P0 | F-02 |
| 3 | Toggle | Core | Done | P0 | F-03 |
| 4 | Mermaid | Rendering | Done | P1 | F-04 |
| 5 | Real-time Update | Core | Done | P0 | F-05 |
| 6 | Scroll Sync | UX | Done | P1 | F-06 |
| 7 | Syntax Highlight | Rendering | Done | P1 | F-07 |
| 8 | Frontmatter | Rendering | Done | P2 | F-08 |
| 9 | Color Swatch | Rendering | Done | P2 | F-09 |
| 10 | Pan/Zoom | UX | Done | P2 | F-10 |
| 11 | Copy Button | UX | Done | P2 | F-11 |
| 12 | Image Resolve | Rendering | Done | P1 | F-12 |

---

Test complete. Verify:
- Table columns align correctly (left/center/right)
- Ordered lists start from the specified number
- Nested blockquotes have progressively lighter borders
- Deeply nested lists render with proper indentation
- Nested task lists display checkboxes at each level
