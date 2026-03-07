# Copy Button Test

Hover over each code block to verify the "Copy" button appears.

## 1. Short Code Block

```
Hello, World!
```

## 2. Multi-line Code Block

```js
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

greet("Markdown Preview");
```

## 3. Code Block with Special Characters

```html
<div class="container">
  <p>&lt;script&gt;alert('test')&lt;/script&gt;</p>
  <span data-value="a &amp; b">Content</span>
</div>
```

## 4. Empty Code Block

```
```

## 5. Code Block with Only Whitespace

```

```

## 6. Very Long Single Line (Copy should capture full text)

```
{"name":"markdown-multi-tab-preview","version":"0.5.0","description":"Preview multiple Markdown files simultaneously with independent preview panels","publisher":"santkoh","engines":{"vscode":"^1.109.0"}}
```

## 7. Multiple Code Blocks (Each gets its own button)

```python
x = 1
```

```ruby
y = 2
```

```go
z := 3
```

## 8. Mermaid Error Block (Copy button on error)

```mermaid
graph TD
    invalid %%% syntax here
    A -->
```

The Mermaid error message above should also have a Copy button.

## 9. Code Block After Inline Code

Inline code `not copyable` should NOT have a copy button.

```
But this block code should have a copy button.
```

---

Test complete. Verify:
- "Copy" button appears on hover for all `pre` blocks
- Clicking "Copy" changes text to "Copied!" briefly
- Copied text matches the code block content exactly
- Mermaid error blocks also show a Copy button
- Inline code does NOT have a Copy button
