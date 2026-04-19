/**
 * Parses a unified diff string and maps 0-based line numbers to their diff status.
 *
 * Note: data-line attributes in the rendered HTML are 0-based (markdownRenderer.ts).
 *       unified diff hunk headers are 1-based, so we subtract 1 when storing.
 */

export interface DiffResult {
  /** 0-based line numbers in the old file that are 'removed' or 'context'. */
  oldLines: Map<number, 'removed' | 'context'>;
  /** 0-based line numbers in the new file that are 'added' or 'context'. */
  newLines: Map<number, 'added' | 'context'>;
}

const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function parseUnifiedDiff(diff: string): DiffResult {
  const oldLines = new Map<number, 'removed' | 'context'>();
  const newLines = new Map<number, 'added' | 'context'>();

  if (!diff || diff.trim() === '') {
    return { oldLines, newLines };
  }

  const lines = diff.split('\n');
  // oldLine / newLine track current 1-based position, converted to 0-based on store.
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;

  for (const raw of lines) {
    const hunkMatch = raw.match(HUNK_HEADER_RE);
    if (hunkMatch) {
      // hunk header: @@ -oldStart[,oldCount] +newStart[,newCount] @@
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[3], 10);
      inHunk = true;
      continue;
    }

    if (!inHunk) continue;

    // Note: `---` / `+++` file-header lines appear only before any hunk header,
    // so they are already filtered by the !inHunk guard above. Matching them
    // inside a hunk is unsafe because content lines like `---` (Markdown <hr>
    // or frontmatter fences) appear as `----` in unified diff form.

    if (raw.startsWith('-')) {
      // Removed line: exists in old file, not in new.
      oldLines.set(oldLine - 1, 'removed'); // convert to 0-based
      oldLine++;
    } else if (raw.startsWith('+')) {
      // Added line: exists in new file, not in old.
      newLines.set(newLine - 1, 'added'); // convert to 0-based
      newLine++;
    } else if (raw.startsWith(' ')) {
      // Context line: exists in both.
      oldLines.set(oldLine - 1, 'context');
      newLines.set(newLine - 1, 'context');
      oldLine++;
      newLine++;
    }
    // Lines starting with '\' (e.g. "\ No newline at end of file") — skip
  }

  return { oldLines, newLines };
}
