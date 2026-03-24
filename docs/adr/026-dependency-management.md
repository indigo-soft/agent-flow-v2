# ADR-026: Automated Dependency Management (Renovate + Dependabot)

## Статус

Accepted

## Контекст

Проєкт має більше 40 npm-залежностей та кілька GitHub Actions. Без автоматизації:

- Залежності старіють і накопичують security-вразливості
- Мажорні оновлення пропускаються через ручну рутину
- Немає системи для групування пов'язаних оновлень
- Немає автоматичного мержу безпечних (patch/minor) апдейтів

**Вимоги до інструменту:**

- Групування пакетів за функціоналом (окремі PR на NestJS, ESLint, Jest тощо)
- Автоматичний мерж patch і minor оновлень після проходження CI
- Major-версії — завжди окремий PR і обов'язковий ручний ревʼю
- Оновлення GitHub Actions — окремий flow
- Гнучке розкладання (не щодня, щоб не засмічувати PR-чергу)
- Запуск через GitHub Actions (не виключно через Renovate Cloud/App)

**Розглянуті альтернативи:**

- **Dependabot** — вбудований у GitHub, але слабке групування та немає auto-merge для minor
- **Renovate** — гнучка конфігурація, grouping, auto-merge, self-hosted через GitHub Actions
- **manual** — не масштабується, security-ризики, пропуск мажорних апдейтів

## Рішення

Використовуємо **два інструменти** з чітким поділом відповідальностей:

| Інструмент | Відповідальність |
|---|---|
| **Renovate** | npm-залежності в `package.json` |
| **Dependabot** | GitHub Actions у `.github/workflows/` |

## Обґрунтування

### Чому Renovate для npm

1. **Гнучке grouping** — можна обʼєднати всі `@nestjs/*` в один PR
2. **Auto-merge** — вбудована підтримка через `platformAutomerge`
3. **Розкладання** — `schedule: ["every 3 days"]` запобігає потоку PR
4. **Self-hosted via GitHub Actions** — не потребує Renovate Cloud, токен достатній
5. **`minimumReleaseAge`** — чекає 3 дні перед авто-мержем (захист від yanked-пакетів)
6. **Conventional Commits** — `commitMessagePrefix: "chore(deps):"` відповідає нашому стандарту

### Чому Dependabot для GitHub Actions

- Dependabot вбудований у GitHub — нульова конфігурація для GitHub Actions
- GitHub Actions не є npm-пакетами, Renovate підтримує їх лише обмежено
- Weekly оновлення GitHub Actions достатньо (вони рідко мають security issues)

### Чому не Dependabot для npm

- Dependabot не підтримує гнучке grouping до 2024 (обмежений порівняно з Renovate)
- Немає нативного auto-merge conditional (тільки minor/patch)
- Немає `minimumReleaseAge` захисту

## Конфігурація

### Renovate (`renovate.json`)

**Розклад:** кожні 3 дні, `Europe/Kyiv`

**Групи пакетів:**

| Група | Пакети |
|---|---|
| NestJS Framework | `@nestjs/*` |
| TypeScript | `typescript`, `@typescript-eslint/*` |
| Testing (Jest) | `jest`, `ts-jest` |
| Linters & Formatters | `eslint`, `prettier`, `eslint-*`, `@eslint/*` |
| Frontend (Next.js) | `next`, `@tanstack/*` |
| Build & Dev Tools | `lefthook`, `npm-run-all`, `@commitlint/*` |
| Release Tools | `release-it`, `@release-it/*` |
| Database & Caching | `prisma`, `keyv`, `cache-manager`, `prettier-plugin-prisma`, `@keyv/*` |

**Auto-merge правила:**

- `patch` + `minor` → auto-merge після CI (мінімум 3 дні після релізу пакету)
- `major` → ручний ревʼю, помічається `major-update` + `needs-review`

### Dependabot (`.github/dependabot.yml`)

- Тип: `github-actions`
- Розклад: щопонеділка о 09:00 Europe/Kyiv
- Групування: усі Actions в один PR

### GitHub Actions (`renovate.yml`)

- Тригер: nightly cron `0 2 * * *` + `workflow_dispatch`
- Дія: `renovatebot/github-action@v41`
- Потребує: секрет `RENOVATE_TOKEN` (GitHub PAT з `repo` scope)

## Наслідки

### Позитивні

- ✅ Security-патчі застосовуються автоматично через 3 дні після релізу
- ✅ PR-черга не засмічується завдяки групуванню та розкладу
- ✅ Мажорні оновлення не пропускаються, але вимагають уваги
- ✅ Conventional Commits дотримуються автоматично
- ✅ Немає залежності від Renovate Cloud — все через GitHub Actions

### Негативні / Обмеження

- ⚠️ Потрібен секрет `RENOVATE_TOKEN` (PAT) у GitHub Secrets
- ⚠️ Auto-merge потребує ввімкненого "Allow auto-merge" у GitHub repo settings
- ⚠️ При конфліктах в `pnpm-lock.yaml` PR треба оновлювати вручну

## Пов'язані ADR

- [ADR-016](016-package-manager-pnpm.md) — Package Manager (pnpm)
- [ADR-015](015-git-workflow-branching-strategy.md) — Git Workflow and Branching
- [ADR-025](025-changelog-release-it.md) — Changelog Automation (release-it)

## Ресурси

- [Renovate Docs](https://docs.renovatebot.com/)
- [renovatebot/github-action](https://github.com/renovatebot/github-action)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [Dependency Updates Guide](../guides/dependency-updates.md)
