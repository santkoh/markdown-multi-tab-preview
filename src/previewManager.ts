import * as vscode from 'vscode';
import { PreviewPanel } from './previewPanel';
import { extractHeadings } from './markdownRenderer';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function findHeadingLine(markdown: string, fragment: string): number | null {
  const target = slugify(fragment);
  if (!target) return null;
  for (const h of extractHeadings(markdown)) {
    if (slugify(h.text) === target) return h.line;
  }
  return null;
}

function isMarkdownUri(uri: vscode.Uri): boolean {
  return /\.(?:md|markdown)$/i.test(uri.fsPath);
}

export class PreviewManager {
  private panels = new Map<string, PreviewPanel>();
  private readonly extensionUri: vscode.Uri;
  private readonly workspaceState: vscode.Memento;
  private lastActivePreviewUri: string | undefined;

  constructor(extensionUri: vscode.Uri, workspaceState: vscode.Memento) {
    this.extensionUri = extensionUri;
    this.workspaceState = workspaceState;
  }

  public openPreview(document: vscode.TextDocument, viewColumn?: vscode.ViewColumn): void {
    const key = document.uri.toString();
    const existing = this.panels.get(key);
    if (existing) {
      existing.reveal(viewColumn);
      this.lastActivePreviewUri = key;
      return;
    }

    const column = viewColumn
      || vscode.window.activeTextEditor?.viewColumn
      || vscode.ViewColumn.Active;

    const panel = new PreviewPanel(
      document,
      this.extensionUri,
      column,
      this.workspaceState,
      (sourceUri, href) => { void this.handleLinkClick(sourceUri, href); },
    );
    this.panels.set(key, panel);
    this.lastActivePreviewUri = key;

    panel.onDispose((uri) => {
      this.panels.delete(uri.toString());
      if (this.lastActivePreviewUri === uri.toString()) {
        this.lastActivePreviewUri = undefined;
      }
    });
  }

  public scrollPanelToLine(uri: vscode.Uri, line: number): void {
    this.panels.get(uri.toString())?.requestScroll(line);
  }

  private async handleLinkClick(sourceUri: vscode.Uri, href: string): Promise<void> {
    if (/^(?:[a-z][a-z0-9+.\-]*:|\/\/)/i.test(href)) {
      await vscode.env.openExternal(vscode.Uri.parse(href));
      return;
    }

    const hashIdx = href.indexOf('#');
    const pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    const fragment = hashIdx >= 0 ? decodeURIComponent(href.slice(hashIdx + 1)) : '';
    if (!pathPart) return;

    const docDir = vscode.Uri.joinPath(sourceUri, '..');
    const targetUri = vscode.Uri.joinPath(docDir, pathPart);

    try {
      await vscode.workspace.fs.stat(targetUri);
    } catch {
      void vscode.window.showWarningMessage(
        `Cannot open link: file not found — ${pathPart}`
      );
      return;
    }

    try {
      const editor = await vscode.window.showTextDocument(targetUri, { preview: false });

      let targetLine: number | null = null;
      if (fragment) {
        targetLine = findHeadingLine(editor.document.getText(), fragment);
        if (targetLine !== null) {
          editor.revealRange(
            new vscode.Range(targetLine, 0, targetLine, 0),
            vscode.TextEditorRevealType.AtTop,
          );
        }
      }

      // Explicitly open preview for Markdown targets — bypasses the autoOpened
      // guard so link navigation always surfaces the preview.
      if (isMarkdownUri(targetUri)) {
        this.openPreview(editor.document);
        if (targetLine !== null) {
          this.scrollPanelToLine(targetUri, targetLine);
        }
      }
    } catch (err) {
      console.warn('Failed to open linked file:', err);
    }
  }

  public showPreview(document: vscode.TextDocument): void {
    this.openPreview(document);
  }

  public showEditorForActivePreview(): void {
    // Find the currently active preview panel
    let targetUri: string | undefined;
    for (const [uri, panel] of this.panels) {
      if (panel.active) {
        targetUri = uri;
        break;
      }
    }
    targetUri = targetUri || this.lastActivePreviewUri;

    if (targetUri) {
      const uri = vscode.Uri.parse(targetUri);
      void vscode.window.showTextDocument(uri, { preview: false }).then(undefined, (err) => {
        console.warn('Failed to open editor:', err);
      });
    }
  }

  public togglePreview(document: vscode.TextDocument): void {
    const key = document.uri.toString();
    const existing = this.panels.get(key);
    if (existing) {
      existing.reveal();
    } else {
      this.openPreview(document);
    }
  }

  public closePreview(uri: vscode.Uri): void {
    const key = uri.toString();
    const existing = this.panels.get(key);
    if (existing) {
      existing.dispose();
      this.panels.delete(key);
    }
  }

  public hasActivePreview(): boolean {
    for (const panel of this.panels.values()) {
      if (panel.active) return true;
    }
    return false;
  }

  public hasPreview(uri: vscode.Uri): boolean {
    return this.panels.has(uri.toString());
  }

  public dispose(): void {
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();
  }
}
