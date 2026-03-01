import * as vscode from 'vscode';
import * as path from 'path';
import { renderMarkdown } from './markdownRenderer';
import { getNonce } from './utils';

export class PreviewPanel {
  private panel: vscode.WebviewPanel;
  private document: vscode.TextDocument;
  private disposables: vscode.Disposable[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly extensionUri: vscode.Uri;
  private readonly onDisposeEmitter = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDispose = this.onDisposeEmitter.event;
  private isScrollingFromPreview = false;

  public get documentUri(): vscode.Uri {
    return this.document.uri;
  }

  public get active(): boolean {
    return this.panel.active;
  }

  constructor(
    document: vscode.TextDocument,
    extensionUri: vscode.Uri,
    viewColumn: vscode.ViewColumn,
  ) {
    this.document = document;
    this.extensionUri = extensionUri;

    const fileName = path.basename(document.uri.fsPath);
    const mediaUri = vscode.Uri.joinPath(extensionUri, 'media');
    const docDirUri = vscode.Uri.joinPath(document.uri, '..');

    this.panel = vscode.window.createWebviewPanel(
      'mdMultiTabPreview',
      `Preview: ${fileName}`,
      viewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [mediaUri, docDirUri],
      }
    );

    this.panel.iconPath = new vscode.ThemeIcon('open-preview');

    this.panel.onDidDispose(() => {
      this.onDisposeEmitter.fire(this.document.uri);
      this.dispose();
    }, null, this.disposables);

    // Listen for document changes (F-05: real-time update with 300ms debounce)
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === this.document.uri.toString()) {
        this.scheduleUpdate();
      }
    }, null, this.disposables);

    // Listen for scroll changes (F-06: Editor → Preview scroll sync)
    vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
      if (this.isScrollingFromPreview) return;
      if (e.textEditor.document.uri.toString() === this.document.uri.toString()) {
        const firstVisibleLine = e.visibleRanges[0]?.start.line ?? 0;
        const totalLines = e.textEditor.document.lineCount;
        this.panel.webview.postMessage({
          type: 'scroll',
          line: firstVisibleLine,
          totalLines,
        });
      }
    }, null, this.disposables);

    // Preview → Editor scroll sync
    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'scrollEditor') {
        this.scrollEditorToRatio(message.ratio);
      }
    }, null, this.disposables);

    this.setHtml();
    this.update();
  }

  public reveal(viewColumn?: vscode.ViewColumn): void {
    this.panel.reveal(viewColumn);
  }

  public dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.onDisposeEmitter.dispose();
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  private scrollEditorToRatio(ratio: number): void {
    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document.uri.toString() === this.document.uri.toString()
    );
    if (!editor) return;

    this.isScrollingFromPreview = true;
    const targetLine = Math.floor(ratio * this.document.lineCount);
    const range = new vscode.Range(targetLine, 0, targetLine, 0);
    editor.revealRange(range, vscode.TextEditorRevealType.AtTop);

    setTimeout(() => { this.isScrollingFromPreview = false; }, 200);
  }

  private scheduleUpdate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.update();
    }, 300);
  }

  private update(): void {
    const html = renderMarkdown(
      this.document.getText(),
      this.panel.webview,
      this.document.uri
    );
    this.panel.webview.postMessage({
      type: 'update',
      html,
    });
  }

  private setHtml(): void {
    const webview = this.panel.webview;
    const nonce = getNonce();

    const mediaUri = vscode.Uri.joinPath(this.extensionUri, 'media');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'preview.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'preview.js'));
    const csp = webview.cspSource;

    webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${csp} https: data:; script-src 'nonce-${nonce}'; style-src ${csp} 'unsafe-inline'; font-src ${csp};">
  <link rel="stylesheet" href="${cssUri}">
  <title>Preview</title>
</head>
<body>
  <div id="content"></div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}
