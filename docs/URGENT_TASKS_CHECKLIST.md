# 🔥 Невідкладні завдання з документації

> Швидкий чеклист критичних завдань з [Action Plan](./DOCUMENTATION_ACTION_PLAN.md)

**Оновлено:** 2026-01-27

---

## ✅ Тиждень 1 - КРИТИЧНО

### 1. 🔴 Виправити ADR-008

**Файл:** `docs/adr/008-data-validation-strategy.md`

**Проблема:** Містить TypeScript код замість опису стратегії

**Дії:**

```bash
# 1. Відкрити файл
code docs/adr/008-data-validation-strategy.md

# 2. Замінити вміст на:
#    - Статус: Accepted
#    - Контекст: чому потрібна валідація
#    - Рішення: class-validator
#    - Альтернативи: Zod, Joi, Yup, AJV
#    - Обґрунтування: чому class-validator
#    - Наслідки: +/- рішення
#    - Приклади: код в окремій секції

# 3. Використати шаблон з docs/adr/TEMPLATE.md
```

**Статус:** ☐ To Do | ⏳ In Progress | ✅ Done

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

### 5. 🔴 Узгодити формат назв гілок

**Проблема:** Різні документи описують різні формати

**Рішення:** Єдиний формат `<type>/<issue-number>-<description>`

**Дії:**

**1. Визначити єдиний формат:**

```markdown
# З issue (обов'язково якщо є GitHub issue)

feature/123-architect-agent-implementation
fix/456-kanban-drag-drop-bug

# Без issue (тільки для minor changes без тікету)

docs/update-readme
chore/update-dependencies
refactor/extract-service
```

**2. Оновити документи:**

**Файл:** `docs/guides/git-workflow.md`

- [ ] Секція "Naming Conventions" → уточнити формат
- [ ] Додати правило: "З issue = обов'язково номер"
- [ ] Оновити всі приклади

**Файл:** `docs/adr/015-git-workflow-branching-strategy.md`

- [ ] Секція "Naming Convention для гілок" → уточнити
- [ ] Оновити приклади
- [ ] Додати правило про обов'язковість issue number

**Файл:** `CONTRIBUTING.md`

- [ ] Секція "Git Workflow" → оновити формат
- [ ] Додати приклади з issue та без

**Файл:** `README.md`

- [ ] Секція "Git Workflow" → оновити short examples

**3. Оновити commitlint:**

```javascript
// commitlint.config.js
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // Додати правило про issue number в branch name
        'references-empty': [2, 'never'] // Вимагати Closes #123
    }
};
```

**Статус:** ☐ To Do | ⏳ In Progress | ✅ Done

---

## 📊 Progress Tracking

```
Тиждень 1 (🔴 Критичні):
  ☐ 1/5 ADR-008 виправлення
  ☐ 2/5 Структура файлів
  ☐ 3/5 CHANGELOG.md
  ☐ 4/5 ADR-019 Security
  ☐ 5/5 Формат гілок

Progress: [░░░░░░░░░░] 0% (0/5)
```

**Оновлюйте після кожного завершення!**

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
