import * as vscode from 'vscode';
import { PreviewManager } from './previewManager';

let previewManager: PreviewManager;

export function activate(context: vscode.ExtensionContext): void {
  previewManager = new PreviewManager(context.extensionUri);

  // Track documents that already had auto-preview opened
  const autoOpened = new Set<string>();

  function autoOpenPreview(editor: vscode.TextEditor | undefined): void {
    if (!editor || editor.document.languageId !== 'markdown') return;

    const key = editor.document.uri.toString();
    if (autoOpened.has(key)) return;

    const autoPreview = vscode.workspace
      .getConfiguration('mdMultiTabPreview')
      .get<boolean>('autoPreview', true);

    if (autoPreview) {
      autoOpened.add(key);
      previewManager.openPreview(editor.document, editor.viewColumn);
    }
  }

  // Show Preview button (from editor title bar)
  context.subscriptions.push(
    vscode.commands.registerCommand('mdMultiTabPreview.showPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        previewManager.showPreview(editor.document);
      }
    })
  );

  // Show Editor button (from preview title bar)
  context.subscriptions.push(
    vscode.commands.registerCommand('mdMultiTabPreview.showEditor', () => {
      previewManager.showEditorForActivePreview();
    })
  );

  // Toggle command for keyboard shortcut (works from both contexts)
  context.subscriptions.push(
    vscode.commands.registerCommand('mdMultiTabPreview.togglePreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        previewManager.togglePreview(editor.document);
      } else {
        previewManager.showEditorForActivePreview();
      }
    })
  );

  // F-01: Auto preview on open
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      autoOpenPreview(editor);
    })
  );

  // Handle the editor that is already active when the extension activates
  autoOpenPreview(vscode.window.activeTextEditor);

  // F-02: Close preview when editor is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === 'markdown') {
        autoOpened.delete(document.uri.toString());
        previewManager.closePreview(document.uri);
      }
    })
  );

  context.subscriptions.push({
    dispose: () => previewManager.dispose(),
  });
}

export function deactivate(): void {
  previewManager?.dispose();
}
