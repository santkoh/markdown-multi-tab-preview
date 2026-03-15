---
name: release
description: >
  Bump version, create a PR, merge, tag, and monitor the VS Code Marketplace
  and Open VSX Registry publish workflow. Use this skill when the user says
  "リリース", "publish", "パブリッシュ", "Marketplace に出して",
  "バージョン上げて release", or any variation of releasing/publishing a new version.
user-invokable: true
argument-hint: "[patch|minor|major]"
---

# Release

Bump the version, create a PR through the standard flow, merge after CI,
tag the release, and monitor the publish workflow that deploys to the
VS Code Marketplace.

This project uses tag-triggered publishing — when a `v*` tag is pushed,
the CI `publish` job automatically runs `vsce publish`.

## Step-by-step

### 1. Pre-flight checks

Verify everything is ready before starting:

```bash
git checkout main && git pull
git status                     # must be clean
```

Read the current version from `package.json`.

### 2. Determine the new version

Apply semver based on the `level` argument (default: `patch`):

| Level | Example | When to use |
|-------|---------|-------------|
| `patch` | 0.4.2 → 0.4.3 | Bug fixes, CI changes, dependency updates |
| `minor` | 0.4.2 → 0.5.0 | New features, notable improvements |
| `major` | 0.4.2 → 1.0.0 | Breaking changes |

### 3. Confirm with user

Show the planned version change and ask for confirmation before proceeding.
This prevents accidental version bumps.

### 4. Update files

- **`package.json`**: Update the `version` field
- **`CHANGELOG.md`**: Add the new version entry (see below)
- **`SECURITY.md`**: If the major or minor version changes, update the
  Supported Versions table to reflect the new version range

#### CHANGELOG.md update procedure

The changelog follows [Keep a Changelog](https://keepachangelog.com/) format.
Read `CHANGELOG.md` to understand the existing style, then:

1. **Collect changes** — run `git log --oneline v<prev>..HEAD` to list
   commits since the last release tag.
2. **Write the entry** — add a new `## [<version>] - <YYYY-MM-DD>` section
   immediately after the file header (before the previous version entry).
   Group items under these categories as applicable:
   - `### Added` — new user-facing features
   - `### Fixed` — bug fixes users would notice
   - `### Changed` — behaviour changes, UX improvements
   - `### Security` — vulnerability fixes that affect users
3. **Filter for users** — only include items that affect the extension's
   behaviour for end users. CI/infrastructure-only changes (GitHub Actions,
   Scorecard, Dependabot, linting config) should be either omitted or
   summarised in a single line if the version has nothing else.
4. **Update compare links** — at the bottom of the file, add a link for the
   new version and update the previous version's range:
   ```
   [<new>]: https://github.com/santkoh/markdown-multi-tab-preview/compare/v<prev>...v<new>
   ```

### 5. Create PR, wait for CI, merge

Follow the same flow as the `/pr` skill:

1. Create branch `chore/release-v<version>`
2. Commit: `chore: bump version to <version>`
3. Push and create PR with `--reviewer santkoh`
4. Wait for CI checks to pass
5. Merge: `gh pr merge --squash --delete-branch`

### 6. Tag and push

After merge, pull main and create the tag:

```bash
git checkout main && git pull
git tag v<version>
git push origin v<version>
```

The `v*` tag triggers the `publish` job in `ci.yml`, which publishes to
both VS Code Marketplace and Open VSX Registry.

### 7. Monitor publish

```bash
gh run list --branch v<version> --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch <run_id> --exit-status
```

Report the result. If publish fails with `Request timeout: /_apis/gallery`,
this is a VS Code Marketplace API issue (not our fault) — inform the user
and suggest retrying with `gh run rerun <run_id> --failed`.

## Important notes

- Direct pushes to `main` are blocked — always go through a PR even for version bumps.
- Tag format is always `v<semver>` (e.g., `v0.5.0`) — the CI publish job
  matches on `refs/tags/v*`.
