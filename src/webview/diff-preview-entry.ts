import DOMPurify from 'dompurify';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
};

const vscode = acquireVsCodeApi();

const basePane = document.getElementById('base-content') as HTMLElement;
const currentPane = document.getElementById('current-content') as HTMLElement;

const DOMPUR_OPTIONS: DOMPurify.Config = {
  FORBID_TAGS: ['form', 'input', 'textarea', 'select', 'button', 'object', 'embed', 'iframe'],
};

/**
 * Apply diff classes to elements in a pane using block-range matching.
 *
 * `data-line` attributes in the rendered HTML are 0-based block start lines.
 * The diff map keys are also 0-based (converted from 1-based hunk headers in diffParser.ts).
 *
 * A block starting at `start` covers lines [start, nextBlockStart).
 * If any diff line number falls in that range with `expectedStatus`, the block gets highlighted.
 */
function applyDiffClasses(
  pane: HTMLElement,
  diffMap: Map<number, string>,
  expectedStatus: 'added' | 'removed',
): void {
  const items = Array.from(pane.querySelectorAll<HTMLElement>('[data-line]'))
    .map(el => ({ el, line: parseInt(el.getAttribute('data-line')!, 10) }))
    .filter(item => !isNaN(item.line))
    .sort((a, b) => a.line - b.line);

  for (let i = 0; i < items.length; i++) {
    const start = items[i].line;
    const end = i + 1 < items.length ? items[i + 1].line : Infinity;

    // Check if any diff line in [start, end) has the expected status.
    let match = false;
    for (const [diffLine, status] of diffMap) {
      if (diffLine >= start && diffLine < end && status === expectedStatus) {
        match = true;
        break;
      }
    }

    if (match) {
      items[i].el.classList.add(`diff-${expectedStatus}`);
    }
  }
}

// ─── Scroll sync ─────────────────────────────────────────────────────────────

let syncing = false;

function syncScroll(from: HTMLElement, to: HTMLElement): void {
  if (syncing) return;
  syncing = true;
  const scrollable = from.scrollHeight - from.clientHeight;
  const ratio = scrollable > 0 ? from.scrollTop / scrollable : 0;
  const toScrollable = to.scrollHeight - to.clientHeight;
  to.scrollTop = ratio * toScrollable;
  requestAnimationFrame(() => {
    syncing = false;
  });
}

// Scroll containers are the .diff-pane wrappers (overflow: auto), not the inner content divs.
const basePaneOuter = document.getElementById('base-pane') as HTMLElement;
const currentPaneOuter = document.getElementById('current-pane') as HTMLElement;

basePaneOuter.addEventListener('scroll', () => syncScroll(basePaneOuter, currentPaneOuter), { passive: true });
currentPaneOuter.addEventListener('scroll', () => syncScroll(currentPaneOuter, basePaneOuter), { passive: true });

// ─── Message handler ──────────────────────────────────────────────────────────

window.addEventListener('message', (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return;
  const msg = event.data as {
    type: string;
    baseHtml?: string;
    currentHtml?: string;
    oldLines?: [number, string][];
    newLines?: [number, string][];
    hasChanges?: boolean;
  };

  if (msg.type !== 'update') return;

  // Sanitize and render HTML for both panes.
  basePane.innerHTML = DOMPurify.sanitize(msg.baseHtml ?? '', DOMPUR_OPTIONS) as string;
  currentPane.innerHTML = DOMPurify.sanitize(msg.currentHtml ?? '', DOMPUR_OPTIONS) as string;

  // Hide mermaid placeholders (not rendered in diff view MVP).
  basePane.querySelectorAll('.mermaid-source').forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
  currentPane.querySelectorAll('.mermaid-source').forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });

  if (!msg.hasChanges) {
    // Show "no changes" banner in current pane header.
    const banner = document.createElement('div');
    banner.className = 'diff-no-changes';
    banner.textContent = 'No changes vs HEAD';
    currentPane.prepend(banner);
    return;
  }

  // Build maps from the serialized entries.
  const oldMap = new Map<number, string>(msg.oldLines ?? []);
  const newMap = new Map<number, string>(msg.newLines ?? []);

  applyDiffClasses(basePane, oldMap, 'removed');
  applyDiffClasses(currentPane, newMap, 'added');
});

// Notify extension that webview is ready.
vscode.postMessage({ type: 'ready' });
