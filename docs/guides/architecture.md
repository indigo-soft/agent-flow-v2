# Архітектура проєкту

Цей документ описує архітектурний підхід, використаний у проєкті **agent-flow-v2**.

## Огляд

Проєкт використовує **Flat Modular Architecture with Shared Layer** — це розширення класичної Flat Modular Architecture
з явним розділенням на доменні модулі та shared компоненти.

**Детальний ADR:
** [ADR-024: Flat Modular Architecture with Shared Layer](../adr/024-flat-modular-architecture-with-shared-layer.md)

## Основні принципи

### 1. Два рівні модулів

```
src/
├── modules/         # Доменні модулі (бізнес-логіка)
└── components/      # Shared компоненти (технічна інфраструктура)
```

### 2. Найважливіші правила

#### ✅ Правило #1: Доменні модулі незалежні

**Доменні модулі** (`modules/`) НЕ можуть залежати один від одного:

```typescript
// ❌ ЗАБОРОНЕНО
import { WorkflowService } from '@modules/workflow-agent';

// ✅ ДОЗВОЛЕНО - взаємодія через Event Queue
await this.queueService.publish('task.created', { taskId });

// ✅ ДОЗВОЛЕНО (рідкісний виняток) - через HTTP
const response = await this.httpClient.post('http://api/workflow/execute', data);
```

**Виняток:** У **рідкісних випадках** доменні модулі можуть взаємодіяти через HTTP-запити, але це **завжди** повинно
бути задокументовано в README модуля з поясненням чому Event Queue не підходить.

#### ✅ Правило #2: Доменні модулі можуть використовувати shared

**Доменні модулі** (`modules/`) можуть залежати від **shared компонентів** (`components/`):

```typescript
// ✅ ДОЗВОЛЕНО
import { DatabaseService } from '@components/database';
import { QueueService } from '@components/queue';
import { LoggerService } from '@components/logger';
import { GitHubService } from '@components/github';
```

#### ✅ Правило #3: Shared компоненти можуть залежати один від одного

**Shared компоненти** (`components/`) можуть залежати один від одного:

```typescript
// ✅ ДОЗВОЛЕНО
// database.service.ts
import { LoggerService } from '@components/logger';
import { ConfigService } from '@components/config';
```

#### ❌ Правило #4: Shared НЕ залежать від domain

**Shared компоненти** (`components/`) НЕ можуть залежати від доменних модулів:

```typescript
// ❌ ЗАБОРОНЕНО
import { ArchitectService } from '@modules/architect-agent';
```

**Виняток:** API Gateway (`components/api/`) — це entry point, який викликає доменні модулі. Це єдиний дозволений
випадок:

```typescript
// ✅ ДОЗВОЛЕНО тільки в API Gateway
// components/api/conversations/conversations.controller.ts
import { ArchitectService } from '@modules/architect-agent';
```

## Структура модулів

### Domain Modules (`modules/`)

**Що містять:** Бізнес-логіку, специфічну для домену

```
modules/
├── architect-agent/          # AI агент для аналізу та планування
├── workflow-agent/           # AI агент для виконання завдань
├── code-review-agent/        # AI агент для code review
└── documentation-agent/      # AI агент для документації
```

**Характеристики:**

- 🎯 Містять бізнес-правила та domain logic
- 🔒 Ізольовані (не залежать один від одного)
- 📬 Взаємодіють через Event Queue
- ⚙️ Використовують shared компоненти
- 🧩 Можуть бути легко виділені в окремі сервіси

**Приклад структури модуля:**

```
modules/architect-agent/
├── architect.module.ts       # NestJS module
├── architect.service.ts      # Бізнес-логіка
├── architect.processor.ts    # Event queue processor
├── dtos.ts                   # DTO для валідації
├── types.ts                  # TypeScript types
├── architect.spec.ts         # Unit tests
└── README.md                 # Документація модуля
```

### Shared Components (`components/`)

**Що містять:** Технічну інфраструктуру багаторазового використання

```
components/
├── api/                      # API Gateway (entry point)
├── database/                 # Database service (Prisma)
├── queue/                    # Event Queue (BullMQ)
├── logger/                   # Logging (Pino)
├── config/                   # Configuration
├── ai-provider/              # AI Provider integration
├── github/                   # GitHub integration
└── dashboard/                # Frontend (Next.js)
```

**Характеристики:**

- 🔧 Технічні компоненти (не бізнес-логіка)
- 🔄 Повторно використовуються
- 🔗 Можуть залежати один від одного
- 📦 Можуть стати npm packages
- 🚫 Не залежать від domain modules

**Приклад структури компонента:**

```
components/database/
├── database.module.ts        # NestJS module
├── database.service.ts       # Prisma wrapper
├── prisma/
│   └── schema.prisma         # Database schema
├── migrations/               # Prisma migrations
└── README.md
```

## Flat Modular всередині

Всередині `modules/` та `components/` використовується **Flat Modular Architecture**:

### Простий модуль (5–10 файлів)

Всі файли в корені:

```
modules/documentation-agent/
├── documentation.module.ts
├── documentation.service.ts
├── documentation.processor.ts
├── dtos.ts
├── types.ts
└── documentation.spec.ts
```

### Складний модуль (20+ файлів)

Використовуємо DDD структуру:

```
modules/architect-agent/
├── domain/                   # Domain layer
│   ├── entities/
│   ├── value-objects/
│   └── interfaces/
├── application/              # Application layer
│   ├── use-cases/
│   └── services/
├── infrastructure/           # Infrastructure layer
│   ├── processors/
│   └── adapters/
├── dtos.ts
├── types.ts
├── architect.module.ts
└── architect.spec.ts
```

**Правило:** DDD структура тільки для складних модулів з великою кількістю файлів.

## Діаграма залежностей

```
┌─────────────────────────────────────────────────┐
│                  modules/                       │
│  ┌─────────────┐  ┌─────────────┐              │
│  │  architect  │  │  workflow   │   Доменні    │
│  │   agent     │  │   agent     │   модулі     │
│  └─────────────┘  └─────────────┘              │
│         │                │                      │
│         └────────┬───────┘                      │
│                  │ (тільки ↓)                   │
└──────────────────┼──────────────────────────────┘
                   ↓
         ╔═════════════════╗
         ║  Event Queue    ║  ← Основний спосіб
         ╚═════════════════╝     взаємодії
                   ↓
┌──────────────────┼──────────────────────────────┐
│                  ↓                               │
│            components/                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ database │←→│  logger  │←→│  config  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐                    │
│  │  github  │  │    ai    │   Shared           │
│  │          │  │ provider │   компоненти       │
│  └──────────┘  └──────────┘                    │
│         ↑                                       │
│  ┌──────────┐                                   │
│  │   api    │  ← Entry point (виняток)         │
│  │ gateway  │                                   │
│  └──────────┘                                   │
└─────────────────────────────────────────────────┘
                   ↑
              HTTP Requests
                   ↑
         ┌─────────────────┐
         │   dashboard/    │  Frontend
         └─────────────────┘
```

**Легенда:**

- `→` — дозволена залежність (import)
- `↔` — взаємна залежність
- `╔══╗` — механізм взаємодії

## Взаємодія між модулями

### 1. Event-Driven (основний спосіб)

Доменні модулі взаємодіють через Event Queue:

```typescript
// modules/workflow-agent/workflow.service.ts
async startWork(taskId: string) {
  // Публікуємо подію
  await this.queueService.publish('task.started', { taskId });
  
  // Виконуємо роботу
  const result = await this.executeTask(taskId);
  
  // Публікуємо результат
  await this.queueService.publish('task.completed', { 
    taskId, 
    result 
  });
}
```

```typescript
// modules/code-review-agent/code-review.processor.ts
@Processor('task.completed')
async handleTaskCompleted(job: Job) {
  const { taskId, result } = job.data;
  
  // Обробляємо подію
  await this.startCodeReview(taskId, result);
}
```

**Переваги:**

- ✅ Повна незалежність модулів
- ✅ Асинхронна обробка
- ✅ Retry механізм
- ✅ Легко масштабувати

### 2. HTTP (рідкісні випадки)

У виключних випадках можна використовувати HTTP:

```typescript
// modules/workflow-agent/workflow.service.ts
async getDraftDetails(draftId: string) {
  // ⚠️ ВИНЯТОК: синхронний запит до іншого модуля через API
  const response = await this.httpClient.get(
    `${this.apiUrl}/drafts/${draftId}`
  );
  
  return response.data;
}
```

**Коли використовувати:**

- Потрібна синхронна відповідь
- Timeout критичний
- Event Queue технічно не підходить

**Важливо:** Завжди документуйте такі випадки в README модуля!

### 3. Shared компоненти

Використання shared компонентів:

```typescript
// modules/architect-agent/architect.service.ts
import { DatabaseService } from '@components/database';
import { LoggerService } from '@components/logger';
import { GitHubService } from '@components/github';

@Injectable()
export class ArchitectService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: LoggerService,
    private readonly github: GitHubService,
  ) {}
  
  async createDraft(conversation: string) {
    this.logger.info('Creating draft');
    
    const draft = await this.db.draft.create({
      data: { conversation }
    });
    
    return draft;
  }
}
```

## TypeScript Paths

Для зручності імпортів налаштовані path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

**Приклади використання:**

```typescript
// ✅ Domain module імпортує shared
import { DatabaseService } from '@components/database';
import { QueueService } from '@components/queue';

// ✅ Shared імпортує інший shared
import { LoggerService } from '@components/logger';

// ❌ Domain НЕ імпортує інший domain
import { WorkflowService } from '@modules/workflow-agent'; // ЗАБОРОНЕНО!

// ✅ API Gateway викликає domain (виняток)
import { ArchitectService } from '@modules/architect-agent';
```

## Frontend (Dashboard)

**Dashboard** — це окремий shared компонент, що містить тільки frontend код:

```
components/dashboard/
├── app/                      # Next.js App Router
│   ├── page.tsx
│   ├── layout.tsx
│   └── tasks/
├── components/               # React компоненти
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   └── TaskCard.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
├── lib/
│   ├── api.ts               # API client
│   └── hooks.ts
└── styles/
    └── globals.css
```

**Backend API** знаходиться окремо в `components/api/`:

```
components/api/
├── conversations/
│   └── conversations.controller.ts
├── tasks/
│   └── tasks.controller.ts
└── drafts/
    └── drafts.controller.ts
```

## Додавання нових модулів

### Новий доменний модуль

1. **Створити теку** в `modules/`:
   ```bash
   mkdir -p src/modules/notification-agent
   ```

2. **Створити файли:**
   ```
   modules/notification-agent/
   ├── notification.module.ts
   ├── notification.service.ts
   ├── notification.processor.ts
   ├── dtos.ts
   └── README.md
   ```

3. **Використовувати тільки:**
    - Shared компоненти з `@components/*`
    - Event Queue для взаємодії з іншими модулями

### Новий shared компонент

1. **Створити теку** в `components/`:
   ```bash
   mkdir -p src/components/slack
   ```

2. **Створити файли:**
   ```
   components/slack/
   ├── slack.module.ts
   ├── slack.service.ts
   └── README.md
   ```

3. **Можна використовувати:**
    - Інші shared компоненти з `@components/*`
    - НЕ можна використовувати доменні модулі!

## Best Practices

### ✅ Добре

```typescript
// Domain module
import { DatabaseService } from '@components/database';
import { QueueService } from '@components/queue';

@Injectable()
export class ArchitectService {
  async createTask() {
    // Використовуємо shared компоненти
    await this.db.task.create({ ... });
    
    // Публікуємо подію для інших модулів
    await this.queue.publish('task.created', { taskId });
  }
}
```

### ❌ Погано

```typescript
// Domain module
import { WorkflowService } from '@modules/workflow-agent'; // ❌ Заборонено!

@Injectable()
export class ArchitectService {
  async createTask() {
    // ❌ Прямий виклик іншого domain module
    await this.workflowService.startWork();
  }
}
```

### ✅ Виняток (HTTP)

```typescript
// Domain module
// ⚠️ ВИНЯТОК: задокументовано в README
async getDraftSync(draftId: string) {
  const response = await this.httpClient.get(
    `${this.apiUrl}/drafts/${draftId}`
  );
  return response.data;
}
```

## Міграція існуючого коду

План міграції описаний в [ADR-024](../adr/024-flat-modular-architecture-with-shared-layer.md), секція "План
упровадження".

## Питання та відповіді

### Q: Чому domain modules не можуть імпортувати один одного?

**A:** Щоб зберегти незалежність модулів. Це дозволяє:

- Легко виділити модуль в окремий мікросервіс
- Тестувати модулі ізольовано
- Уникнути circular dependencies
- Підтримувати чистий dependency graph

### Q: Коли використовувати HTTP замість Event Queue?

**A:** Тільки коли:

- Потрібна **синхронна** відповідь (не можна чекати)
- Timeout **критичний**
- Event Queue **технічно не підходить**

**Завжди документуйте** такі випадки в README модуля!

### Q: Де розмістити новий функціонал?

**A:** Задайте собі питання:

- **Це бізнес-логіка, специфічна для домену?** → `modules/`
- **Це технічна інфраструктура для повторного використання?** → `components/`

**Приклади:**

- `AuthService` (технічний) → `components/auth/`
- `NotificationAgent` (доменний) → `modules/notification-agent/`

### Q: Чи можуть shared компоненти залежати один від одного?

**A:** Так, це дозволено. Наприклад:

```typescript
// components/database/database.service.ts
import { LoggerService } from '@components/logger'; // ✅ OK
```

### Q: Dashboard — це domain чи shared?

**A:** **Shared компонент**. Це технічний frontend, який використовує API. Backend API знаходиться в `components/api/`.

## Додаткові ресурси

- [ADR-024: Flat Modular Architecture with Shared Layer](../adr/024-flat-modular-architecture-with-shared-layer.md) —
  повний опис архітектури
- [ADR-018 (archived): Flat Modular File Structure](../adr/archive/018-file-structure-flat-modular.md) — попередня
  версія
- [Naming Conventions](naming-conventions.md) — правила іменування
- [Coding Standards](coding-standards.md) — стандарти коду
