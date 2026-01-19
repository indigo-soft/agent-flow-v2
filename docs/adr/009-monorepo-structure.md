# ADR-009: Структура проєкту (monorepo)

## Статус

Прийнято

## Контекст

Проєкт складається з:

- Backend (NestJS)
- Frontend (Next.js)
- Shared types та utilities

Потрібно вирішити:

- Як організувати код?
- Як шарити типи між frontend та backend?
- Як управляти залежностями?

Розглянуті варіанти:

- **Monorepo** (один репозиторій для всього)
- **Multi-repo** (окремі репозиторії для backend і frontend)

## Рішення

Використовуємо **monorepo** структуру.

## Обґрунтування

### Переваги monorepo:

1. **Shared types**
   - Один source of truth для типів
   - Зміни у типах одразу видні в обох проєктах
   - Немає десинхронізації

2. **Атомарні зміни**
   - Один commit для змін у backend + frontend
   - Легше code review

3. **Простота розробки**
   - Один git clone
   - Одна команда для запуску всього
   - Легше тестува��и інтеграцію

4. **Shared tooling**
   - Один ESLint config
   - Один Prettier config
   - Один Husky для git hooks

### Недоліки:

- Більший розмір репозиторія
- Треба налаштовувати workspace manager

## Структура

```
ai-workflow-assistant/           # Root
├── apps/
│   ├── backend/                 # NestJS application
│   │   ├── src/
│   │   ├── test/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── dashboard/               # Next.js application
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                  # Shared code
│       ├── src/
│       │   ├── types/           # TypeScript types
│       │   │   ├── task.types.ts
│       │   │   ├── draft.types.ts
│       │   │   └── event.types.ts
│       │   ├── schemas/         # Zod schemas
│       │   │   └── task.schema.ts
│       │   └── utils/           # Shared utilities
│       │       └── date.utils.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker/                      # Docker configs
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
│
├── . github/
│   └── workflows/
│       └── ci.yml
│
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # PNPM workspace config
├── turbo.json                   # Turborepo config (optional)
├── . eslintrc.js                 # Shared ESLint
├── .prettierrc                  # Shared Prettier
└── README.md
```

## Workspace Manager

Використовуємо **pnpm workspaces**:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Чому pnpm:**

- ✅ Швидший за npm/yarn
- ✅ Ефективне використання диска (symlinks)
- ✅ Strict mode (уникає phantom dependencies)
- ✅ Вбудована підтримка workspaces

## Shared types приклад

```typescript
// packages/shared/src/types/task. types.ts
export enum TaskStatus {
    NEW = 'NEW',
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    DONE = 'DONE',
}

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    createdAt: Date;
}

// apps/backend/src/tasks/tasks.service.ts
import {Task, TaskStatus} from '@repo/shared/types';

// apps/dashboard/components/TaskCard. tsx
import {Task, TaskStatus} from '@repo/shared/types';
```

## Scripts

```json
// Root package.json
{
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "dev:backend": "pnpm --filter backend dev",
    "dev:dashboard": "pnpm --filter dashboard dev",
    "build": "pnpm run --recursive build",
    "test": "pnpm run --recursive test",
    "lint": "pnpm run --recursive lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  }
}
```

## Наслідки

### Позитивні:

- Type safety між frontend та backend
- Атомарні зміни
- Простіше р��зробка та code review

### Негативні:

- Потрібен workspace manager (pnpm)
- Більший час на git operations (але не критично)

## Примітки

- Використовуємо `pnpm` v8+
- TypeScript project references для швидшої компіляції
- Turbo (опціонально) для кешування build'ів
