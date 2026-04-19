import * as vscode from 'vscode';

/** Minimal interface for a Git repository (from VS Code built-in git extension). */
export interface Repository {
  readonly rootUri: vscode.Uri;
  show(ref: string, path: string): Promise<string>;
  diffWithHEAD(path: string): Promise<string>;
}

type GitApiState = 'uninitialized' | 'initialized';

/** Minimal interface for the VS Code Git extension API v1. */
export interface GitApi {
  getRepository(uri: vscode.Uri): Repository | null;
  readonly state: GitApiState;
  readonly onDidChangeState: vscode.Event<GitApiState>;
}

/**
 * Activate the built-in VS Code git extension and return the API v1.
 * Waits for the API's internal scan to finish so `getRepository()` returns a
 * valid repo on the first call (otherwise it can be null before scan completes).
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
  const api = gitExt.getAPI(1) as GitApi;
  if (api.state === 'initialized') return api;
  await new Promise<void>((resolve) => {
    const sub = api.onDidChangeState((state) => {
      if (state === 'initialized') {
        sub.dispose();
        resolve();
      }
    });
  });
  return api;
}
