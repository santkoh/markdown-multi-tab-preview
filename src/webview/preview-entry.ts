import mermaid from 'mermaid';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

function getTheme(): 'dark' | 'default' {
  return document.body.classList.contains('vscode-dark') ||
    document.body.classList.contains('vscode-high-contrast')
    ? 'dark'
    : 'default';
}

mermaid.initialize({
  startOnLoad: false,
  theme: getTheme(),
  securityLevel: 'loose',
});

let mermaidCounter = 0;

async function applyMermaid(): Promise<void> {
  const elements = document.querySelectorAll('.mermaid-source');
  for (const el of elements) {
    const encoded = el.getAttribute('data-mermaid');
    if (!encoded) continue;
    const source = atob(encoded);

    const id = `mermaid-${mermaidCounter++}`;
    try {
      const { svg } = await mermaid.render(id, source);
      const container = document.createElement('div');
      container.className = 'mermaid-diagram';
      container.innerHTML = DOMPurify.sanitize(svg, {
        ADD_TAGS: ['foreignobject'],
        ADD_ATTR: ['dominant-baseline'],
        HTML_INTEGRATION_POINTS: { foreignobject: true },
        FORBID_CONTENTS: [],
      });
      el.replaceWith(container);
    } catch (err) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'mermaid-error';
      errorDiv.innerHTML = `
        <span class="mermaid-error-icon">\u26a0</span>
        <span class="mermaid-error-title">Mermaid Error:</span>
        <pre class="mermaid-error-message">${escapeForHtml(String(err))}</pre>
      `;
      el.replaceWith(errorDiv);
    }
  }
}

function applyHighlight(): void {
  const blocks = document.querySelectorAll<HTMLElement>('pre code');
  for (const block of blocks) {
    hljs.highlightElement(block);
  }
}

function copyToClipboard(text: string): boolean {
  // Fallback for webview where navigator.clipboard may not be available
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

function addCopyButton(container: HTMLElement, getText: () => string): void {
  if (container.querySelector('.copy-button')) return;
  container.style.position = 'relative';
  const btn = document.createElement('button');
  btn.className = 'copy-button';
  btn.textContent = 'Copy';
  btn.addEventListener('click', () => {
    const ok = copyToClipboard(getText());
    btn.textContent = ok ? 'Copied!' : 'Failed';
    if (ok) btn.classList.add('copy-button-copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copy-button-copied');
    }, 1500);
  });
  container.appendChild(btn);
}

function applyCopyButtons(): void {
  // Normal code blocks
  const pres = document.querySelectorAll<HTMLElement>('pre:not(.mermaid-error-message)');
  for (const pre of pres) {
    addCopyButton(pre, () => {
      const code = pre.querySelector('code');
      return (code ? code.textContent : pre.textContent) || '';
    });
  }

  // Mermaid error blocks — button on the parent .mermaid-error container
  const errors = document.querySelectorAll<HTMLElement>('.mermaid-error');
  for (const errorDiv of errors) {
    const msgPre = errorDiv.querySelector<HTMLElement>('.mermaid-error-message');
    addCopyButton(errorDiv, () => msgPre?.textContent || '');
  }
}

// Prevent infinite scroll loop between editor ↔ preview
let isScrollingFromEditor = false;
let scrollFromEditorTimer: ReturnType<typeof setTimeout> | undefined;

function scrollToLine(line: number, totalLines: number): void {
  if (totalLines <= 0) return;
  isScrollingFromEditor = true;
  clearTimeout(scrollFromEditorTimer);
  scrollFromEditorTimer = setTimeout(() => { isScrollingFromEditor = false; }, 200);

  const ratio = totalLines > 1 ? line / (totalLines - 1) : 0;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollTarget = ratio * maxScroll;
  window.scrollTo({ top: scrollTarget, behavior: 'instant' });
}

// Preview → Editor scroll sync
let scrollDebounce: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('scroll', () => {
  if (isScrollingFromEditor) return;
  clearTimeout(scrollDebounce);
  scrollDebounce = setTimeout(() => {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const ratio = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    vscode.postMessage({ type: 'scrollEditor', ratio });
  }, 50);
});

function escapeForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const content = document.getElementById('content');

let renderVersion = 0;

window.addEventListener('message', async (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  const message = event.data;
  switch (message.type) {
    case 'update': {
      const currentVersion = ++renderVersion;
      if (content) {
        content.innerHTML = DOMPurify.sanitize(message.html, {
          FORBID_TAGS: ['form', 'input', 'textarea', 'select', 'button', 'object', 'embed', 'iframe'],
        });
      }
      // Re-initialize mermaid with current theme
      mermaid.initialize({
        startOnLoad: false,
        theme: getTheme(),
        securityLevel: 'loose',
      });
      await applyMermaid();
      if (currentVersion !== renderVersion) break;
      applyHighlight();
      applyCopyButtons();
      break;
    }
    case 'scroll': {
      scrollToLine(message.line, message.totalLines);
      break;
    }
  }
});

vscode.postMessage({ type: 'ready' });
