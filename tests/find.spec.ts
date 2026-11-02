import { test, expect, type Page } from '@playwright/test';
import { build } from 'esbuild';
import path from 'node:path';
import type { PreviewFind } from '../src/webview/find';

declare global {
  interface Window {
    FindModule: { PreviewFind: typeof PreviewFind };
    findController: PreviewFind;
    acquireVsCodeApi: () => { postMessage: (message: unknown) => void; getState: () => null; setState: () => void };
  }
}

let findBundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ['src/webview/find.ts'], bundle: true, write: false,
    format: 'iife', globalName: 'FindModule', target: 'es2022',
  });
  findBundle = result.outputFiles[0].text;
});

async function mount(page: Page, html: string): Promise<void> {
  await page.setContent(`<style>body {margin:0;padding:16px} pre {white-space:pre;overflow:auto} .hidden {display:none}</style>${html}`);
  await page.addStyleTag({ path: path.resolve('media/find.css') });
  await page.addScriptTag({ content: findBundle });
  await page.evaluate(() => {
    window.findController = new window.FindModule.PreviewFind(Array.from(document.querySelectorAll<HTMLElement>('[data-search-root]')));
  });
}

const input = (page: Page) => page.getByRole('textbox', { name: 'Find in preview' });
const count = (page: Page) => page.getByRole('status');
async function search(page: Page, query: string): Promise<void> {
  await page.keyboard.press('Control+f');
  await input(page).fill(query);
}

async function currentText(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const highlight = CSS.highlights.get('mdmtp-find-current');
    return highlight ? Array.from(highlight)[0]?.toString() ?? null : null;
  });
}

test('shows total, current ordinal, both navigation directions and wraparound', async ({ page }) => {
  await mount(page, '<main id="content" data-search-root><p>Apple apple APPLE</p></main>');
  await search(page, 'apple');
  await expect(count(page)).toHaveText('1 / 3');
  await expect(count(page)).toHaveAttribute('aria-label', 'Match 1 of 3');
  expect(await currentText(page)).toBe('Apple');
  await input(page).press('Enter');
  await expect(count(page)).toHaveText('2 / 3');
  expect(await currentText(page)).toBe('apple');
  await page.getByRole('button', { name: 'Next match (Enter)', exact: true }).click();
  await expect(count(page)).toHaveText('3 / 3');
  expect(await currentText(page)).toBe('APPLE');
  await page.getByRole('button', { name: 'Next match (Enter)', exact: true }).click();
  await expect(count(page)).toHaveText('1 / 3');
  await input(page).focus();
  await input(page).press('Shift+Enter');
  await expect(count(page)).toHaveText('3 / 3');
  await page.getByRole('button', { name: 'Previous match (Shift+Enter)', exact: true }).click();
  await expect(count(page)).toHaveText('2 / 3');
});

test('empty query and no results show 0 / 0 with disabled navigation', async ({ page }) => {
  await mount(page, '<main data-search-root>one</main>');
  await search(page, 'missing');
  await expect(count(page)).toHaveText('0 / 0');
  await expect(count(page)).toHaveAttribute('aria-label', 'No matches');
  await expect(page.getByRole('button', { name: 'Next match (Enter)', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Previous match (Shift+Enter)', exact: true })).toBeDisabled();
  expect(await currentText(page)).toBeNull();
  await input(page).fill('one');
  await expect(count(page)).toHaveText('1 / 1');
  await input(page).fill('');
  await expect(count(page)).toHaveText('0 / 0');
  expect(await currentText(page)).toBeNull();
});

test('does not truncate large totals and resets the ordinal when the query changes', async ({ page }) => {
  await mount(page, `<main data-search-root>${'word '.repeat(1005)}</main>`);
  await search(page, 'word');
  await expect(count(page)).toHaveText('1 / 1005');
  await input(page).press('Shift+Enter');
  await expect(count(page)).toHaveText('1005 / 1005');
  await input(page).fill('or');
  await expect(count(page)).toHaveText('1 / 1005');
  expect(await page.evaluate(() => CSS.highlights.get('mdmtp-find-matches')!.size)).toBe(1005);
});

for (const [name, html, query, expected] of [
  ['Japanese', '<p>検索機能 検索機能</p>', '検索機能', '1 / 2'],
  ['Unicode offsets', '<p>😀検索 😀検索</p>', '😀検索', '1 / 2'],
  ['literal regular expression characters', '<p>C++ (a.b) [test] C++ (a.b) [test]</p>', 'C++ (a.b) [test]', '1 / 2'],
  ['non-overlapping matches', '<p>aaaaa</p>', 'aa', '1 / 2'],
  ['inline formatting', '<p>search <strong>across</strong> <em>formatting</em></p>', 'search across formatting', '1 / 1'],
  ['inline decorators', '<p>Color <code>#aabbcc</code><span style="display:inline-block;width:1em;height:1em"></span> is nice</p>', '#aabbcc is nice', '1 / 1'],
  ['rendered whitespace', '<p>alpha   \n <strong> beta</strong></p>', 'alpha beta', '1 / 1'],
  ['preformatted whitespace', '<pre><code>alpha  beta\nalpha beta</code></pre>', 'alpha  beta', '1 / 1'],
  ['paragraph boundaries', '<p>alpha</p><p>beta</p>', 'alphabeta', '0 / 0'],
  ['line-break boundaries', '<p>alpha<br>beta</p>', 'alphabeta', '0 / 0'],
  ['table cell boundaries', '<table><tr><td>alpha</td><td>beta</td></tr></table>', 'alphabeta', '0 / 0'],
] as const) {
  test(`searches ${name} correctly`, async ({ page }) => {
    await mount(page, `<main data-search-root>${html}</main>`);
    await search(page, query);
    await expect(count(page)).toHaveText(expected);
  });
}

test('counts content, excluding outline duplicates, controls and hidden text', async ({ page }) => {
  await mount(page, `<nav>needle</nav><main data-search-root><h1>needle</h1>
    <span hidden>needle</span><span class="hidden">needle</span><span style="visibility:hidden">needle</span>
    <button>needle</button><div class="copy-button">needle</div><div class="mermaid-toolbar">needle</div>
    <script type="text/plain">needle</script><style>.needle { color: red }</style>
    <details><summary>Summary</summary><p>needle</p></details></main>`);
  await search(page, 'needle');
  await expect(count(page)).toHaveText('1 / 1');
  await page.locator('summary').click();
  await expect(count(page)).toHaveText('1 / 2');
});

test('preserves markup and code copy behavior while highlights update', async ({ page }) => {
  await mount(page, '<main id="content" data-search-root><pre><code><span class="hljs-keyword">const</span> value = 1;</code><button id="copy">Copy</button></pre></main>');
  await page.evaluate(() => document.getElementById('copy')!.addEventListener('click', () => { document.getElementById('copy')!.textContent = 'Copied'; }));
  const before = await page.locator('#content').innerHTML();
  await search(page, 'const value');
  await expect(count(page)).toHaveText('1 / 1');
  expect(await page.locator('#content').innerHTML()).toBe(before);
  expect(await currentText(page)).toBe('const value');
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.locator('#copy')).toHaveText('Copied');
});

test('refreshes totals and clamps the current result after edits', async ({ page }) => {
  await mount(page, '<main id="content" data-search-root><p>word word word</p></main>');
  await search(page, 'word');
  await expect(count(page)).toHaveText('1 / 3');
  await input(page).press('Enter');
  await input(page).press('Enter');
  await expect(count(page)).toHaveText('3 / 3');
  await page.evaluate(() => { document.getElementById('content')!.textContent = 'word word'; window.findController.refresh(); });
  await expect(count(page)).toHaveText('2 / 2');
  await page.evaluate(() => { document.getElementById('content')!.textContent = 'gone'; window.findController.refresh(); });
  await expect(count(page)).toHaveText('0 / 0');
  expect(await currentText(page)).toBeNull();
});

test('IME composition does not navigate or close the search', async ({ page }) => {
  await mount(page, '<main data-search-root>検索 検索</main>');
  await search(page, '検索');
  await expect(count(page)).toHaveText('1 / 2');
  await input(page).dispatchEvent('compositionstart');
  await input(page).press('Enter');
  await input(page).press('Escape');
  await expect(input(page)).toBeVisible();
  await expect(count(page)).toHaveText('1 / 2');
  await input(page).dispatchEvent('compositionend');
  await input(page).press('Enter');
  await expect(count(page)).toHaveText('2 / 2');
});

test('Escape clears highlights and reopening retains the search query', async ({ page }) => {
  await mount(page, '<main id="content" data-search-root>word word</main>');
  await search(page, 'word');
  await expect(count(page)).toHaveText('1 / 2');
  await input(page).press('Escape');
  await expect(input(page)).toBeHidden();
  expect(await page.evaluate(() => CSS.highlights.has('mdmtp-find-current'))).toBe(false);
  await page.keyboard.press('Meta+f');
  await expect(input(page)).toBeFocused();
  await expect(input(page)).toHaveValue('word');
  await expect(count(page)).toHaveText('1 / 2');
});

test('reveals matches deep inside long code blocks', async ({ page }) => {
  await mount(page, `<main id="content" data-search-root><pre><code>${'line\n'.repeat(250)}target</code></pre></main>`);
  await search(page, 'target');
  await expect(count(page)).toHaveText('1 / 1');
  expect(await page.evaluate(() => {
    const range = Array.from(CSS.highlights.get('mdmtp-find-current')!)[0] as Range;
    const bounds = range.getBoundingClientRect();
    return bounds.top >= 44 && bounds.bottom <= innerHeight;
  })).toBe(true);
});

test('fits narrow previews and remains readable with a high-contrast theme', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 640 });
  await mount(page, '<main id="content" data-search-root>word word</main>');
  await page.addStyleTag({ content: 'body {background:#000;color:#fff;--vscode-editor-background:#000;--vscode-editor-foreground:#fff;--vscode-editorWidget-background:#000;--vscode-editorWidget-foreground:#fff;--vscode-editor-findMatchBackground:transparent;--vscode-focusBorder:#fff;--vscode-widget-border:#fff}' });
  await search(page, 'word');
  await expect(count(page)).toHaveText('1 / 2');
  expect(await page.getByRole('search').evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && el.scrollWidth <= el.clientWidth;
  })).toBe(true);
  await page.screenshot({ path: 'test-results/find-narrow.png' });
});

async function mountProduction(page: Page, diff: boolean): Promise<void> {
  await page.setContent(diff
    ? '<div class="diff-container"><div id="base-pane" class="diff-pane"><div id="base-content" class="diff-pane-content"></div></div><div id="current-pane" class="diff-pane"><div id="current-content" class="diff-pane-content"></div></div></div>'
    : '<button id="toc-toggle"></button><div id="toc-sidebar"><button class="toc-close-btn"></button><nav id="toc-list"></nav></div><div id="content"></div>');
  await page.addStyleTag({ path: path.resolve('media/preview.css') });
  if (diff) await page.addStyleTag({ path: path.resolve('media/diff-preview.css') });
  await page.addStyleTag({ path: path.resolve('media/find.css') });
  await page.evaluate(() => { window.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} }); });
  await page.addScriptTag({ path: path.resolve(diff ? 'media/diff-preview.js' : 'media/preview.js') });
}

test('regular preview updates the open search after production re-rendering', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  await mountProduction(page, false);
  await page.evaluate(() => window.postMessage({ type: 'update', html: '<p>apple apple</p>', headings: [] }));
  await expect(page.locator('#content')).toContainText('apple apple');
  // Extension command messages must open the same widget as the keyboard shortcut.
  await page.evaluate(() => window.postMessage({ type: 'find' }));
  await input(page).fill('apple');
  await expect(count(page)).toHaveText('1 / 2');
  await page.evaluate(() => window.postMessage({ type: 'update', html: '<p>apple apple apple</p>', headings: [] }));
  await expect(count(page)).toHaveText('1 / 3');
  expect(errors).toEqual([]);
});

test('regular preview includes Mermaid labels once asynchronous rendering finishes', async ({ page }) => {
  await mountProduction(page, false);
  await search(page, 'needle');
  await expect(count(page)).toHaveText('0 / 0');
  await page.evaluate(() => {
    const source = btoa('flowchart LR\n A[needle] --> B[needle]');
    window.postMessage({ type: 'update', html: `<div class="mermaid-source" data-mermaid="${source}"></div>`, headings: [] });
  });
  await expect(page.locator('.mermaid-diagram')).toBeVisible();
  await expect(count(page)).toHaveText('1 / 2');
});

test('Rich Diff combines both panes, identifies the active side, and refreshes no-change renders', async ({ page }) => {
  await mountProduction(page, true);
  await page.evaluate(() => window.postMessage({ type: 'update', baseHtml: '<p>apple apple</p>', currentHtml: '<p>apple</p>', hasChanges: true }));
  await expect(page.locator('#base-content')).toHaveText('apple apple');
  await search(page, 'apple');
  await expect(count(page)).toHaveText('1 / 3');
  await input(page).press('Shift+Enter');
  await expect(count(page)).toHaveText('3 / 3');
  expect(await page.evaluate(() => {
    const range = Array.from(CSS.highlights.get('mdmtp-find-current')!)[0] as Range;
    return range.startContainer.parentElement?.closest('.diff-pane-content')?.id;
  })).toBe('current-content');
  await page.evaluate(() => window.postMessage({ type: 'update', baseHtml: '<p>apple</p>', currentHtml: '<p>apple</p>', hasChanges: false }));
  await expect(count(page)).toHaveText('2 / 2');
  await input(page).fill('No changes');
  await expect(count(page)).toHaveText('0 / 0');
});
