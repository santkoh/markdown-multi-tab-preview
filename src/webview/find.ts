interface TextChunk {
  node: Text;
  start: number;
  text: string;
  // Maps normalized whitespace back to the original text node's offsets.
  offsets?: number[];
}

interface TextSegment {
  text: string;
  chunks: TextChunk[];
}

const IGNORE = 'script, style, noscript, template, button, input, textarea, select, '
  + 'svg defs, svg title, svg desc, .katex-mathml, .copy-button, .mermaid-toolbar, .diff-no-changes, [data-find-ignore]';
const MATCHES = 'mdmtp-find-matches';
const CURRENT = 'mdmtp-find-current';

function normalizeText(raw: string, collapse: boolean): { text: string; offsets?: number[] } {
  if (!collapse || !/[\t\r\n\f]| {2,}/.test(raw)) return { text: raw };
  let text = '';
  const offsets = [0];
  for (let i = 0; i < raw.length;) {
    if (/[ \t\r\n\f]/.test(raw[i])) {
      text += ' ';
      while (i < raw.length && /[ \t\r\n\f]/.test(raw[i])) i++;
    } else {
      text += raw[i++];
    }
    offsets.push(i);
  }
  return { text, offsets };
}

/** Index rendered text without joining separate paragraphs, cells, or panes. */
function indexText(roots: HTMLElement[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let segment: TextSegment = { text: '', chunks: [] };
  const flush = (): void => {
    if (segment.text.trim()) segments.push(segment);
    segment = { text: '', chunks: [] };
  };
  const walk = (element: Element): void => {
    if (element.matches(IGNORE)) { flush(); return; }
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const boundary = !style.display.startsWith('inline') && style.display !== 'contents'
      || element.localName === 'br' || element.localName === 'text';
    if (boundary) flush();
    if (element.localName === 'details' && !element.hasAttribute('open')) {
      const summary = element.querySelector(':scope > summary');
      if (summary) walk(summary);
      if (boundary) flush();
      return;
    }
    for (const node of element.childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        walk(node as Element);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const range = document.createRange();
        range.selectNodeContents(node);
        // Off-screen text still has rectangles; collapsed details/hidden text do not.
        if (!Array.from(range.getClientRects()).some(rect => rect.width > 0 && rect.height > 0)) continue;
        const normalized = normalizeText(node.textContent, ['normal', 'nowrap'].includes(style.whiteSpace));
        if (segment.text.endsWith(' ') && normalized.text.startsWith(' ')
          && ['normal', 'nowrap'].includes(style.whiteSpace)) {
          normalized.text = normalized.text.slice(1);
          normalized.offsets = normalized.offsets?.slice(1)
            ?? Array.from({ length: normalized.text.length + 1 }, (_, i) => i + 1);
        }
        if (!normalized.text) continue;
        segment.chunks.push({ node: node as Text, start: segment.text.length, ...normalized });
        segment.text += normalized.text;
      }
    }
    if (boundary) flush();
  };
  for (const root of roots) { walk(root); flush(); }
  return segments;
}

function findRanges(segments: TextSegment[], query: string): Range[] {
  if (!query) return [];
  // Literal, case-insensitive search. RegExp offsets remain correct for Unicode.
  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
  const ranges: Range[] = [];
  for (const segment of segments) {
    let cursor = 0;
    for (const match of segment.text.matchAll(pattern)) {
      const start = match.index!;
      const end = start + match[0].length;
      while (segment.chunks[cursor].start + segment.chunks[cursor].text.length <= start) cursor++;
      const first = segment.chunks[cursor];
      let lastIndex = cursor;
      while (segment.chunks[lastIndex].start + segment.chunks[lastIndex].text.length < end) lastIndex++;
      const last = segment.chunks[lastIndex];
      const range = document.createRange();
      range.setStart(first.node, first.offsets?.[start - first.start] ?? start - first.start);
      range.setEnd(last.node, last.offsets?.[end - last.start] ?? end - last.start);
      ranges.push(range);
    }
  }
  return ranges;
}

/** Reveal the actual text range, including matches deep inside long code blocks. */
function revealRange(range: Range): void {
  for (let element = range.startContainer.parentElement; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    const rect = range.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) {
      element.scrollTop += rect.top - bounds.top - (element.clientHeight - rect.height) / 2;
    }
    if (/(auto|scroll)/.test(style.overflowX) && element.scrollWidth > element.clientWidth) {
      element.scrollLeft += rect.left - bounds.left - (element.clientWidth - rect.width) / 2;
    }
  }
  const rect = range.getBoundingClientRect();
  window.scrollBy({ top: rect.top - (window.innerHeight - rect.height) / 2, behavior: 'instant' });
}

/** Shared, self-contained find UI for regular and side-by-side previews. */
export class PreviewFind {
  private readonly widget = document.createElement('div');
  private readonly input = document.createElement('input');
  private readonly count = document.createElement('span');
  private readonly previous: HTMLButtonElement;
  private readonly next: HTMLButtonElement;
  private segments: TextSegment[] | undefined;
  private ranges: Range[] = [];
  private query: string | null = null;
  private current = -1;
  private composing = false;
  private inputTimer: ReturnType<typeof setTimeout> | undefined;
  private previousFocus: HTMLElement | null = null;

  constructor(private readonly roots: HTMLElement[]) {
    this.widget.className = 'preview-find';
    this.widget.hidden = true;
    this.widget.setAttribute('role', 'search');
    this.widget.setAttribute('aria-label', 'Find in preview');
    this.input.type = 'text';
    this.input.placeholder = 'Find in preview';
    this.input.setAttribute('aria-label', 'Find in preview');
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.count.className = 'preview-find-count';
    this.count.setAttribute('role', 'status');
    this.count.setAttribute('aria-live', 'polite');
    this.count.setAttribute('aria-atomic', 'true');
    this.widget.append(this.input, this.count);
    this.previous = this.button('↑', 'Previous match (Shift+Enter)', () => this.move(-1));
    this.next = this.button('↓', 'Next match (Enter)', () => this.move(1));
    this.button('×', 'Close search (Escape)', () => this.close());
    document.body.append(this.widget);
    this.updateDisplay(false);

    this.input.addEventListener('input', () => {
      clearTimeout(this.inputTimer);
      if (!this.composing) this.inputTimer = setTimeout(() => this.search(true), 50);
    });
    this.input.addEventListener('compositionstart', () => { this.composing = true; });
    this.input.addEventListener('compositionend', () => {
      this.composing = false;
      clearTimeout(this.inputTimer);
      this.search(true);
    });
    window.addEventListener('keydown', this.onKeyDown, true);
    for (const root of roots) root.addEventListener('toggle', this.onToggle, true);
  }

  private button(text: string, label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', action);
    this.widget.append(button);
    return button;
  }

  public open(): void {
    if (this.widget.hidden) {
      this.previousFocus = document.activeElement as HTMLElement | null;
      this.widget.hidden = false;
      document.body.classList.add('find-open');
      this.refresh();
    }
    this.input.focus({ preventScroll: true });
    this.input.select();
  }

  public close(): void {
    clearTimeout(this.inputTimer);
    this.widget.hidden = true;
    document.body.classList.remove('find-open');
    CSS.highlights.delete(MATCHES);
    CSS.highlights.delete(CURRENT);
    this.ranges = [];
    this.segments = undefined;
    this.current = -1;
    this.query = null;
    const target = this.previousFocus?.isConnected && !this.widget.contains(this.previousFocus)
      ? this.previousFocus : this.roots[0];
    if (target) {
      // Content is not normally tabbable, but must regain webview keyboard focus.
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }

  /** Re-index after document rendering or a details element changes visibility. */
  public refresh(): void {
    this.segments = undefined;
    this.query = null;
    if (!this.widget.hidden) this.search(false);
  }

  private search(reveal: boolean): void {
    if (this.widget.hidden || this.composing) return;
    const changed = this.query !== null && this.query !== this.input.value;
    if (!this.segments || this.query !== this.input.value) {
      this.segments ??= indexText(this.roots);
      this.ranges = findRanges(this.segments, this.input.value);
      this.query = this.input.value;
      this.current = this.ranges.length ? (changed ? 0 : Math.max(0, Math.min(this.current, this.ranges.length - 1))) : -1;
    }
    this.updateDisplay(reveal);
  }

  private move(direction: number): void {
    clearTimeout(this.inputTimer);
    this.search(false);
    if (!this.ranges.length) return;
    this.current = (this.current + direction + this.ranges.length) % this.ranges.length;
    this.updateDisplay(true);
  }

  private updateDisplay(reveal: boolean): void {
    const total = this.ranges.length;
    this.count.textContent = `${this.current + 1} / ${total}`;
    const description = total ? `Match ${this.current + 1} of ${total}` : 'No matches';
    this.count.setAttribute('aria-label', description);
    this.count.title = description;
    this.previous.disabled = this.next.disabled = total === 0;
    const matches = new Highlight();
    for (const range of this.ranges) matches.add(range);
    CSS.highlights.set(MATCHES, matches);
    const active = new Highlight();
    active.priority = 1;
    const range = this.ranges[this.current];
    if (range) active.add(range);
    CSS.highlights.set(CURRENT, active);
    if (reveal && range) revealRange(range);
  }

  private readonly onToggle = (): void => { this.refresh(); };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.isComposing || this.composing || event.keyCode === 229) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      event.stopPropagation();
      this.open();
    } else if (!this.widget.hidden && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (!this.widget.hidden && event.target === this.input && event.key === 'Enter') {
      event.preventDefault();
      this.move(event.shiftKey ? -1 : 1);
    }
  };

  public dispose(): void {
    this.close();
    window.removeEventListener('keydown', this.onKeyDown, true);
    for (const root of this.roots) root.removeEventListener('toggle', this.onToggle, true);
    this.widget.remove();
  }
}
