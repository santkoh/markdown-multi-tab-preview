import * as vscode from 'vscode';

/** Minimal interface for a Git repository (from VS Code built-in git extension). */
export interface Repository {
  readonly rootUri: vscode.Uri;
  show(ref: string, path: string): Promise<string>;
  diffWithHEAD(path: string): Promise<string>;
}

/** Minimal interface for the VS Code Git extension API v1. */
export interface GitApi {
  getRepository(uri: vscode.Uri): Repository | null;
}

/**
 * Activate the built-in VS Code git extension and return the API v1.
 * Returns null if the git extension is unavailable.
 */
export async function getGitApi(): Promise<GitApi | null> {
  const ext = vscode.extensions.getExtension('vscode.git');
  if (!ext) {
    return null;
  }
  // activate() is idempotent and returns the extension's exports.
  const gitExt = await ext.activate();
  if (!gitExt || typeof gitExt.getAPI !== 'function') {
    return null;
  }
  return gitExt.getAPI(1) as GitApi;
}
