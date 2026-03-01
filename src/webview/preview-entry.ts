import mermaid from 'mermaid';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import Panzoom from '@panzoom/panzoom';

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
  fontFamily: '"trebuchet ms", verdana, arial, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif',
});

const panzoomCleanups: (() => void)[] = [];

function destroyAllPanzoom(): void {
  for (const cleanup of panzoomCleanups) {
    cleanup();
  }
  panzoomCleanups.length = 0;
}

function createSvgIcon(pathD: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'currentColor');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

// SVG path data for toolbar icons (codicon-style monochrome)
const ICON_MOVE = 'M8 1L5.5 3.5L6.2 4.2L7.5 2.9V7.5H2.9L4.2 6.2L3.5 5.5L1 8L3.5 10.5L4.2 9.8L2.9 8.5H7.5V13.1L6.2 11.8L5.5 12.5L8 15L10.5 12.5L9.8 11.8L8.5 13.1V8.5H13.1L11.8 9.8L12.5 10.5L15 8L12.5 5.5L11.8 6.2L13.1 7.5H8.5V2.9L9.8 4.2L10.5 3.5L8 1Z';
const ICON_ZOOM_IN = 'M15.25 13.79L12.13 10.67C12.82 9.65 13.22 8.44 13.22 7.11C13.22 3.73 10.49 1 7.11 1C3.73 1 1 3.73 1 7.11C1 10.49 3.73 13.22 7.11 13.22C8.44 13.22 9.65 12.82 10.67 12.13L13.79 15.25L15.25 13.79ZM2.5 7.11C2.5 4.56 4.56 2.5 7.11 2.5C9.66 2.5 11.72 4.56 11.72 7.11C11.72 9.66 9.66 11.72 7.11 11.72C4.56 11.72 2.5 9.66 2.5 7.11ZM7.82 4.5H6.32V6.4H4.42V7.9H6.32V9.8H7.82V7.9H9.72V6.4H7.82V4.5Z';
const ICON_ZOOM_OUT = 'M15.25 13.79L12.13 10.67C12.82 9.65 13.22 8.44 13.22 7.11C13.22 3.73 10.49 1 7.11 1C3.73 1 1 3.73 1 7.11C1 10.49 3.73 13.22 7.11 13.22C8.44 13.22 9.65 12.82 10.67 12.13L13.79 15.25L15.25 13.79ZM2.5 7.11C2.5 4.56 4.56 2.5 7.11 2.5C9.66 2.5 11.72 4.56 11.72 7.11C11.72 9.66 9.66 11.72 7.11 11.72C4.56 11.72 2.5 9.66 2.5 7.11ZM4.42 6.4H9.72V7.9H4.42V6.4Z';
const ICON_RESET = 'M4.75 1.5C4.75 1.22 4.53 1 4.25 1C3.97 1 3.75 1.22 3.75 1.5V4.09C2.42 5.18 1.5 6.78 1.5 8.5C1.5 11.81 4.19 14.5 7.5 14.5C10.81 14.5 13.5 11.81 13.5 8.5C13.5 5.19 10.81 2.5 7.5 2.5C6.47 2.5 5.5 2.77 4.65 3.23L4.75 1.5ZM7.5 3.5C10.26 3.5 12.5 5.74 12.5 8.5C12.5 11.26 10.26 13.5 7.5 13.5C4.74 13.5 2.5 11.26 2.5 8.5C2.5 5.74 4.74 3.5 7.5 3.5Z';

function applyPanZoom(container: HTMLElement): void {
  const svgEl = container.querySelector<SVGElement>('svg');
  if (!svgEl) return;

  // Wrap SVG in a div so Panzoom uses CSS transforms (not SVG transforms)
  const wrapper = document.createElement('div');
  wrapper.className = 'mermaid-panzoom-wrapper';
  svgEl.replaceWith(wrapper);
  wrapper.appendChild(svgEl);

  let isActive = false;

  // Initialize Panzoom with pan disabled by default
  const pz = Panzoom(wrapper, {
    maxScale: 5,
    minScale: 0.5,
    step: 0.3,
    disablePan: true,
    handleStartEvent: (e: Event) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
    },
  });

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'mermaid-toolbar';

  // Toggle button (always visible on hover)
  const btnToggle = document.createElement('button');
  btnToggle.className = 'mermaid-btn';
  btnToggle.title = 'Toggle Pan/Zoom Mode';
  btnToggle.appendChild(createSvgIcon(ICON_MOVE));

  const btnZoomIn = document.createElement('button');
  btnZoomIn.className = 'mermaid-btn';
  btnZoomIn.title = 'Zoom In';
  btnZoomIn.appendChild(createSvgIcon(ICON_ZOOM_IN));

  const btnZoomOut = document.createElement('button');
  btnZoomOut.className = 'mermaid-btn';
  btnZoomOut.title = 'Zoom Out';
  btnZoomOut.appendChild(createSvgIcon(ICON_ZOOM_OUT));

  const btnReset = document.createElement('button');
  btnReset.className = 'mermaid-btn';
  btnReset.title = 'Reset';
  btnReset.appendChild(createSvgIcon(ICON_RESET));

  toolbar.appendChild(btnToggle);
  toolbar.appendChild(btnZoomIn);
  toolbar.appendChild(btnZoomOut);
  toolbar.appendChild(btnReset);
  container.appendChild(toolbar);

  function enterZoomMode(): void {
    isActive = true;
    pz.setOptions({ disablePan: false });
    container.addEventListener('wheel', pz.zoomWithWheel, { passive: false });
    container.classList.add('mermaid-zoom-active');
    btnToggle.classList.add('mermaid-btn-active');
  }

  function exitZoomMode(): void {
    pz.setOptions({ disablePan: true });
    container.removeEventListener('wheel', pz.zoomWithWheel);
    container.classList.remove('mermaid-zoom-active');
    btnToggle.classList.remove('mermaid-btn-active');
    isActive = false;
  }

  // Button event listeners
  btnToggle.addEventListener('click', () => {
    if (isActive) {
      exitZoomMode();
    } else {
      enterZoomMode();
    }
  });
  btnZoomIn.addEventListener('click', () => pz.zoomIn());
  btnZoomOut.addEventListener('click', () => pz.zoomOut());
  btnReset.addEventListener('click', () => pz.reset({ animate: true }));

  // Click outside to exit zoom mode
  const onDocumentMouseDown = (e: MouseEvent) => {
    if (isActive && !container.contains(e.target as Node)) {
      exitZoomMode();
    }
  };
  document.addEventListener('mousedown', onDocumentMouseDown);

  // Cleanup
  panzoomCleanups.push(() => {
    container.removeEventListener('wheel', pz.zoomWithWheel);
    document.removeEventListener('mousedown', onDocumentMouseDown);
    pz.destroy();
  });
}

let mermaidCounter = 0;

async function applyMermaid(): Promise<void> {
  const elements = document.querySelectorAll('.mermaid-source');
  for (const el of elements) {
    const encoded = el.getAttribute('data-mermaid');
    if (!encoded) continue;
    const source = new TextDecoder().decode(
      Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    );

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
      applyPanZoom(container);
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

// Mermaid async rendering coordination
let pendingScrollLine: number | null = null;
let isMermaidRendering = false;

function applyScrollIfReady(): void {
  if (isMermaidRendering || pendingScrollLine === null) return;
  executeScroll(pendingScrollLine);
  pendingScrollLine = null;
}

function executeScroll(line: number): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-line]'));
  if (elements.length === 0) return;

  // Parse and sort by line number
  const mapped = elements
    .map(el => ({ el, line: parseInt(el.getAttribute('data-line')!, 10) }))
    .filter(e => !isNaN(e.line))
    .sort((a, b) => a.line - b.line);
  if (mapped.length === 0) return;

  // Find the two bracketing elements
  let before = mapped[0];
  let after = mapped[mapped.length - 1];
  for (let i = 0; i < mapped.length; i++) {
    if (mapped[i].line <= line) before = mapped[i];
    if (mapped[i].line >= line) { after = mapped[i]; break; }
  }

  const containerTop = document.body.getBoundingClientRect().top;

  if (before === after || before.line === after.line) {
    const top = before.el.getBoundingClientRect().top - containerTop;
    window.scrollTo({ top, behavior: 'instant' });
    return;
  }

  const beforeTop = before.el.getBoundingClientRect().top - containerTop;
  const afterTop = after.el.getBoundingClientRect().top - containerTop;
  const fraction = (line - before.line) / (after.line - before.line);
  const scrollTarget = beforeTop + fraction * (afterTop - beforeTop);
  window.scrollTo({ top: scrollTarget, behavior: 'instant' });
}

function scrollToLine(line: number, _totalLines: number): void {
  isScrollingFromEditor = true;
  clearTimeout(scrollFromEditorTimer);
  scrollFromEditorTimer = setTimeout(() => { isScrollingFromEditor = false; }, 200);

  pendingScrollLine = line;
  applyScrollIfReady();
}

// Preview → Editor scroll sync (element-based)
let scrollDebounce: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('scroll', () => {
  if (isScrollingFromEditor) return;
  clearTimeout(scrollDebounce);
  scrollDebounce = setTimeout(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-line]');
    if (elements.length === 0) return;

    // Find the element closest to the viewport top
    let closestLine = 0;
    let closestDist = Infinity;
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top);
      if (dist < closestDist) {
        closestDist = dist;
        closestLine = parseInt(el.getAttribute('data-line')!, 10);
      }
    }
    if (!isNaN(closestLine)) {
      vscode.postMessage({ type: 'scrollEditor', line: closestLine });
    }
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
      destroyAllPanzoom();
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
        fontFamily: '"trebuchet ms", verdana, arial, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif',
      });
      isMermaidRendering = true;
      await applyMermaid();
      isMermaidRendering = false;
      if (currentVersion !== renderVersion) break;
      applyHighlight();
      applyCopyButtons();
      applyScrollIfReady();
      break;
    }
    case 'scroll': {
      scrollToLine(message.line, message.totalLines);
      break;
    }
  }
});

vscode.postMessage({ type: 'ready' });
