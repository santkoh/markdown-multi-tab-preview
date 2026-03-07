# Image Rendering Test

## 1. Relative Path (Local Image)

The extension resolves relative paths via `webview.asWebviewUri()`.

![Extension Icon](../media/icon.png)

## 2. Relative Path with Alt Text and Title

![Alt text for icon](../media/icon.png "This is the title tooltip")

## 3. Remote Image (HTTPS)

Requires `allowRemoteImages: true` (default). Disable to test blocking.

![Placeholder image](https://placehold.co/300x150/3498db/ffffff?text=Remote+Image)

## 4. Remote Image with Title

![Remote with title](https://placehold.co/200x100/e74c3c/ffffff?text=Title+Test "Remote image title")

## 5. Broken Image (404)

Should show broken image icon with alt text.

![This image does not exist](./nonexistent-image.png)

## 6. Image in a Link

[![Clickable image](https://placehold.co/150x75/2ecc71/ffffff?text=Click+Me)](https://github.com)

## 7. Image with Query Parameters

Relative path with query string should be preserved.

![Query test](../media/icon.png?v=1&size=large)

## 8. Image with Fragment

![Fragment test](../media/icon.png#section)

## 9. Image with Query and Fragment

![Both test](../media/icon.png?v=2#top)

## 10. Data URI Image (Base64)

Should pass through without resolution.

![Red dot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0AEYBxVOHIUAgBGWAgE/dLkRAAAAABJRU5ErkJggg==)

## 11. Protocol-relative URL

Should not be resolved as relative path.

![Protocol relative](//placehold.co/100x50/9b59b6/ffffff?text=Protocol)

## 12. Multiple Images in Sequence

![Icon 1](../media/icon.png) ![Icon 2](../media/icon.png) ![Icon 3](../media/icon.png)

## 13. Image Inside Other Elements

### In a list

- ![List item icon](../media/icon.png) Item with image

### In a blockquote

> ![Quoted image](../media/icon.png)
> Image inside a blockquote

### In a table

| Image | Description |
|-------|-------------|
| ![Table icon](../media/icon.png) | Icon in a table cell |

## 14. Empty Alt Text

![](../media/icon.png)

---

Test complete. Verify:
- Local images resolve and display
- Remote images load when `allowRemoteImages` is enabled
- Remote images are blocked when `allowRemoteImages` is disabled
- Alt text and title attributes render correctly
- Broken images show alt text fallback
- Query/fragment parameters are preserved
