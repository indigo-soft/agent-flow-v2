# Release Flow Guide

This document describes how to create and publish releases for this project.

## Overview

Releases are managed via [`release-it`](https://github.com/release-it/release-it) with the
[`@release-it/conventional-changelog`](https://github.com/release-it/conventional-changelog) plugin.
The flow is wrapped in a custom Bash script (`scripts/release/release.sh`) that runs a series of
pre-release checks before delegating to `release-it`.
**What happens on each release:**

1. Pre-release checks run (see below).
2. `release-it` bumps the version in `package.json`.
3. `CHANGELOG.md` is updated automatically from commit history (Conventional Commits).
4. A release commit is created: `chore(release): vX.Y.Z`.
5. A Git tag `vX.Y.Z` is created and pushed.
6. A GitHub Release is published with auto-generated notes.

---

## Prerequisites

| Tool   | Minimum version | Install                          |
|--------|-----------------|----------------------------------|
| `node` | ≥ 24.0.0        | [nodejs.org](https://nodejs.org) |
| `pnpm` | ≥ 10.0.0        | `npm install -g pnpm`            |
| `git`  | any recent      | system package manager           |

A `GITHUB_TOKEN` with **repo** scope must be available in your environment (or in `.env`) for
GitHub Releases to be published.

```dotenv
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

---

## Release Commands

> **⚠️ Always use `npm run`, not `pnpm run`**, to avoid `ELIFECYCLE` noise on non-zero exit codes.

### Dry Run (preview only — no changes)

```bash
npm run release:dry
```

Runs all pre-release checks and shows what `release-it` **would** do, without making any
changes to the repository.

### Patch Release (`X.Y.Z+1`)

```bash
npm run release:patch
```

Use for bug-fixes and small improvements that do not change the public API.

### Minor Release (`X.Y+1.0`)

```bash
npm run release:minor
```

Use for backward-compatible new features.

### Major Release (`X+1.0.0`)

```bash
npm run release:major
```

Use for breaking changes.

### Interactive Release (let `release-it` decide)

```bash
npm run release
```

`release-it` will prompt you to choose the version bump interactively.
---

## Calling the Script Directly

```bash
# dry run
bash scripts/release/release.sh --dry
# specific type
bash scripts/release/release.sh --type=patch
bash scripts/release/release.sh --type=minor
bash scripts/release/release.sh --type=major
# combined
bash scripts/release/release.sh --type=patch --dry
```

---

## Pre-Release Checks

The script (`scripts/release/checks.sh`) automatically validates the following before any
release is started:

| # | Check                       | What it verifies                                  |
|---|-----------------------------|---------------------------------------------------|
| 1 | **Dependencies**            | `git`, `node`, `pnpm` are installed               |
| 2 | **Clean working directory** | No unstaged or staged changes                     |
| 3 | **Correct branch**          | You are on the default branch (`main` / `master`) |
| 4 | **All commits pushed**      | No local commits ahead of `origin`                |
| 5 | **Lockfile in sync**        | `pnpm-lock.yaml` matches `package.json`           |
| 6 | **CHANGELOG exists**        | `CHANGELOG.md` is present and non-empty           |

If any check fails, the script exits with a descriptive error message and **no changes** are made.
---

## CHANGELOG

`CHANGELOG.md` is generated and updated **automatically** by
`@release-it/conventional-changelog` using the **conventionalcommits** preset.
The update is driven by commit messages following the
[Conventional Commits](https://www.conventionalcommits.org/) specification.
Relevant types that appear in the changelog:

| Commit type | Section in CHANGELOG       |
|-------------|----------------------------|
| `feat`      | ✨ Features                 |
| `fix`       | 🐛 Bug Fixes               |
| `perf`      | ⚡ Performance Improvements |
| `revert`    | ⏪ Reverts                  |
| `docs`      | 📚 Documentation           |
| `chore`     | 🔧 Miscellaneous Chores    |

> Do **not** edit `CHANGELOG.md` manually — it will be overwritten on the next release.
---

## Configuration Files

| File                         | Purpose                                                             |
|------------------------------|---------------------------------------------------------------------|
| `.release-it.json`           | `release-it` configuration (versioning, git, GitHub Release, hooks) |
| `scripts/release/release.sh` | Main release entry-point script                                     |
| `scripts/release/checks.sh`  | Pre-release check functions                                         |
| `scripts/libs/colors.sh`     | Colored console output helpers                                      |
| `scripts/libs/env.sh`        | `.env` file loader                                                  |

---

## Typical Release Workflow

```text
1. Merge all feature branches → main (via Pull Request)
2. Ensure CHANGELOG.md is not empty and all commits are pushed
3. Run:  npm run release:dry      ← verify everything looks correct
4. Run:  npm run release:patch    ← (or :minor / :major)
5. Verify the new tag and GitHub Release on GitHub
```

---

## Troubleshooting

| Symptom                                             | Cause                              | Fix                                 |
|-----------------------------------------------------|------------------------------------|-------------------------------------|
| `Permission denied` on `.sh`                        | Scripts not executable             | `npm run prepare` (runs `chmod +x`) |
| `CHANGELOG.md is empty`                             | No content in file                 | Add at least a placeholder line     |
| `pnpm-lock.yaml is out of sync`                     | `package.json` changed w/o install | `pnpm install`                      |
| `There are local commits that have not been pushed` | Forgot to push                     | `git push`                          |
| `Could not determine the default branch`            | `origin/HEAD` not set              | `git remote set-head origin --auto` |
| `GITHUB_TOKEN` not set                              | Missing env var                    | Add to `.env` or export in shell    |
