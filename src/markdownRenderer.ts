import { Marked, Tokens } from 'marked';
import * as vscode from 'vscode';
import { escapeHtml } from './utils';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function extractFrontmatter(markdown: string): { frontmatter: string | null; body: string; bodyStartLine: number } {
  const match = markdown.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: markdown, bodyStartLine: 0 };
  const frontmatterLines = (match[0].match(/\n/g) ?? []).length;
  return {
    frontmatter: match[1],
    body: markdown.slice(match[0].length),
    bodyStartLine: frontmatterLines,
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
  const { frontmatter, body, bodyStartLine } = extractFrontmatter(markdown);

  const tokenLineMap = new WeakMap<object, number>();

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading(token: Tokens.Heading): string {
        const line = tokenLineMap.get(token) ?? '';
        const text = this.parser.parseInline(token.tokens);
        const prefix = '#'.repeat(token.depth);
        return `<h${token.depth} data-line="${line}"><span class="heading-prefix">${prefix}</span> ${text}</h${token.depth}>\n`;
      },

      code(token: Tokens.Code): string {
        const line = tokenLineMap.get(token) ?? '';
        if (token.lang === 'mermaid') {
          const encoded = Buffer.from(token.text).toString('base64');
          return `<div class="mermaid-source" data-line="${line}" data-mermaid="${encoded}"></div>\n`;
        }
        const langClass = token.lang ? ` class="language-${escapeHtml(token.lang)}"` : '';
        return `<pre data-line="${line}"><code${langClass}>${escapeHtml(token.text)}</code></pre>\n`;
      },

      paragraph(token: Tokens.Paragraph): string {
        const line = tokenLineMap.get(token) ?? '';
        return `<p data-line="${line}">${this.parser.parseInline(token.tokens)}</p>\n`;
      },

      list(token: Tokens.List): string {
        const line = tokenLineMap.get(token) ?? '';
        const tag = token.ordered ? 'ol' : 'ul';
        const startAttr = token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';
        let body = '';
        for (const item of token.items) {
          body += this.listitem(item);
        }
        return `<${tag}${startAttr} data-line="${line}">${body}</${tag}>\n`;
      },

      table(token: Tokens.Table): string {
        const line = tokenLineMap.get(token) ?? '';
        let header = '<tr>';
        for (let i = 0; i < token.header.length; i++) {
          const cell = token.header[i];
          const align = token.align[i];
          const alignAttr = align ? ` align="${align}"` : '';
          header += `<th${alignAttr}>${this.parser.parseInline(cell.tokens)}</th>`;
        }
        header += '</tr>';

        let body = '';
        for (const row of token.rows) {
          body += '<tr>';
          for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            const align = token.align[i];
            const alignAttr = align ? ` align="${align}"` : '';
            body += `<td${alignAttr}>${this.parser.parseInline(cell.tokens)}</td>`;
          }
          body += '</tr>';
        }

        return `<table data-line="${line}"><thead>${header}</thead><tbody>${body}</tbody></table>\n`;
      },

      blockquote(token: Tokens.Blockquote): string {
        const line = tokenLineMap.get(token) ?? '';
        const body = this.parser.parse(token.tokens);
        return `<blockquote data-line="${line}">${body}</blockquote>\n`;
      },

      hr(token: Tokens.Hr): string {
        const line = tokenLineMap.get(token) ?? '';
        return `<hr data-line="${line}" />\n`;
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

  // Two-phase rendering: lexer → build line map → parser
  const tokens = marked.lexer(body);

  let cumLine = bodyStartLine;
  for (const token of tokens) {
    tokenLineMap.set(token, cumLine);
    const newlines = (token.raw.match(/\n/g) ?? []).length;
    cumLine += newlines;
  }

  const bodyHtml = marked.parser(tokens) as string;

  const frontmatterHtml = frontmatter ? renderFrontmatterHtml(frontmatter) : '';
  return frontmatterHtml + bodyHtml;
}
