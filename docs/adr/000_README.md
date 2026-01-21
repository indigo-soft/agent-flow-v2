# Architecture Decision Records (ADR)

Цей каталог містить Architecture Decision Records (ADR) — документи, що описують важливі архітектурні рішення, прийняті
у проєкті.

## Що таке ADR?

ADR (Architecture Decision Record) — це документ що фіксує:

- **Яке** архітектурне рішення було прийнято
- **Чому** саме це рішення (а не альтернативи)
- **Які** наслідки цього рішення

## Навіщо це потрібно?

✅ **Історія рішень** — через рік ви пам'ятатимете чому обрали PostgreSQL, а не MongoDB  
✅ **Onboarding** — нові члени команди швидко розуміють архітектуру  
✅ **Уникнення debates** — рішення вже прийняте та задокументоване  
✅ **Context для змін** — коли треба змінити рішення, є контекст для аналізу

## Коли створювати ADR?

Створюйте ADR, коли приймаєте рішення про:

- 🏗️ **Архітектуру** — вибір framework, структура проєкту, патерни
- 🛠️ **Технології** — вибір бази даних, черги повідомлень, логування
- 📐 **Підходи** — Git workflow, testing strategy, deployment
- 🔒 **Обмеження** — security policies, performance requirements
- 🔄 **Зміни** — коли переходите з однієї технології на іншу

## Коли НЕ створювати ADR?

❌ Дрібні імплементаційні деталі (яку бібліотеку для date formatting)  
❌ Очевидні рішення (використовувати TypeScript у TypeScript проєкті)  
❌ Тимчасові workarounds  
❌ Code style (для цього є ESLint config)

## Список ADR

### Backend

| #                                        | Назва                          | Статус   | Дата       |
|------------------------------------------|--------------------------------|----------|------------|
| [001](001-backend-framework-nestjs.md)   | Backend Framework (NestJS)     | Accepted | 2024-01-20 |
| [002](002-nestjs-fastify-adapter.md)     | Fastify Adapter для NestJS     | Accepted | 2024-01-20 |
| [003](003-queue-system-bullmq.md)        | Queue System (BullMQ)          | Accepted | 2024-01-20 |
| [004](004-database-postgresql-prisma.md) | Database (PostgreSQL + Prisma) | Accepted | 2024-01-20 |
| [005](005-testing-framework-jest.md)     | Testing Framework (Jest)       | Accepted | 2024-01-20 |
| [006](006-logging-pino.md)               | Logging (Pino)                 | Accepted | 2024-01-20 |

### Frontend

| #                                             | Назва                                | Статус   | Дата       |
|-----------------------------------------------|--------------------------------------|----------|------------|
| [007](007-frontend-framework-nextjs-react.md) | Frontend Framework (Next.js + React) | Accepted | 2024-01-20 |

### Cross-cutting

| #                                             | Назва                               | Статус   | Дата       |
|-----------------------------------------------|-------------------------------------|----------|------------|
| [008](008-data-validation-strategy.md)        | Data Validation Strategy            | Accepted | 2024-01-20 |
| [009](009-monorepo-structure.md)              | Monorepo Structure                  | Accepted | 2024-01-20 |
| [010](010-error-handling-strategy.md)         | Error Handling Strategy             | Accepted | 2024-01-20 |
| [011](011-code-formatting-prettier.md)        | Code Formatting (Prettier)          | Accepted | 2024-01-20 |
| [012](012-code-linting-eslint.md)             | Code Linting (ESLint)               | Accepted | 2024-01-20 |
| [013](013-git-hooks-husky-lint-staged.md)     | Git Hooks (Husky + lint-staged)     | Accepted | 2024-01-20 |
| [014](014-tools-summary.md)                   | Tools Summary                       | Accepted | 2024-01-20 |
| [015](015-git-workflow-branching-strategy.md) | Git Workflow and Branching Strategy | Accepted | 2024-01-20 |

### Tooling & Infrastructure

| #                                                     | Назва                                     | Статус   | Дата       |
|-------------------------------------------------------|-------------------------------------------|----------|------------|
| [016](016-package-manager-pnpm.md)                    | Package Manager (pnpm)                    | Accepted | 2024-01-20 |
| [017](017-no-docker-native-development-production.md) | Нативна розробка та deployment без Docker | Accepted | 2024-01-20 |

## Як створити новий ADR?

### 1. Скопіюйте template

```bash
# Визначте наступний номер (наприклад, 016)
NEXT_NUM=016

# Створіть файл з описовою назвою
cp docs/adr/TEMPLATE.md docs/adr/${NEXT_NUM}-your-decision-title.md
```

### 2. Заповніть секції

- **Статус**: Почніть з "Proposed"
- **Контекст**: Опишіть проблему
- **Рішення**: Що вирішили
- **Альтернативи**: Що ще розглядали
- **Обґрунтування**: Чому саме це рішення
- **Наслідки**: Що зміниться

### 3. Обговоріть з командою

- Створіть PR з новим ADR
- Обговоріть у коментарях
- Внесіть правки, якщо потрібно

### 4. Прийміть рішення

- Змініть статус на "Accepted"
- Змерджіть PR
- Оновіть цей README.md (додайте в таблицю)

### 5. Імплементуйте

- Створіть задачі для імплементації (якщо потрібно)
- Оновлюйте ADR, якщо контекст змінюється

## Формат назви файлу

```
XXX-short-descriptive-title. md
```

- `XXX` — порядковий номер (001, 002, ... 999)
- `short-descriptive-title` — коротка назва (kebab-case)
- Англійська мова

**Приклади:**

- ✅ `001-backend-framework-nestjs.md`
- ✅ `015-git-workflow-branching-strategy.md`
- ❌ `1-backend. md` (немає leading zeros)
- ❌ `ADR-001-Backend-Framework. md` (не PascalCase)

## Lifecycle ADR

```
Proposed → Accepted → Deprecated → Superseded
           ↓
         Rejected
```

- **Proposed** — обговорюється, рішення ще не прийняте
- **Accepted** — рішення прийняте та діє
- **Deprecated** — рішення застаріле, але ще використовується
- **Superseded** — замінене іншим ADR
- **Rejected** — рішення відхилено

### Коли змінювати статус?

**Proposed → Accepted:**

- Коли команда погодилась із рішенням
- PR з ADR змерджений

**Accepted → Deprecated:**

- Коли почали міграцію на нове рішення
- Старе рішення ще використовується в коді

**Deprecated → Superseded:**

- Коли міграція завершена
- Указати посилання на новий ADR, що замінює

**Proposed → Rejected:**

- Коли вирішили не використовувати це рішення
- Обов'язково пояснити чому у ADR

## Best Practices

### ✅ Добре

- Пишіть ADR **коли приймаєте** рішення, не після
- Будьте чесні про недоліки рішення
- Описуйте альтернативи, які розглядали
- Використовуйте конкретні приклади та дані
- Оновлюйте ADR, якщо контекст змінюється
- Коротко та зрозуміло (1–3 сторінки)

### ❌ Погано

- Писати ADR через місяць після прийняття рішення (забудете деталі)
- Ігнорувати недоліки (кожне рішення має trade-offs)
- Не описувати альтернативи ("ми просто обрали X")
- Писати романи на 10 сторінок
- Створювати ADR для дрібниць

## Template

Використовуйте [TEMPLATE.md](TEMPLATE.md) для створення нових ADR.

## Приклади

Подивіться ADR, що вже існують, як приклади:

- [ADR-001](001-backend-framework-nestjs.md) — повний приклад з усіма секціями
- [ADR-015](015-git-workflow-branching-strategy.md) — приклад з детальними інструкціями

## Питання?

- Прочитайте [ADR Template](TEMPLATE.md) з поясненнями
- Подивіться ADR, що вже існують, як приклади:
- Створіть [GitHub Discussion](https://github.com/your-org/your-repo/discussions)

## Корисні посилання

- [ADR GitHub Org](https://adr.github.io/) — колекція ADR templates
- [ThoughtWorks on ADR](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
- [ADR Tools](https://github.com/npryce/adr-tools) — CLI для управління ADR
