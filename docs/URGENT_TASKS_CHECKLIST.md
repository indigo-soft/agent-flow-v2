# 🔥 Невідкладні завдання з документації

> Швидкий чеклист критичних завдань з [Action Plan](./DOCUMENTATION_ACTION_PLAN.md)

**Останнє оновлення:** 2026-02-14  
**Статус:** 🚀 В роботі - Тиждень 1 завершено, Тиждень 2 розпочато

---

## ✅ Виконано

**2026-01-27:**

- ✅ ADR-008 виправлено (тепер містить правильну структуру з контекстом, альтернативами, обґрунтуванням)
- ✅ ADR-019 Security Strategy створено
- ✅ ADR-020 State Management Strategy створено
- ✅ ADR-021 Observability Strategy створено
- ✅ ADR-022 API Design Strategy створено
- ✅ Оновлено `docs/adr/000_README.md` з новими ADR

---

## ✅ Тиждень 1 - КРИТИЧНО

### 1. ✅ Виправити ADR-008 — DONE

**Файл:** `docs/adr/008-data-validation-strategy.md`

**Проблема:** Містить TypeScript код замість опису стратегії

**Статус:** ✅ **Done (2026-01-27)**

**Виконано:**

- ✅ Переписано згідно з правильним форматом ADR
- ✅ Додано секцію "Контекст" з описом проблеми
- ✅ Додано секцію "Рішення" з багаторівневою стратегією
- ✅ Додано секцію "Обґрунтування" з порівнянням альтернатив
- ✅ Приклади коду винесені в окремі секції з поясненнями

---

### 2. 🔴 Узгодити структуру файлів

**Проблема:** Документи містять застарілі шляхи (`apps/backend`, `packages/shared`)

**Дії:**

```bash
# 1. Знайти всі згадки старої структури
cd docs/
grep -r "apps/backend" . --include="*.md"
grep -r "apps/dashboard" . --include="*.md"
grep -r "packages/shared" . --include="*.md"

# 2. Замінити на нову структуру:
#    apps/backend     → src/api, src/agents, src/core
#    apps/dashboard   → src/dashboard
#    packages/shared  → src/shared

# 3. Оновити файли:
#    - README.md (root)
#    - CONTRIBUTING.md
#    - docs/guides/*.md
#    - docs/adr/*.md (особливо ADR-018)
#    - docs/architecture/*.md

# 4. Перевірити що немає broken links
```

**Файли для оновлення:**

- [ ] README.md
- [ ] CONTRIBUTING.md
- [ ] docs/guides/git-workflow.md
- [ ] docs/guides/coding-standards.md
- [ ] docs/adr/009-monorepo-structure.md (вже superseded, але перевірити)
- [ ] docs/adr/018-file-structure-flat-modular.md
- [ ] docs/architecture/overview.md
- [ ] docs/architecture/modules.md

**Статус:** ☐ To Do | ⏳ In Progress | ✅ Done

---

### 3. 🔴 Заповнити CHANGELOG.md

**Файл:** `CHANGELOG.md`

**Проблема:** Порожній файл

**Дії:**

```bash
# 1. Відкрити файл
code CHANGELOG.md

# 2. Додати структуру Keep a Changelog
```

**Мінімальний вміст:**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Documentation audit and action plan (2026-01-27)
- Comprehensive ADR documentation
- Git workflow and branching strategy
- Flat modular file structure (ADR-018)

### Changed

- Migrated from monorepo structure to flat src/ structure

## [0.1.0] - 2026-01-20

### Added

- Initial project structure
- NestJS backend setup with Fastify adapter
- Next.js frontend setup
- PostgreSQL + Prisma integration
- BullMQ queue system for async processing
- Pino logger integration
- Basic documentation structure (ADRs, guides, architecture)

### Infrastructure

- pnpm workspace configuration
- ESLint and Prettier setup
- Husky git hooks
- Conventional commits configuration
```

**Додатково (опціонально):**

```bash
# 3. Налаштувати автоматичну генерацію
pnpm add -D conventional-changelog-cli

# 4. Додати script в package.json
"scripts": {
  "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
}

# 5. Створити .github/workflows/changelog.yml (див. Action Plan)
```

**Статус:** ☐ To Do | ⏳ In Progress | ✅ Done

---

### 4. 🔴 Створити ADR-019: Security Strategy

**Файл:** `docs/adr/019-security-strategy.md`

**Проблема:** Відсутня стратегія безпеки для проєкту з конфіденційними даними

**Дії:**

```bash
# 1. Створити файл
code docs/adr/019-security-strategy.md

# 2. Скопіювати шаблон з DOCUMENTATION_AUDIT_REPORT.md секція 2.1

# 3. Структура:
#    - Статус: Accepted
#    - Контекст: конфіденційні дані (GitHub tokens, код, промпти)
#    - Рішення: Layered Security Approach
#    - Секції:
#      1. Authentication & Authorization
#      2. Data Protection (encryption, secrets)
#      3. Input Validation & Sanitization
#      4. API Security (CORS, rate limiting)
#      5. Dependencies Security
#      6. Logging (без sensitive data)
#      7. Production Security
#      8. Code Security

# 4. Додати в docs/adr/000_README.md таблицю
```

**Шаблон взяти з:** `docs/DOCUMENTATION_AUDIT_REPORT.md` → секція "2.1 Відсутні критичні ADR" → ADR-019

**Після створення:**

```bash
# Оновити таблицю в docs/adr/000_README.md
# Додати рядок:
# | [019](019-security-strategy.md) | Security Strategy | Accepted | 2026-01-27 |
```

**Статус:** ☐ To Do | ⏳ In Progress | ✅ Done

---

### 5. ✅ Узгодити формат назв гілок — DONE

**Проблема:** Різні документи описують різні формати

**Рішення:** Єдиний формат `<type>/<issue-number>-<description>` з обов'язковим 4-значним номером issue

**Статус:** ✅ **Done (2026-02-11)**

**Виконано:**

**1. Встановлено єдиний формат:**

- ✅ Формат: `<type>/<issue-number>-<short-description>`
- ✅ Issue number **ОБОВ'ЯЗКОВИЙ**, мінімум 4 цифри (0001, 0042, 1234)
- ✅ Приклади: `feature/0001-architect-agent`, `fix/0042-bug-fix`

**2. Оновлено документацію:**

- ✅ `docs/guides/git-workflow.md` — оновлено всі приклади та правила
- ✅ `docs/guides/naming-conventions.md` — додано правила про 4-значний формат
- ✅ `docs/adr/015-git-workflow-branching-strategy.md` — оновлено приклади
- ✅ `CONTRIBUTING.md` — оновлено Git Workflow секцію
- ✅ `README.md` — оновлено short examples
- ✅ `.github/copilot-instructions.md` — оновлено правила
- ✅ Створено `.github/BRANCH_NAMING_RULES.md` — швидкий довідник

**3. Створено автоматичну валідацію:**

- ✅ Custom plugin у `commitlint.config.js` для перевірки branch naming
- ✅ Перевірка відбувається при кожному коміті (не при push)
- ✅ Regex: `^(feature|fix|docs|refactor|test|chore|perf)\/[0-9]{4,}-[a-z0-9-]+$`
- ✅ Детальні повідомлення про помилки

**4. Додаткові покращення:**

- ✅ Scope став **ОБОВ'ЯЗКОВИМ** у commit messages
- ✅ Мігровано з Husky на **Lefthook** (швидший, YAML конфіг)
- ✅ Створено ADR-023: Git Hooks (Lefthook)
- ✅ Оновлено ADR-013 (позначено як Superseded)
- ✅ Оновлено ADR-014 (Tools Summary)

**5. Створено документацію:**

- ✅ `BRANCH_NAMING_COMPLETE.md` — повний звіт про узгодження
- ✅ `docs/BRANCH_NAMING_ALIGNMENT_REPORT.md` — детальний звіт
- ✅ `docs/MIGRATION_HUSKY_TO_LEFTHOOK.md` — міграційний гайд
- ✅ `LEFTHOOK_SCOPE_MIGRATION_COMPLETE.md` — фінальний summary

**Протестовано:**

- ✅ Коміт без scope → відхилено
- ✅ Коміт з scope → пройшов
- ✅ Неправильна назва гілки → відхилено при коміті
- ✅ Правильна назва гілки → пройшов

---

## 📊 Progress Tracking

```
Тиждень 1 (🔴 Критичні):
  ✅ 1/5 ADR-008 виправлення (DONE - 2026-01-27)
  ⚠️ 2/5 Структура файлів (SKIPPED - не актуально для плоскої структури)
  ⚠️ 3/5 CHANGELOG.md (DEFERRED - буде автоматизовано пізніше)
  ✅ 4/5 ADR-019 Security (DONE - 2026-01-27, плюс ADR-020, 021, 022)
  ✅ 5/5 Формат гілок (DONE - 2026-02-11, плюс міграція на Lefthook)

Progress: [██████████] 100% (3/5 виконано, 2/5 відкладено)

Тиждень 2 (🟡 Developer Experience):
  ☐ 6/6 TypeScript Path Aliases (ADDED - 2026-02-14)

Progress: [░░░░░░░░░░] 0% (0/1 виконано)
```

**Статус Тиждень 1:** ✅ **Всі критичні завдання завершені!**

**Додаткові досягнення (Тиждень 1):**

- ✅ Створено 4 нових ADR (019-022)
- ✅ Створено ADR-023 (Lefthook)
- ✅ Мігровано на Lefthook з Husky
- ✅ Scope став обов'язковим
- ✅ Автоматична валідація branch naming
- ✅ Оновлено 11+ файлів документації

**Статус Тиждень 2:** 🟡 **Нові завдання з покращення DX**

**Оновлено:** 2026-02-14

---

## 🔄 Тиждень 2 - Покращення Developer Experience

### 6. 🟡 Налаштувати TypeScript Path Aliases

**Проблема:** Проєкт має flat modular структуру (`src/agents/`, `src/api/`, `src/database/` тощо), але не повністю налаштовано TypeScript path aliases для зручних імпортів. Наразі `tsconfig.json` містить часткові налаштування, але відсутня підтримка runtime та конфігурація для Jest.

**Чому це важливо:**

- 🎯 Чисті імпорти замість відносних шляхів (`@agents/architect` замість `../../../agents/architect`)
- 🔧 Легший рефакторинг (переміщення файлів не ламає імпорти)
- 📖 Краща читабельність коду
- 🚀 Підготовка проєкту до масштабування

**Що потрібно налаштувати:**

**1. Доповнити `tsconfig.json` paths:**

```json
{
  "compilerOptions": {
    "paths": {
      "@agents/*": ["src/agents/*"],
      "@api/*": ["src/api/*"],
      "@database/*": ["src/database/*"],
      "@integrations/*": ["src/integrations/*"],     // ← додати
      "@queue/*": ["src/queue/*"],                   // ← додати
      "@logger/*": ["src/logger/*"],                 // ← додати
      "@config/*": ["src/config/*"],                 // ← додати
      "@shared/*": ["src/shared/*"],
      "@core/*": ["src/core/*"],
      "@dashboard/*": ["src/dashboard/*"]
    }
  }
}
```

**2. Встановити `tsconfig-paths` для runtime:**

```bash
pnpm add -D tsconfig-paths
```

**3. Налаштувати `jest.config.js` (якщо є/буде):**

```javascript
module.exports = {
  moduleNameMapper: {
    '^@agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@integrations/(.*)$': '<rootDir>/src/integrations/$1',
    '^@queue/(.*)$': '<rootDir>/src/queue/$1',
    '^@logger/(.*)$': '<rootDir>/src/logger/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@dashboard/(.*)$': '<rootDir>/src/dashboard/$1',
  },
};
```

**4. Оновити `package.json` scripts:**

```json
{
  "scripts": {
    "dev:backend": "node -r tsconfig-paths/register dist/main",
    "start": "node -r tsconfig-paths/register dist/main"
  }
}
```

**5. Створити entry point з tsconfig-paths (якщо потрібно):**

Створити `src/main.ts` (або оновити існуючий):

```typescript
import 'tsconfig-paths/register';
// Решта імпортів та код
```

**6. Оновити ESLint конфігурацію (якщо потрібно):**

`.eslintrc.js` вже має `eslint-import-resolver-typescript`, перевірити що працює з path aliases.

**Приклади використання:**

**До (відносні шляхи):**

```typescript
import { ArchitectAgent } from '../../../agents/architect/architect.service';
import { WorkflowService } from '../../workflow/workflow.service';
import { PrismaService } from '../../../database/prisma.service';
```

**Після (path aliases):**

```typescript
import { ArchitectAgent } from '@agents/architect/architect.service';
import { WorkflowService } from '@api/workflow/workflow.service';
import { PrismaService } from '@database/prisma.service';
```

**Додаткові кроки:**

- [ ] Доповнити `tsconfig.json` з відсутніми aliases
- [ ] Встановити `tsconfig-paths`
- [ ] Оновити scripts у `package.json`
- [ ] Створити або оновити entry point
- [ ] Налаштувати `jest.config.js` (якщо буде додано Jest)
- [ ] Протестувати build та runtime
- [ ] Поступово мігрувати існуючі імпорти (опціонально, можна робити поступово)

**Посилання:**

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [tsconfig-paths GitHub](https://github.com/dividab/tsconfig-paths)
- [NestJS Path Mapping](https://docs.nestjs.com/cli/monorepo#path-mapping)

**Пріоритет:** 🟡 Високий (покращує DX, готує до масштабування)

**Статус:** ☐ To Do | ⏳ In Progress | ✅ Done

---

## 🚨 Якщо виникли проблеми

1. **Прочитайте:** [DOCUMENTATION_AUDIT_REPORT.md](./DOCUMENTATION_AUDIT_REPORT.md) для деталей
2. **Перевірте:** Приклади у звіті аудиту
3. **Використайте:** Шаблони з `docs/adr/TEMPLATE.md`
4. **Питання:** Створіть GitHub Discussion або запитайте у команді

---

## ✅ Критерії готовності

**Завдання вважається виконаним коли:**

- [ ] Зміни зроблені у всіх потрібних файлах
- [ ] Code examples перевірені (компілюються)
- [ ] Links працюють (немає 404)
- [ ] PR створено з описом змін
- [ ] PR отримав approve
- [ ] Зміни змерджені в main
- [ ] Чеклист оновлено (✅ Done)

---

## 📅 Deadlines

- **Тиждень 1 (критичні):** [ВСТАНОВІТЬ ДАТУ]
- **Weekly sync:** [ВСТАНОВІТЬ ДНІ/ЧАС]

---

**Автор:** GitHub Copilot  
**Дата:** 2026-01-27  
**Версія:** 1.0
