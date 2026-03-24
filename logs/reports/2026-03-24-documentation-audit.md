# Documentation Audit Report

**Date:** 2026-03-24  
**Scope:** `/docs/**`, root `*.md`, `/.github`, `/.junie`, `/.lefthook`, root config files  
**Auditor:** GitHub Copilot (automated analysis)  
**Previous audit:** [2026-03-12-project-audit.md](./2026-03-12-project-audit.md)

---

## Executive Summary

The project documentation is generally in good shape after the previous audit cycle. However, 
**28 open issues** remain (30 identified, 2 resolved). The most critical are:
- Empty GitHub Issue templates (completely unusable)
- `ADR-023` is significantly outdated after lint-staged was removed
- `ADR-011` Prettier config documented ≠ actual `.prettierrc`
- `PULL_REQUEST_TEMPLATE.md` uses wrong CLI commands
- `ADR-000_README.md` has malformed ADR-025 entry (not in table)
- Dead code: `.lefthook/commit-format-info.sh` is never invoked

| Category | Issues | Critical | Important | Minor |
|---|---|---|---|---|
| Internal inconsistencies | 5 | 1 | 2 | 2 |
| Cross-document inconsistencies | 11 | 3 | 5 | 3 |
| .github / .junie / .lefthook | 7 | 2 | 3 | 2 |
| Config vs Documentation | 5 | 1 | 3 | 1 |
| **Open total** | **28** | **7** | **13** | **8** |
| ~~Resolved~~ | ~~2~~ | | ~~1~~ | ~~1~~ |

---

## Section 1 — Internal Inconsistencies Within Documents

### ISS-01 🔴 `docs/adr/000_README.md` — ADR-025 entry is outside the table (malformed)

ADR-025 (`025-changelog-release-it.md`) was added as a raw text line instead of a proper table row:

```
[025](025-changelog-release-it.md) Changelog Automation (release-it) Accepted 2026-03-22
```

This appears **below** the Cross-cutting table and **above** the Tooling & Infrastructure heading,
not formatted as Markdown table row. It renders incorrectly.

**Fix:** Add ADR-025 properly to the Cross-cutting table OR create a separate "Changelog &
Releases" sub-table.

---

### ISS-02 🟡 `docs/adr/000_README.md` — References non-existent `TEMPLATE-SHORT.md`

The ADR README states:

> - **`templates/TEMPLATE-SHORT.md`** — короткий шаблон для простих рішень

But `docs/adr/templates/TEMPLATE-SHORT.md` **does not exist**. Only `TEMPLATE.md` is present.

**Fix:** Either create the short template or remove the reference.

---

### ISS-03 🟡 `docs/guides/git-workflow.md` — Duplicate sentence in Subject section

Line ~144-145 contains "Без крапки наприкінці" written **twice** in the Subject rules list:

```markdown
- **Без крапки наприкінці**
- Без крапки наприкінці
```

**Fix:** Remove the duplicate line.

---

### ISS-04 🔵 `docs/adr/023-git-hooks-lefthook.md` — Self-contradicting parallel examples

The implementation section shows `parallel: true` as an example for pre-commit, while the
Notes section says `parallel: false`. The actual `lefthook.yml` uses `parallel: false`.
The document presents a confusing mixed message about the recommended setting.

---

### ISS-05 🔵 `docs/adr/023-git-hooks-lefthook.md` — References non-existent migration guide

The Resources section links to:

```
Наш міграційний гайд: ../MIGRATION_HUSKY_TO_LEFTHOOK.md
```

This file **does not exist** anywhere in the project.

**Fix:** Remove the reference or create the guide.

---

## Section 2 — Cross-Document Inconsistencies

### ISS-06 🔴 `ADR-023` vs `lefthook.yml` — ADR is significantly outdated

**Current state of `lefthook.yml`:**
```yaml
pre-commit:
  parallel: false
  commands:
    format:
      glob: "src/**/*.{ts,tsx,js,jsx,json,md,prisma,css,scss}"
      run: npx prettier --write {staged_files}
      stage_fixed: true
    lint:
      glob: "src/**/*.{ts,tsx,js,jsx}"
      run: npx eslint --fix {staged_files}
      stage_fixed: true
```

**ADR-023 documents (outdated):**
- The `lint-staged` wrapper approach (lint-staged was **completely removed**)
- `--findRelatedTests` flag (was fixed to `--passWithNoTests`)
- `parallel: true` for pre-commit (actual: `parallel: false`)

Also, the **Notes/Примітки** section still states:  
> "lint-staged залишається, тільки спосіб виклику змінився"

This is factually wrong — lint-staged was **removed entirely**.

**Fix:** Rewrite ADR-023 implementation section and notes to reflect the current approach.

---

### ISS-07 🔴 `ADR-011` vs `.prettierrc` — Documented config ≠ actual config

| Option           | Documented in ADR-011 | Actual `.prettierrc` |
|------------------|-----------------------|----------------------|
| `trailingComma`  | `"es5"`               | `"all"` ✗            |
| `arrowParens`    | `"always"`            | **missing** ✗        |
| `bracketSpacing` | `true`                | **missing** ✗        |
| `semi`           | `true`                | `true` ✓             |
| `singleQuote`    | `true`                | `true` ✓             |
| `printWidth`     | `100`                 | `100` ✓              |
| `tabWidth`       | `2`                   | `2` ✓                |

The ADR is the source of truth for architectural decisions. The actual file must match.  
Note: `arrowParens: "always"` and `bracketSpacing: true` are Prettier defaults, so omitting
them is acceptable — but `trailingComma: "all"` vs `"es5"` is a real behavioral difference.

**Fix:** Either update ADR-011 to reflect `"all"` and document why, or align `.prettierrc` 
back to `"es5"`. Add `arrowParens` and `bracketSpacing` explicitly for clarity.

---

### ISS-08 🔴 `PULL_REQUEST_TEMPLATE.md` — Wrong CLI tool and missing script names

The PR checklist uses incorrect commands:

```markdown
- [ ] Усі тести проходять (`npm test`)          ← should be `pnpm test`
- [ ] Lint перевірка OK (`npm lint`)             ← should be `pnpm lint`
- [ ] Type check OK (`npm type-check:all`)       ← script `type-check:all` does not exist
```

`type-check:all` does not exist in `package.json`; the script is named `type-check`.

**Fix:** Replace with `pnpm test`, `pnpm lint`, `pnpm type-check`.

---

### ISS-09 🟡 `ADR-016` vs `ci.yml` / `package.json` — pnpm version mismatch

- **ADR-016** states: "Використовуємо **pnpm** (v8+)"  
- **`ci.yml`** pins: `version: '10'`  
- **`package.json`** (engines, if present): `"pnpm": ">=10.0.0"` in release-flow.md prereqs

The documented "v8+" is out of date by 2 major versions.

**Fix:** Update ADR-016 to state "pnpm v10+" and update any version references.

---

### ISS-10 🟡 `copilot-instructions.md` + `junie/guidelines.md` — Incorrect "monorepo" claim

Both files state:

> **Monorepo**: `pnpm` workspaces.

The project has **one `package.json`** at root level and **no `pnpm-workspace.yaml`**. This is a
**single-package project**, not a pnpm workspaces monorepo. Calling it a monorepo is misleading
to AI agents and new developers.

**Fix:** Change to something like "Single-package project managed with `pnpm`" or document the
intent to become a monorepo in the future.

---

### ISS-11 🟡 `ADR-012` vs `eslint.config.js` — ADR describes old format

ADR-012 documents the legacy `.eslintrc.js` format (CommonJS exports, `extends: [...]` arrays,
`env` key). The actual project uses:
- `eslint.config.js` (ESLint v9+ flat config)
- `defineConfig()` from `eslint/config`
- `FlatCompat` for legacy plugin compatibility
- Native flat config objects for security, react, reactHooks, jsxA11y
- `eslint-config-prettier` as last entry

ADR-012 is fundamentally describing a different configuration system.

**Fix:** Rewrite or significantly update the "Configuration" section of ADR-012 to document
the flat config approach.

---

### ISS-12 🟡 `CONTRIBUTING.md` — Wrong project name in git URLs

```markdown
git clone https://github.com/YOUR-USERNAME/ai-workflow-assistant.git
```

The project repository is `agent-flow-v2`, not `ai-workflow-assistant`.

**Fix:** Update all git URL examples to use `agent-flow-v2` (or use placeholder `your-repo`).

---

### ISS-13 🟡 `docs/adr/015-git-workflow-branching-strategy.md` — Branch types vs commit types

The branch type `feature/` maps to commit type `feat`, but this mapping is not explicitly 
documented. A developer reading both docs independently may wonder why branch uses `feature` 
but commit uses `feat`. The `commitlint.config.js` also only validates `feature|fix|docs|refactor|
test|chore|perf` for branches (correctly excludes `ci` and `build`), but this rationale is not
documented.

**Fix:** Add a clarifying note in git-workflow.md and ADR-015 explaining the `feature/` → `feat`
mapping and why `ci/` and `build/` are not valid branch prefixes.

---

### ISS-14 🔵 `docs/guides/release-flow.md` vs `.release-it.json` — SSH vs Token

`release-flow.md` discusses SSH as an alternative for GitHub auth, but `.release-it.json` still
uses `"tokenRef": "GITHUB_TOKEN"`. The document mentions both but doesn't clearly state which
approach is the project's current standard.

---

### ISS-15 🔵 `docs/adr/016-package-manager-pnpm.md` — References pnpm workspaces

The ADR mentions pnpm workspace features as advantages. However the project does not currently
use pnpm workspaces (`pnpm-workspace.yaml` does not exist). The ADR should clarify the current
usage vs. future capability.

---

### ISS-16 🔵 `docs/guides/git-workflow.md` — `copilot-instructions.md` mixed language

`copilot-instructions.md` contains Ukrainian text (`"⚠️ ВАЖЛИВО: Scope є ОБОВ'ЯЗКОВИМ!"`) 
while being an English-language document intended for the Copilot AI agent. The AI instructions
should be in a consistent language (English) for maximum effectiveness.

---

## Section 3 — .github / .junie / .lefthook / .vscode Inconsistencies

### ISS-17 🔴 `.github/ISSUE_TEMPLATE/` — Both issue templates are completely empty

```
.github/ISSUE_TEMPLATE/bug_report.md       ← 0 bytes
.github/ISSUE_TEMPLATE/feature_request.md  ← 0 bytes
```

Having empty issue templates is actively harmful — GitHub will use them as blank templates,
creating confusion for contributors.

**Fix:** Populate both templates with proper YAML front-matter and sections.

---

### ISS-18 🔴 `.lefthook/commit-format-info.sh` — Dead code, never invoked

The script `.lefthook/commit-format-info.sh` exists but is **not referenced anywhere** in
`lefthook.yml`. It will never be executed. This is dead code that:
- Misleads developers into thinking it runs automatically
- Adds maintenance burden (must keep in sync if commit format changes)
- Has already drifted: it still shows the old format info format

**Fix:** Either integrate it into `lefthook.yml` (e.g., as a `prepare-commit-msg` hook) or 
delete it.

---

### ISS-19 🟡 `.junie/guidelines.md` — Section 7 still mentions lint-staged

Section 7 "Code Quality Tools" lists:

> - **lint-staged**: Run linters only on staged files.

lint-staged was **removed** from the project. The actual pre-commit tooling now uses Lefthook's
native `{staged_files}` with `stage_fixed: true`.

**Fix:** Update Section 7 to remove lint-staged and accurately describe the current Lefthook
native approach.

---

### ISS-20 🟡 `.vscode/` — Missing `extensions.json` for recommended extensions

> **✅ RESOLVED (2026-03-24):** The project uses JetBrains, not VS Code. The `.vscode/` folder
> was created by mistake and has been deleted. `.vscode/` added to `.gitignore`.
> For shared editor settings, the project uses `.editorconfig` (already present, 21 KB).

---

### ISS-21 🟡 `.github/copilot-instructions.md` — Mixed Ukrainian/English language

The file is primarily English but contains Ukrainian phrases inline:

> `"⚠️ ВАЖЛИВО: Scope є ОБОВ'ЯЗКОВИМ!"`

For an AI instruction file, consistent language is critical for reliable parsing.

**Fix:** Translate the Ukrainian sections to English.

---

### ISS-22 🟡 `.github/BRANCH_NAMING_RULES.md` — Language inconsistency with other `.github` files

`BRANCH_NAMING_RULES.md` is entirely in Ukrainian, while `copilot-instructions.md` is in English,
and `PULL_REQUEST_TEMPLATE.md` is in Ukrainian. The language policy for `.github/` files is
not defined anywhere.

**Fix:** Define a language standard for `.github/` files. Recommend English for maximum
accessibility (including external contributors). At minimum, add English summaries.

---

### ISS-23 🔵 `.github/PULL_REQUEST_TEMPLATE.md` — No link to ADR index for new contributors

The checklist references `coding standards` with a link, but doesn't reference the ADR index
or architecture guide, which are essential for understanding architectural constraints.

**Fix:** Add a link to `docs/adr/000_README.md` and `docs/guides/architecture.md` in the checklist.

---

### ISS-24 🔵 `.junie/guidelines.md` — Architecture section is brief, missing key enforcement rules

Section 5 shows the directory tree correctly but omits the critical enforcement rules that 
`docs/guides/architecture.md` documents in detail (import cycle rules, how to check for violations,
etc.). The Junie AI agent may generate code that violates architectural constraints.

**Fix:** Add the 4 key rules to the Junie guidelines (domain modules are independent, use queue 
for cross-domain communication, shared cannot import domain, only api/ can import domain).

---

## Section 4 — Config Files vs Documentation Alignment

### ISS-25 🔴 No `.nvmrc` or `.node-version` — Node.js version only pinned in CI

`ci.yml` pins `node-version: '24'` and `release-flow.md` lists `node ≥ 24.0.0` as a prerequisite,
but there is no `.nvmrc` or `.node-version` file for local development. Developers using `nvm`,
`fnm`, `volta` or similar will not automatically switch to the correct Node.js version.

**Fix:** Create `.nvmrc` with content `24` (or the exact LTS version being used).

---

### ISS-26 🟡 `package.json` — Missing `engines` field

The project requires Node.js ≥ 24 and pnpm ≥ 10 (documented in `release-flow.md` prerequisites),
but `package.json` has no `engines` field to enforce this at install time.

```json
"engines": {
  "node": ">=24.0.0",
  "pnpm": ">=10.0.0"
}
```

**Fix:** Add the `engines` field to `package.json`.

---

### ISS-27 🟡 `.prettierignore` — Missing common entries

Current `.prettierignore`:
```
node_modules
dist
.next
.prisma
*.log
package-lock.json
pnpm-lock.yaml
/logs/
```

Missing best-practice ignores:
- `CHANGELOG.md` — auto-generated, should not be reformatted by Prettier
- `*.min.js`, `*.min.css` — minified files
- `.idea/` — JetBrains IDE files

**Fix:** Add the above entries to `.prettierignore`.

---

### ISS-28 🟡 `qodana.yaml` — No documentation for Qodana workflow

`qodana.yaml` is configured (`linter: jetbrains/qodana-js:2025.3`) but:
- No CI job runs Qodana (not in `ci.yml`)
- No guide documents how to run Qodana locally
- No ADR explains the decision to include Qodana

**Fix:** Either add Qodana to CI and document it, or acknowledge it as a manual/optional tool
in `docs/guides/` and create a brief ADR or note in ADR-014 (Tools Summary).

---

### ISS-29 🔵 `.vscode/settings.json` — Missing ESLint auto-fix on save

> **✅ RESOLVED (2026-03-24):** `.vscode/` folder deleted (project uses JetBrains, not VS Code).
> Not applicable. ESLint auto-fix on save is configured via JetBrains IDE settings directly.

---

### ISS-30 🔵 No Dependabot / Renovate configuration

There is no `dependabot.yml` in `.github/` and no `renovate.json` at the root. Dependency
updates (security patches, major version bumps) must be done manually. This is a best-practice
gap for any project with a CI/CD pipeline.

**Fix:** Create `.github/dependabot.yml` with configuration for npm ecosystem and GitHub Actions.

---

## Appendix: Files Not Audited (Scope Exclusions)

The following were noted as out-of-scope for this audit but may warrant separate review:
- `docs/api/endpoints.md` and `events.md` (stub files — content depends on Phase 2 implementation)
- `docs/guides/system-design.md` and `requirements.md` (deferred per previous tasklist)
- `docs/adr/archive/` files (superseded, archived by design)
- `scripts/` directory (separate technical audit recommended)

---

## Summary Table

| ID | Severity | File | Issue |
|---|---|---|---|
| ISS-01 | 🔴 | `docs/adr/000_README.md` | ADR-025 entry outside table |
| ISS-02 | 🟡 | `docs/adr/000_README.md` | References non-existent TEMPLATE-SHORT.md |
| ISS-03 | 🟡 | `docs/guides/git-workflow.md` | Duplicate "Без крапки наприкінці" sentence |
| ISS-04 | 🔵 | `docs/adr/023-git-hooks-lefthook.md` | Contradictory parallel: true vs false |
| ISS-05 | 🔵 | `docs/adr/023-git-hooks-lefthook.md` | References non-existent migration guide |
| ISS-06 | 🔴 | `docs/adr/023-git-hooks-lefthook.md` | Entire implementation section outdated |
| ISS-07 | 🔴 | `docs/adr/011-code-formatting-prettier.md` | Config documented ≠ actual .prettierrc |
| ISS-08 | 🔴 | `.github/PULL_REQUEST_TEMPLATE.md` | Wrong CLI tool (npm) and missing script name |
| ISS-09 | 🟡 | `docs/adr/016-package-manager-pnpm.md` | pnpm version "v8+" outdated, actual v10 |
| ISS-10 | 🟡 | `copilot-instructions.md` + `junie/guidelines.md` | Incorrect "monorepo" claim |
| ISS-11 | 🟡 | `docs/adr/012-code-linting-eslint.md` | ADR describes legacy `.eslintrc.js` format |
| ISS-12 | 🟡 | `CONTRIBUTING.md` | Wrong project name in git URLs |
| ISS-13 | 🟡 | `docs/guides/git-workflow.md` | feature/ → feat mapping not documented |
| ISS-14 | 🔵 | `docs/guides/release-flow.md` | SSH vs Token approach unclear |
| ISS-15 | 🔵 | `docs/adr/016-package-manager-pnpm.md` | References pnpm workspaces features not used |
| ISS-16 | 🔵 | `.github/copilot-instructions.md` | Ukrainian text in English document |
| ISS-17 | 🔴 | `.github/ISSUE_TEMPLATE/` | Both issue templates are empty |
| ISS-18 | 🔴 | `.lefthook/commit-format-info.sh` | Dead code, never invoked from lefthook.yml |
| ISS-19 | 🟡 | `.junie/guidelines.md` | Section 7 still mentions removed lint-staged |
| ISS-20 | ✅ | `.vscode/` | ~~Missing extensions.json~~ — Resolved: folder deleted, added to .gitignore |
| ISS-21 | 🟡 | `.github/copilot-instructions.md` | Mixed Ukrainian/English language |
| ISS-22 | 🟡 | `.github/BRANCH_NAMING_RULES.md` | Language inconsistency across .github files |
| ISS-23 | 🔵 | `.github/PULL_REQUEST_TEMPLATE.md` | No link to ADR index / architecture guide |
| ISS-24 | 🔵 | `.junie/guidelines.md` | Architecture rules section is too brief |
| ISS-25 | 🔴 | Root | No .nvmrc / .node-version for local dev |
| ISS-26 | 🟡 | `package.json` | Missing `engines` field |
| ISS-27 | 🟡 | `.prettierignore` | Missing CHANGELOG.md and other common ignores |
| ISS-28 | 🟡 | `qodana.yaml` | No documentation or CI integration for Qodana |
| ISS-29 | ✅ | `.vscode/settings.json` | ~~Missing ESLint auto-fix~~ — Resolved: folder deleted, configure in JetBrains IDE |
| ISS-30 | 🔵 | `.github/` | No Dependabot/Renovate configuration |

---

*Report generated: 2026-03-24 | Next review recommended: after Phase 2 implementation begins*
