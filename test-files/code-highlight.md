# Code Highlight Test

## TypeScript

```typescript
interface PreviewConfig {
  autoPreview: boolean;
  debounceMs: number;
}

function activate(context: vscode.ExtensionContext): void {
  const manager = new PreviewManager(context.extensionUri);

  context.subscriptions.push(
    vscode.commands.registerCommand('mdMultiTabPreview.togglePreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor?.document.languageId === 'markdown') {
        manager.togglePreview(editor.document);
      }
    })
  );
}
```

## JavaScript

```js
const esbuild = require('esbuild');

async function build() {
  await esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    format: 'cjs',
    platform: 'node',
  });
  console.log('Build complete.');
}

build().catch(console.error);
```

## Python

```python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    sequence = [0, 1]
    for _ in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

for i, num in enumerate(fibonacci(10)):
    print(f"F({i}) = {num}")
```

## HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Preview</title>
</head>
<body>
  <div id="content"></div>
  <script src="preview.js"></script>
</body>
</html>
```

## CSS

```css
.heading-prefix {
  color: var(--vscode-descriptionForeground);
  font-size: 0.7em;
  font-weight: normal;
  opacity: 0.6;
}

.mermaid-error {
  border: 1px solid var(--vscode-errorForeground);
  background: var(--vscode-inputValidation-errorBackground);
  padding: 12px;
  border-radius: 4px;
}
```

## JSON

```json
{
  "name": "markdown-multi-tab-preview",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.100.0"
  },
  "contributes": {
    "commands": [
      {
        "command": "mdMultiTabPreview.togglePreview",
        "title": "Markdown Multi Tab Preview: Toggle Preview"
      }
    ]
  }
}
```

## Shell

```bash
#!/bin/bash
pnpm install
pnpm run compile
echo "Extension built successfully"
```

## No Language Specified (Auto-detect)

```
function hello() {
  return "world";
}
```
