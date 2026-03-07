# Edge Cases Test

## 1. Empty Sections

### This section has no content

### This section also has no content

## 2. Heading Levels (All 6)

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## 3. Very Long Line

This is an extremely long line that should wrap properly in the preview panel without breaking the layout: Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum and this keeps going to test horizontal overflow behavior in the preview panel.

## 4. Very Long Code Line

```
this_is_a_very_long_variable_name = some_function_with_a_long_name(parameter_one, parameter_two, parameter_three, parameter_four, parameter_five, parameter_six) + another_long_function(arg1, arg2, arg3, arg4, arg5) * yet_another_function(x, y, z)
```

## 5. Special Characters and HTML Entities

### Angle brackets and ampersands

This has <angle brackets> and &ampersands& in plain text.

5 > 3 and 2 < 4 and Tom & Jerry

### HTML entities

&lt;div&gt; &amp; &quot;quotes&quot; &apos;apostrophe&apos;

### Unicode characters

Japanese: Markdownプレビュー拡張機能テスト
Chinese: Markdown预览扩展
Korean: 마크다운 미리보기
Arabic: معاينة
Russian: Предпросмотр Markdown
Thai: ดูตัวอย่าง Markdown

### Mathematical symbols

a + b = c, x^2 + y^2 = z^2

1 < 2 < 3 < 4

### Currency symbols

$100, 10000, 100, 100CHF

## 6. Emoji

Unicode emoji in text: Hello 🌍!

Emoji in headings, lists, and tables:

### ⭐ Star Section

- 🔥 Fire item
- ✅ Check item

| Emoji | Name |
|-------|------|
| 🙂 | smile |
| ❤️ | heart |
| 🚀 | rocket |

## 7. Deeply Nested Lists

- Level 1
  - Level 2
    - Level 3
      - Level 4
        - Level 5
          - Level 6
            - Level 7
              - Level 8 (how deep can we go?)

1. Level 1
   1. Level 2
      1. Level 3
         1. Level 4
            1. Level 5

## 8. Consecutive Horizontal Rules

---

---

---

## 9. Adjacent Code Blocks

```js
const a = 1;
```

```python
b = 2
```

```
plain text
```

## 10. Code Block with Empty Content

```js
```

```
```

## 11. Multiple Blank Lines Between Elements

Paragraph 1.



Paragraph 2 (after multiple blank lines).



Paragraph 3.

## 12. Only Bold/Italic/Code

**This entire paragraph is bold.**

*This entire paragraph is italic.*

`This entire paragraph is inline code.`

***This entire paragraph is bold and italic.***

## 13. Links with Special Characters

[Link with spaces](https://example.com/path%20with%20spaces)

[Link with Japanese](https://example.com/日本語パス)

[Link with parentheses](https://en.wikipedia.org/wiki/Markdown_(software))

## 14. Backslash Escapes

\*not italic\*

\# not a heading

\- not a list

\`not code\`

\[not a link\](not-a-url)

## 15. Very Long Table

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |

## 16. Single Character Content

a

## 17. Heading Immediately After Paragraph

This paragraph has no blank line after it.
## This Heading Follows Immediately

## 18. Inline Code with Pipe in Table

| Code | Description |
|------|-------------|
| `a \| b` | Pipe in code |
| `x > y` | Greater than |
| `1 & 2` | Ampersand |

---

Test complete. Verify:
- Empty sections don't cause rendering errors
- Long lines wrap or scroll properly
- Special characters are escaped correctly (no raw HTML injection)
- Unicode/emoji render properly
- Deep nesting renders with proper indentation
- Edge cases don't break the layout
