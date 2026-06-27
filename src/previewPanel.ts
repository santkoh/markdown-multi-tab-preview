import * as vscode from 'vscode';
import * as path from 'path';
import { renderMarkdown } from './markdownRenderer';
import { getNonce } from './utils';
import { getGitApi, Repository } from './gitApi';
import { parseUnifiedDiff } from './diffParser';

export type LinkClickHandler = (sourceUri: vscode.Uri, href: string) => void;

export class PreviewPanel {
  private panel: vscode.WebviewPanel;
  private document: vscode.TextDocument;
  private disposables: vscode.Disposable[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly extensionUri: vscode.Uri;
  private readonly workspaceState: vscode.Memento;
  private readonly onLinkClickHandler: LinkClickHandler | undefined;
  private readonly onDisposeEmitter = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDispose = this.onDisposeEmitter.event;
  private isScrollingFromPreview = false;
  private scrollFromPreviewTimer: ReturnType<typeof setTimeout> | undefined;
  private isDisposed = false;
  private isDirty = false;
  private isWebviewReady = false;
  private pendingScrollLine = 0;
  // undefined = not yet resolved; null = no git repo for this document.
  private gitRepo: Repository | null | undefined;

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
    workspaceState: vscode.Memento,
    onLinkClick?: LinkClickHandler,
  ) {
    this.document = document;
    this.extensionUri = extensionUri;
    this.workspaceState = workspaceState;
    this.onLinkClickHandler = onLinkClick;

    // Capture the editor's current scroll BEFORE creating the webview panel,
    // since same-column creation hides the editor from visibleTextEditors.
    const sourceEditor = vscode.window.visibleTextEditors.find(
      (e) => e.document.uri.toString() === document.uri.toString()
    );
    const initialLine = sourceEditor?.visibleRanges[0]?.start.line ?? 0;
    if (initialLine > 0) {
      this.pendingScrollLine = initialLine;
    }

    const fileName = path.basename(document.uri.fsPath);
    const mediaUri = vscode.Uri.joinPath(extensionUri, 'media');
    const docDirUri = vscode.Uri.joinPath(document.uri, '..');
    const localResourceRoots = [mediaUri, docDirUri];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder) {
      localResourceRoots.push(workspaceFolder.uri);
    }

    const retainContext = vscode.workspace
      .getConfiguration('mdMultiTabPreview')
      .get<boolean>('retainContextWhenHidden', true);

    this.panel = vscode.window.createWebviewPanel(
      'mdMultiTabPreview',
      `Preview: ${fileName}`,
      viewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: retainContext,
        localResourceRoots,
      }
    );

    this.panel.iconPath = new vscode.ThemeIcon('open-preview');

    this.panel.onDidDispose(() => {
      this.cleanUp();
    });

    this.panel.onDidChangeViewState(() => {
      if (this.panel.visible && this.isDirty) {
        void this.update();
      }
    }, null, this.disposables);

    // Listen for document changes (F-05: real-time update with 300ms debounce)
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (this.isDisposed) return;
      if (e.document.uri.toString() === this.document.uri.toString()) {
        this.scheduleUpdate();
      }
    }, null, this.disposables);

    // Re-render when colorDecorator, TOC, or theme settings change
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (this.isDisposed) return;
      if (
        e.affectsConfiguration('mdMultiTabPreview.colorDecorator') ||
        e.affectsConfiguration('mdMultiTabPreview.toc.enabled') ||
        e.affectsConfiguration('mdMultiTabPreview.toc.maxDepth') ||
        e.affectsConfiguration('mdMultiTabPreview.theme.preset') ||
        e.affectsConfiguration('mdMultiTabPreview.gitDecorations')
      ) {
        this.scheduleUpdate();
      }
    }, null, this.disposables);

    // Listen for scroll changes (F-06: Editor → Preview scroll sync)
    vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
      if (this.isDisposed || this.isScrollingFromPreview || !this.panel.visible) return;
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

    // Preview → Editor message handling
    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'ready') {
        this.isWebviewReady = true;
        void this.update();
        if (this.pendingScrollLine > 0) {
          this.postScroll(this.pendingScrollLine);
          this.pendingScrollLine = 0;
        }
      } else if (message.type === 'scrollEditor' && typeof message.line === 'number') {
        this.scrollEditorToLine(message.line);
      } else if (message.type === 'tocToggle' && typeof message.visible === 'boolean') {
        void this.workspaceState.update('tocVisible', message.visible);
      } else if (message.type === 'linkClick' && typeof message.href === 'string') {
        this.onLinkClickHandler?.(this.document.uri, message.href);
      }
    }, null, this.disposables);

    this.setHtml();
  }

  public requestScroll(line: number): void {
    if (!Number.isFinite(line) || line <= 0) return;
    if (this.isWebviewReady) {
      this.postScroll(line);
    } else {
      this.pendingScrollLine = line;
    }
  }

  private postScroll(line: number): void {
    this.panel.webview.postMessage({
      type: 'scroll',
      line,
      totalLines: this.document.lineCount,
    });
  }

  public reveal(viewColumn?: vscode.ViewColumn): void {
    this.panel.reveal(viewColumn);
  }

  public dispose(): void {
    this.cleanUp();
    this.panel.dispose();
  }

  private cleanUp(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.scrollFromPreviewTimer) clearTimeout(this.scrollFromPreviewTimer);
    this.onDisposeEmitter.fire(this.document.uri);
    this.onDisposeEmitter.dispose();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }

  private scrollEditorToLine(line: number): void {
    if (!Number.isFinite(line) || line < 0) return;

    const uriStr = this.document.uri.toString();
    const active = vscode.window.activeTextEditor;
    const editor = active?.document.uri.toString() === uriStr
      ? active
      : vscode.window.visibleTextEditors.find(
          (e) => e.document.uri.toString() === uriStr
        );
    if (!editor) return;

    this.isScrollingFromPreview = true;
    if (this.scrollFromPreviewTimer) clearTimeout(this.scrollFromPreviewTimer);
    const targetLine = Math.min(Math.floor(line), this.document.lineCount - 1);
    const range = new vscode.Range(targetLine, 0, targetLine, 0);
    editor.revealRange(range, vscode.TextEditorRevealType.AtTop);

    this.scrollFromPreviewTimer = setTimeout(() => { this.isScrollingFromPreview = false; }, 200);
  }

  private scheduleUpdate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      if (!this.panel.visible) {
        this.isDirty = true;
        return;
      }
      void this.update();
    }, 300);
  }

  private async update(): Promise<void> {
    if (this.isDisposed) return;
    this.isDirty = false;
    try {
      const { html, headings } = renderMarkdown(
        this.document.getText(),
        this.panel.webview,
        this.document.uri
      );
      const config = vscode.workspace.getConfiguration('mdMultiTabPreview');
      const gitDecorations = config.get<boolean>('gitDecorations', true);
      const newLineKind = gitDecorations ? await this.computeGitDecorations() : [];
      // The git lookup is async — bail out if the panel was disposed meanwhile.
      if (this.isDisposed) return;
      this.panel.webview.postMessage({
        type: 'update',
        html,
        headings,
        colorDecorator: config.get<boolean>('colorDecorator', true),
        tocEnabled: config.get<boolean>('toc.enabled', true),
        tocMaxDepth: config.get<number>('toc.maxDepth', 3),
        tocVisible: this.workspaceState.get<boolean>('tocVisible', false),
        themePreset: config.get<string>('theme.preset', 'soft'),
        gitDecorations,
        newLineKind,
      });
    } catch (err) {
      console.error('Failed to update preview:', err);
    }
  }

  /**
   * Compute git decorations for the working tree vs HEAD as 0-based
   * [line, 'added' | 'modified'] entries. Returns an empty array when git is
   * unavailable, the file is untracked, or it sits outside the repo. Never throws.
   */
  private async computeGitDecorations(): Promise<[number, string][]> {
    try {
      const repo = await this.resolveRepo();
      if (!repo) return [];
      const relPath = path
        .relative(repo.rootUri.fsPath, this.document.uri.fsPath)
        .replace(/\\/g, '/');
      if (relPath === '' || relPath.startsWith('..')) return []; // outside repo root
      const diffStr = await repo.diffWithHEAD(relPath);
      const { newLineKind } = parseUnifiedDiff(diffStr);
      return Array.from(newLineKind.entries());
    } catch {
      return [];
    }
  }

  /** Resolve (and cache) the git repository owning this document, or null. */
  private async resolveRepo(): Promise<Repository | null> {
    if (this.gitRepo !== undefined) return this.gitRepo;
    try {
      const api = await getGitApi();
      this.gitRepo = api?.getRepository(this.document.uri) ?? null;
    } catch {
      this.gitRepo = null;
    }
    return this.gitRepo;
  }

  private setHtml(): void {
    const webview = this.panel.webview;
    const nonce = getNonce();

    const mediaUri = vscode.Uri.joinPath(this.extensionUri, 'media');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'preview.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'preview.js'));
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
  <link rel="stylesheet" href="${cssUri}">
  <title>Preview</title>
</head>
<body>
  <button id="toc-toggle" class="toc-toggle-btn" title="Show Outline"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v1.2H2V3zm0 3.4h9v1.2H2V6.4zm0 3.4h11v1.2H2V9.8zm0 3.4h7v1.2H2v-1.2z"/></svg></button>
  <div id="toc-sidebar" class="toc-sidebar">
    <div class="toc-header">
      <span class="toc-title">OUTLINE</span>
      <button class="toc-close-btn" title="Hide Outline"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.9 8l4.6 4.6-.7.7L4.5 8l5.3-5.3.7.7L5.9 8z"/></svg></button>
    </div>
    <nav id="toc-list" class="toc-list"></nav>
  </div>
  <div id="content"></div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}
