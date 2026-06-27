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
  /**
   * 0-based new-file line numbers for changed ('+') lines, further classified
   * as a pure 'added' line (its change block has no deletion) or a 'modified'
   * line (a deletion and an addition coexist in the same change block).
   * Context lines are omitted. This field is additive: `newLines` keeps its
   * original 'added'/'context' values for DiffPreviewPanel backward compat.
   */
  newLineKind: Map<number, 'added' | 'modified'>;
}

const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function parseUnifiedDiff(diff: string): DiffResult {
  const oldLines = new Map<number, 'removed' | 'context'>();
  const newLines = new Map<number, 'added' | 'context'>();
  const newLineKind = new Map<number, 'added' | 'modified'>();

  if (!diff || diff.trim() === '') {
    return { oldLines, newLines, newLineKind };
  }

  const lines = diff.split('\n');
  // oldLine / newLine track current 1-based position, converted to 0-based on store.
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;

  // A "change block" is a maximal run of '-'/'+' lines bounded by context lines
  // or hunk boundaries. If the block contains any deletion, its additions are
  // 'modified' (a line was replaced); otherwise they are 'added' (pure insert).
  // This mirrors how VS Code's dirty-diff classifies gutter decorations.
  let pendingPlus: number[] = [];
  let blockHasMinus = false;
  const flushBlock = (): void => {
    if (pendingPlus.length > 0) {
      const kind = blockHasMinus ? 'modified' : 'added';
      for (const ln of pendingPlus) newLineKind.set(ln, kind);
    }
    pendingPlus = [];
    blockHasMinus = false;
  };

  for (const raw of lines) {
    const hunkMatch = raw.match(HUNK_HEADER_RE);
    if (hunkMatch) {
      // A change block never spans hunks; close any block left open.
      flushBlock();
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
      blockHasMinus = true;
      oldLine++;
    } else if (raw.startsWith('+')) {
      // Added line: exists in new file, not in old.
      newLines.set(newLine - 1, 'added'); // convert to 0-based
      pendingPlus.push(newLine - 1);
      newLine++;
    } else if (raw.startsWith(' ')) {
      // Context line: exists in both — ends the current change block.
      flushBlock();
      oldLines.set(oldLine - 1, 'context');
      newLines.set(newLine - 1, 'context');
      oldLine++;
      newLine++;
    }
    // Lines starting with '\' (e.g. "\ No newline at end of file") — skip
  }
  flushBlock(); // close the final block at EOF

  return { oldLines, newLines, newLineKind };
}
