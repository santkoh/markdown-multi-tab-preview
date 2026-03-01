import * as vscode from 'vscode';
import { PreviewPanel } from './previewPanel';

export class PreviewManager {
  private panels = new Map<string, PreviewPanel>();
  private readonly extensionUri: vscode.Uri;
  private lastActivePreviewUri: string | undefined;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
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

    const panel = new PreviewPanel(document, this.extensionUri, column);
    this.panels.set(key, panel);
    this.lastActivePreviewUri = key;

    panel.onDispose((uri) => {
      this.panels.delete(uri.toString());
      if (this.lastActivePreviewUri === uri.toString()) {
        this.lastActivePreviewUri = undefined;
      }
    });
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
