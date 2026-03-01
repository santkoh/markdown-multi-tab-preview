import { Marked, Tokens } from 'marked';
import * as vscode from 'vscode';
import * as path from 'path';
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
          return `<div class="mermaid-source" data-mermaid="${escapeHtml(text)}"></div>\n`;
        }
        const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        return `<pre><code${langClass}>${escapeHtml(text)}</code></pre>\n`;
      },

      image({ href, title, text }: Tokens.Image): string {
        let resolvedHref = href;
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('data:')) {
          const absUri = vscode.Uri.joinPath(docDir, href);
          resolvedHref = webview.asWebviewUri(absUri).toString();
        }
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const altText = text ? escapeHtml(text) : '';
        return `<img src="${escapeHtml(resolvedHref)}" alt="${altText}"${titleAttr} />\n`;
      },
    },
  });

  const frontmatterHtml = frontmatter ? renderFrontmatterHtml(frontmatter) : '';
  return frontmatterHtml + (marked.parse(body) as string);
}
