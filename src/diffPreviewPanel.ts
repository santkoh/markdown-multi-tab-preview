import * as vscode from 'vscode';
import * as nodePath from 'path';
import { renderMarkdown } from './markdownRenderer';
import { getNonce } from './utils';
import { GitApi, Repository } from './gitApi';
import { parseUnifiedDiff } from './diffParser';

export class DiffPreviewPanel {
  private readonly panel: vscode.WebviewPanel;
  private readonly document: vscode.TextDocument;
  private readonly extensionUri: vscode.Uri;
  private readonly gitApi: GitApi;
  private readonly repo: Repository;
  private isWebviewReady = false;
  private isDisposed = false;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    document: vscode.TextDocument,
    extensionUri: vscode.Uri,
    viewColumn: vscode.ViewColumn,
    gitApi: GitApi,
    repo: Repository,
  ) {
    this.document = document;
    this.extensionUri = extensionUri;
    this.gitApi = gitApi;
    this.repo = repo;

    const fileName = nodePath.basename(document.uri.fsPath);
    const mediaUri = vscode.Uri.joinPath(extensionUri, 'media');
    const docDirUri = vscode.Uri.joinPath(document.uri, '..');

    const localResourceRoots = [mediaUri, docDirUri];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder) {
      localResourceRoots.push(workspaceFolder.uri);
    }

    this.panel = vscode.window.createWebviewPanel(
      'mdMultiTabDiffPreview',
      `Diff: ${fileName}`,
      viewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots,
      }
    );

    this.panel.iconPath = new vscode.ThemeIcon('git-compare');

    this.panel.onDidDispose(() => {
      this.cleanUp();
    });

    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'ready') {
        this.isWebviewReady = true;
        void this.update();
      }
    }, null, this.disposables);

    this.setHtml();
  }

  public dispose(): void {
    this.cleanUp();
    this.panel.dispose();
  }

  private cleanUp(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
  }

  /**
   * Fetch HEAD content, working tree content, and the unified diff, then
   * post an 'update' message to the webview.
   */
  private async update(): Promise<void> {
    if (this.isDisposed) return;

    // Compute path relative to repo root (POSIX separators).
    const relPath = nodePath
      .relative(this.repo.rootUri.fsPath, this.document.uri.fsPath)
      .replace(/\\/g, '/');

    let headContent: string;
    try {
      headContent = await this.repo.show('HEAD', relPath);
    } catch {
      // File does not exist in HEAD (new file, or outside repo).
      headContent = '';
    }

    const workingContent = this.document.getText();

    let diffStr = '';
    try {
      diffStr = await this.repo.diffWithHEAD(relPath);
    } catch {
      diffStr = '';
    }

    const diffResult = parseUnifiedDiff(diffStr);

    const webview = this.panel.webview;
    const { html: baseHtml } = renderMarkdown(headContent, webview, this.document.uri);
    const { html: currentHtml } = renderMarkdown(workingContent, webview, this.document.uri);

    const hasChanges = diffResult.oldLines.size > 0 || diffResult.newLines.size > 0;

    void this.panel.webview.postMessage({
      type: 'update',
      baseHtml,
      currentHtml,
      oldLines: Array.from(diffResult.oldLines.entries()),
      newLines: Array.from(diffResult.newLines.entries()),
      hasChanges,
    });
  }

  private setHtml(): void {
    const webview = this.panel.webview;
    const nonce = getNonce();

    const mediaUri = vscode.Uri.joinPath(this.extensionUri, 'media');
    const previewCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'preview.css'));
    const diffCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'diff-preview.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'diff-preview.js'));
    const csp = webview.cspSource;
    const allowRemote = vscode.workspace
      .getConfiguration('mdMultiTabPreview')
      .get<boolean>('allowRemoteImages', true);
    const imgSrc = allowRemote ? `${csp} https: data:` : `${csp} data:`;

    webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${imgSrc}; script-src 'nonce-${nonce}'; style-src ${csp} 'unsafe-inline'; font-src ${csp};">
  <link rel="stylesheet" href="${previewCssUri}">
  <link rel="stylesheet" href="${diffCssUri}">
  <title>Diff Preview</title>
</head>
<body>
  <div class="diff-container">
    <div class="diff-pane" id="base-pane">
      <div class="diff-pane-header">HEAD</div>
      <div class="diff-pane-content" id="base-content"></div>
    </div>
    <div class="diff-pane" id="current-pane">
      <div class="diff-pane-header">Working Tree</div>
      <div class="diff-pane-content" id="current-content"></div>
    </div>
  </div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}
