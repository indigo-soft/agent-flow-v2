# ADR-018: Flat Modular File Structure

## Статус

Superseded by [ADR-024](../024-flat-modular-architecture-with-shared-layer.md)

## Контекст

Проєкт потребує чіткої та зрозумілої файлової структури для:

- Backend (NestJS) з агентами, API, інтеграціями
- Frontend (Next.js) Dashboard
- Shared код між backend та frontend
- Інфраструктурний код (database, queue, logger, config)

Вимоги:

- **Простота** — мінімум укладеності, інтуїтивно зрозуміло
- **Швидка навігація** — одразу зрозуміло, де що знаходиться
- **Логічність** — структура відображає функціональність системи
- **Гнучкість** — DDD тільки де потрібно, не всюди
- **Масштабованість** — легко додавати нові модулі

Проблеми з традиційними підходами:

- **apps/packages/scripts** — занадто багато верхніх тек, незрозуміло де що
- **Domain-Driven всюди** — overkill для простих модулів
- **Layered Architecture** — складно знайти всі файли модуля

## Рішення

Використовуємо **Flat Modular Structure**:

- **Одна коренева тека** `src/` для всього коду
- **Кожен модуль верхнього рівня** — окрема тека (agents, api, dashboard, core, database, queue, integrations, logger,
  config, shared)
- **Всередині модулів** — підмодулі (architect, workflow, code-review тощо)
- **DDD тільки де потрібно** — складні модулі можуть мати domain/application/infrastructure, прості — просто файли

## Обґрунтування

### Переваги:

1. **Простота та інтуїтивність** ✅
    - Плоска структура верхнього рівня
    - Назви модулів відповідають функціональності
    - Немає абстракцій типу apps/packages

   ```
   Потрібен Architect Agent?     → src/agents/architect/
   Потрібен Tasks API?            → src/api/tasks/
   Потрібна GitHub інтеграція?    → src/integrations/github/
   Потрібна Prisma схема?         → src/database/prisma/schema.prisma
   ```

2. **Швидка навігація** ✅
    - Максимум 3 рівні вкладеності для більшості файлів
    - Логічна ієрархія: модуль → підмодуль → файли
    - TypeScript paths (`@agents/*`, `@api/*`) для зручності імпортів

3. **Гнучкість** ✅
    - Простий модуль (5–10 файлів): усі файли в корені підмодуля
    - Складний модуль (20+ файлів): domain/application/infrastructure структура
    - Рішення приймається для кожного модуля окремо

4. **Масштабованість** ✅
    - Додати новий агент: `src/agents/new-agent/`
    - Додати нову інтеграцію: `src/integrations/new-service/`
    - Додати новий API endpoint: `src/api/new-resource/`
    - Легко виділити модуль в окремий package пізніше

5. **Відповідність бізнес-логіці** ✅
    - Структура відображає архітектуру системи
    - Агенти окремо, API окремо, інтеграції окремо
    - Зрозуміло, навіть без документації

### Недоліки:

- ⚠️ Потребує дисципліни в дотриманні структури
- ⚠️ Frontend всередині `src/` може здатися незвичним (але логічно)

### Чому не інші варіанти:

**apps/packages/scripts:**

- ❌ Занадто багато верхніх тек
- ❌ Незрозуміло що куди класти
- ❌ Дублювання (apps/backend та packages/shared обидва містять backend код)

**Domain-Driven всюди:**

- ❌ Overkill для простих модулів
- ❌ Занадто багато вкладеності
- ❌ Складно для команди з поверхневим знанням

**Layered Architecture:**

- ❌ Складно знайти всі файли одного модуля
- ❌ Логіка розкидана по різних теках
- ❌ Важко виділити модуль в окремий сервіс

## Структура

### Верхній рівень

```
ai-workflow-assistant/
├── src/                    # 🎯 ВСЬ КОД ТУТ
│   ├── agents/             # 🤖 AI Агенти
│   ├── api/                # 🌐 Backend API (REST)
│   ├── dashboard/          # 🎨 Frontend (Next.js)
│   ├── core/               # 🧠 Shared backend (guards, filters, etc.)
│   ├── database/           # 🗄️ Prisma + models
│   ├── queue/              # 📬 BullMQ
│   ├── integrations/       # 🔌 GitHub, AI Provider
│   ├── logger/             # 📝 Pino
│   ├── config/             # ⚙️ Configuration
│   ├── shared/             # 🔗 Shared між backend/frontend
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── tests/                  # 🧪 E2E tests
├── scripts/                # 🛠️ Utility scripts
├── docs/                   # 📚 Documentation
└── [config files]
```

### Приклад модуля (Agents)

```
src/agents/
├── architect/
│   ├── architect.module.ts
│   ├── architect.service.ts
│   ├── architect.processor.ts
│   ├── dtos.ts                    # Всі DTO в одному файлі
│   ├── types.ts                   # Types/interfaces
│   └── architect.spec.ts          # Unit tests
├── workflow/
│   ├── workflow.module.ts
│   ├── workflow.service.ts
│   ├── workflow.processor.ts
│   ├── dtos.ts
│   ├── types.ts
│   └── workflow.spec.ts
├── code-review/
│   └── [same structure]
├── documentation/
│   └── [same structure]
└── agents.module.ts               # Barrel module
```

### Приклад складного модуля з DDD (API Tasks)

Якщо модуль стає великим (20+ файлів), додаємо DDD структуру:

```
src/api/tasks/
├── domain/                        # 📦 Domain layer
│   ├── entities/
│   │   └── task.entity.ts
│   ├── value-objects/
│   │   └── task-status.vo.ts
│   └── interfaces/
│       └── task-repository.interface.ts
├── application/                   # 🎯 Application layer
│   ├── use-cases/
│   │   ├── create-task.use-case.ts
│   │   └── update-task.use-case.ts
│   └── tasks.service.ts
├── infrastructure/                # 🔧 Infrastructure layer
│   ├── repositories/
│   │   └── task.repository.ts
│   └── tasks.controller.ts
├── dtos.ts
├── types.ts
├── tasks.module.ts
└── tasks.spec.ts
```

**Правило:** DDD структура застосовується **тільки для складних модулів**.  
Прості модулі залишаються плоскими.

### Dashboard (Frontend)

```
src/dashboard/
├── app/                           # Next.js App Router
│   ├── page.tsx
│   ├── layout.tsx
│   ├── tasks/
│   │   └── page.tsx
│   └── drafts/
│       └── page.tsx
├── components/
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   └── KanbanBoard.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
├── lib/
│   ├── api.ts
│   ├── hooks.ts
│   └── validations.ts
├── styles/
│   └── globals.css
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## TypeScript Paths

Для зручності імпортів налаштовуємо path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@agents/*": ["src/agents/*"],
      "@api/*": ["src/api/*"],
      "@core/*": ["src/core/*"],
      "@database/*": ["src/database/*"],
      "@queue/*": ["src/queue/*"],
      "@integrations/*": ["src/integrations/*"],
      "@logger/*": ["src/logger/*"],
      "@config/*": ["src/config/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

**Приклад використання:**

```typescript
// Замість:
import { ArchitectService } from '../../../agents/architect/architect.service';

// Пишемо:
import { ArchitectService } from '@agents/architect/architect.service';

// Або через barrel export:
import { ArchitectService } from '@agents/architect';
```

## Naming Conventions

### Backend файли (NestJS)

```
✅ ПРАВИЛЬНО:
architect.module.ts
architect.service.ts
architect.processor.ts
architect.spec.ts
dtos.ts (або dto/ папка)
types.ts
index.ts

❌ НЕПРАВИЛЬНО:
ArchitectModule.ts (PascalCase)
architect_service.ts (snake_case)
architectService.ts (camelCase)
```

### Frontend файли (React/Next.js)

```
✅ ПРАВИЛЬНО:
TaskCard.tsx (PascalCase для компонентів)
TaskCard.test.tsx
useTasks.ts (camelCase для hooks)
api.ts
index.ts

❌ НЕПРАВИЛЬНО:
task-card.tsx (kebab-case)
taskCard.tsx (camelCase для компонентів)
```

### Директорії

```
✅ ПРАВИЛЬНО:
agents/
api/
code-review/
ai-provider/

❌ НЕПРАВИЛЬНО:
Agents/ (PascalCase)
code_review/ (snake_case)
aiProvider/ (camelCase)
```

## Правила організації

### 1. Коли створювати окрему теку `dto/`?

**Правило:** Якщо DTO більше 3-х, створюємо папку.

```
✅ До 3 DTO:
architect/
├── dtos.ts         # CreateDraftDto, UpdateDraftDto, DraftResponseDto

✅ Більше 3 DTO:
architect/
├── dto/
│   ├── create-draft.dto.ts
│   ├── update-draft.dto.ts
│   ├── draft-response.dto.ts
│   ├── analyze-conversation.dto.ts
│   └── index.ts
```

### 2. Коли застосовувати DDD структуру?

**Правило:** Якщо модуль має понад 20 файлів або складну бізнес-логіку.

**Приклади:**

- ✅ **Tasks API** — складна логіка (статуси, пріоритети, ієрархія) → DDD
- ✅ **Code Review Agent** — складна логіка (парсинг коду, аналіз) → DDD
- ❌ **Health Check** — 2 файли → БЕЗ DDD
- ❌ **Logger** — wrapper над Pino → БЕЗ DDD

### 3. Де розміщувати тести?

**Unit тести:** Поруч із файлом

```
architect.service.ts
architect.service.spec.ts
```

**E2E тести:** Окремо в `/tests/e2e/`

```
tests/
├── e2e/
│   ├── tasks.e2e.spec.ts
│   └── agents.e2e.spec.ts
```

### 4. Barrel exports (index.ts)

**Використовуємо для:**

- ✅ Модулів з багатьма підмодулями
- ✅ DTO/Types папок

```typescript
// src/agents/architect/index.ts
export * from './architect.module';
export * from './architect.service';
export * from './dtos';
export * from './types';

// Використання:
import { ArchitectModule, ArchitectService } from '@agents/architect';
```

**НЕ використовуємо для:**

- ❌ Папок з 1-2 файлами (overkill)

## Наслідки

### Позитивні:

- ✅ **Інтуїтивна навігація** — одразу зрозуміло де та що
- ✅ **Швидкість розробки** — легко знайти та додати код
- ✅ **Простота onboarding** — нова людина швидко розбереться
- ✅ **Гнучкість** — DDD тільки де потрібно
- ✅ **Масштабованість** — легко додавати модулі
- ✅ **Чистий код** — логічна організація

### Негативні:

- ⚠️ Потребує дисципліни в дотриманні правил
- ⚠️ Frontend в `src/` може здатись незвичним

### Нейтральні:

- ℹ️ Можна легко мігрувати на monorepo (packages) пізніше
- ℹ️ TypeScript paths треба налаштувати один раз

## Scaffolding

Для швидкого створення нових модулів використовуємо scaffolding scripts (див. `scripts/generate-module.js`).

**Приклади:**

```bash
# Створити нового агента
pnpm generate:agent notification

# Створити API endpoint
pnpm generate:api users

# Створити інтеграцію
pnpm generate:integration slack
```

## Migration Plan

Міграція з поточної структури на нову:

### Phase 1: Підготовка

- [ ] Створити нову структуру `src/`
- [ ] Налаштувати TypeScript paths
- [ ] Створити scaffolding scripts

### Phase 2: Міграція по модулях

- [ ] Перенести agents/ → src/agents/
- [ ] Перенести API → src/api/
- [ ] Перенести dashboard → src/dashboard/
- [ ] Перенести інфраструктуру → src/database/, src/queue/, etc.

### Phase 3: Cleanup

- [ ] Видалити старі apps/packages/ теки
- [ ] Оновити всі імпорти
- [ ] Оновити package.json scripts
- [ ] Перевірити тести

**Детальний migration guide:** `docs/guides/migration-to-new-structure.md`

## Приклади

Повну структуру всіх модулів див. у `docs/architecture/file-structure.md`

## Зв'язки

- Supersedes: ADR-009 (Monorepo Structure) — тепер одна `src/` тека
- Related to: ADR-001 (Backend Framework) — структура для NestJS
- Related to: ADR-007 (Frontend Framework) — структура для Next.js

## Примітки

### Чому саме така структура?

1. **Простота** — пріоритет #1 для команди з поверхневим знанням
2. **Логічність** — структура відображає функціональність
3. **Гнучкість** — можна адаптувати під конкретні потреби
4. **Future-proof** — легко мігрувати на інші підходи пізніше

### Що якщо модуль стане дуже великим?

Є три варіанти:

1. Застосувати DDD всередині модуля
2. Розбити на підмодулі
3. Виділити в окремий package (monorepo)

Обирати залежно від ситуації.

## Автори

- @indigo-soft

## Дата

2024-01-20

## Теги

`structure` `organization` `architecture` `simplicity` `ddd`
