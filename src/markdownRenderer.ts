import { Marked, Tokens } from 'marked';
import * as vscode from 'vscode';
import { escapeHtml } from './utils';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function extractFrontmatter(markdown: string): { frontmatter: string | null; body: string } {
  const match = markdown.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: markdown };
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length),
  };
}

function renderFrontmatterHtml(yaml: string): string {
  return `<div class="frontmatter">
  <div class="frontmatter-label">Frontmatter</div>
  <pre><code class="language-yaml">${escapeHtml(yaml)}</code></pre>
</div>\n`;
}

export function renderMarkdown(
  markdown: string,
  webview: vscode.Webview,
  documentUri: vscode.Uri
): string {
  const docDir = vscode.Uri.joinPath(documentUri, '..');
  const { frontmatter, body } = extractFrontmatter(markdown);

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading): string {
        const text = this.parser.parseInline(tokens);
        const prefix = '#'.repeat(depth);
        return `<h${depth}><span class="heading-prefix">${prefix}</span> ${text}</h${depth}>\n`;
      },

      code({ text, lang }: Tokens.Code): string {
        if (lang === 'mermaid') {
          const encoded = Buffer.from(text).toString('base64');
          return `<div class="mermaid-source" data-mermaid="${encoded}"></div>\n`;
        }
        const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        return `<pre><code${langClass}>${escapeHtml(text)}</code></pre>\n`;
      },

      checkbox({ checked }: Tokens.Checkbox): string {
        const icon = checked ? '\u2611' : '\u2610';
        const cls = checked ? 'task-checkbox task-checkbox-checked' : 'task-checkbox';
        return `<span class="${cls}">${icon}</span>`;
      },

      listitem(token: Tokens.ListItem): string {
        let body = this.parser.parse(token.tokens);
        if (token.task) {
          body = `<span class="task-list-item-content">${body}</span>`;
          return `<li class="task-list-item">${body}</li>\n`;
        }
        return `<li>${body}</li>\n`;
      },

      image({ href, title, text }: Tokens.Image): string {
        let resolvedHref = href;
        // Resolve relative paths only — skip absolute URLs (any scheme) and protocol-relative URLs (//)
        if (href && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
          // Separate path from query/fragment before resolving with joinPath
          const qIdx = href.indexOf('?');
          const hIdx = href.indexOf('#');
          const splitIdx = qIdx >= 0 && hIdx >= 0 ? Math.min(qIdx, hIdx) : qIdx >= 0 ? qIdx : hIdx;
          const pathPart = splitIdx >= 0 ? href.slice(0, splitIdx) : href;
          const suffix = splitIdx >= 0 ? href.slice(splitIdx) : '';
          const absUri = vscode.Uri.joinPath(docDir, pathPart);
          resolvedHref = webview.asWebviewUri(absUri).toString() + suffix;
        }
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const altText = text ? escapeHtml(text) : '';
        return `<img src="${escapeHtml(resolvedHref)}" alt="${altText}"${titleAttr} />\n`;
      },
    },
  });

  const frontmatterHtml = frontmatter ? renderFrontmatterHtml(frontmatter) : '';
  return frontmatterHtml + (marked.parse(body, { async: false }) as string);
}
