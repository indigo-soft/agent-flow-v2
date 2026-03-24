# Dependency Updates Guide

> **ADR:** [ADR-026: Automated Dependency Management](../adr/026-dependency-management.md)

This guide explains how dependency updates are automated in **agent-flow-v2**, which updates
are automatic, which require manual action, and how to trigger updates locally.

---

## Overview

Two tools split the responsibility:

| Tool | Scope | Schedule |
|---|---|---|
| **Renovate** | npm packages (`package.json`) | Every 3 days (nightly CI run) |
| **Dependabot** | GitHub Actions (`.github/workflows/`) | Weekly (every Monday) |

---

## How Renovate Works

Renovate runs nightly via GitHub Actions (`renovate.yml`). On each run it:

1. Checks `package.json` for outdated dependencies
2. Groups them by functionality (NestJS, ESLint, Jest, etc.)
3. Applies the `"every 3 days"` schedule filter — skips creation if updated recently
4. Opens PRs (grouped by functionality)
5. Auto-merges patch/minor PRs once CI passes and `minimumReleaseAge: 3 days` is reached

---

## Automatic vs Manual Updates

### ✅ Automatic (no action needed)

| Update type | What happens |
|---|---|
| **patch** (e.g. `1.2.3` → `1.2.4`) | PR opened → CI runs → auto-merged |
| **minor** (e.g. `1.2.0` → `1.3.0`) | PR opened → CI runs → auto-merged |
| **GitHub Actions** (via Dependabot) | PR opened → CI runs → auto-merged |

> Auto-merge requires **"Allow auto-merge"** to be enabled in GitHub repo settings:  
> **Settings → General → Pull Requests → Allow auto-merge** ✓

### 🔍 Manual Review Required

| Update type | Why | Label |
|---|---|---|
| **major** (e.g. `1.x` → `2.x`) | Breaking changes possible | `major-update`, `needs-review` |
| Any update that **breaks CI** | Tests or lint fail | PR stays open |
| `pnpm-lock.yaml` **conflicts** | Manual rebase needed | — |

---

## Package Groups

Renovate groups related packages into a single PR:

| Group | Packages |
|---|---|
| **NestJS Framework** | `@nestjs/*` |
| **TypeScript** | `typescript`, `@typescript-eslint/*` |
| **Testing (Jest)** | `jest`, `ts-jest` |
| **Linters & Formatters** | `eslint`, `prettier`, `eslint-*`, `@eslint/*` |
| **Frontend (Next.js)** | `next`, `@tanstack/*` |
| **Build & Dev Tools** | `lefthook`, `npm-run-all`, `@commitlint/*` |
| **Release Tools** | `release-it`, `@release-it/*` |
| **Database & Caching** | `prisma`, `keyv`, `cache-manager`, `prettier-plugin-prisma`, `@keyv/*` |

Each group produces **at most two PRs** at any point:
- One for **minor/patch** updates (auto-merged)
- One for **major** updates (manual review)

---

## One-Time Setup

### 1. Enable auto-merge on GitHub

Go to: **GitHub → repo → Settings → General → Pull Requests**  
Check: ✅ **Allow auto-merge**

### 2. Create `RENOVATE_TOKEN` secret

Renovate needs a GitHub PAT (Personal Access Token) to open PRs:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. Scopes required: `repo` (full) + `workflow`
4. Copy the token
5. Go to: **GitHub → repo → Settings → Secrets → Actions**
6. Add secret: `RENOVATE_TOKEN` = `ghp_xxxx...`

> 💡 Alternatively, use a [GitHub App](https://docs.renovatebot.com/modules/platform/github/#using-a-github-app)
> for better security (no expiry, scoped permissions).

---

## Running Renovate Locally

You can run Renovate locally to preview what PRs it would create — useful for debugging the
`renovate.json` configuration.

### Prerequisites

```bash
npm install -g renovate
```

### Dry run (read-only — no PRs created)

```bash
RENOVATE_TOKEN=ghp_xxxx \
RENOVATE_DRY_RUN=full \
renovate --platform=github --token=$RENOVATE_TOKEN your-github-username/agent-flow-v2
```

### Validate `renovate.json` config

```bash
renovate-config-validator renovate.json
```

Or use the online validator: [app.renovatebot.com/dashboard](https://app.renovatebot.com/dashboard)

---

## Triggering Renovate Manually on GitHub

To force an immediate Renovate run (without waiting for the nightly cron):

1. Go to: **GitHub → Actions → Renovate**
2. Click: **Run workflow**
3. Renovate will run and open PRs as configured

---

## Handling Major Updates

When a `major-update` PR appears:

1. Read the package's **CHANGELOG / Migration Guide**
2. Check for **breaking changes** affecting the codebase
3. Update the code (imports, APIs, configs) as needed
4. Run `pnpm test` and `pnpm lint` locally
5. Approve and merge the PR

> Major updates are **never auto-merged**. They always require a human decision.

---

## Handling Stuck PRs

### `pnpm-lock.yaml` conflicts

If Renovate can't rebase a PR due to lockfile conflicts:

```bash
# Checkout the Renovate branch
git checkout renovate/nestjs-framework

# Update lockfile
pnpm install

# Commit the fixed lockfile
git add pnpm-lock.yaml
git commit -m "chore(deps): fix pnpm-lock.yaml conflict"
git push
```

### Renovate PR not appearing

- Check the **Renovate workflow run** in GitHub Actions for errors
- Ensure `RENOVATE_TOKEN` secret is valid and not expired
- Verify the `renovate.json` config is valid: `renovate-config-validator renovate.json`

### CI fails on a Renovate PR

- Check the test/lint output in the PR
- If it's a false-positive (flaky test): re-run the CI
- If it's a real failure: close auto-merge, fix the code manually

---

## Ignoring a Specific Update

To tell Renovate to skip a package temporarily, add to `renovate.json`:

```json
"packageRules": [
  {
    "matchPackageNames": ["some-package"],
    "enabled": false
  }
]
```

Or pin to a specific version range:

```json
{
  "matchPackageNames": ["some-package"],
  "allowedVersions": "< 3.0.0"
}
```

---

## Configuration Files

| File | Purpose |
|---|---|
| `renovate.json` | Renovate config (groups, schedule, auto-merge rules) |
| `.github/dependabot.yml` | Dependabot config (GitHub Actions only) |
| `.github/workflows/renovate.yml` | Nightly Renovate trigger via GitHub Actions |
