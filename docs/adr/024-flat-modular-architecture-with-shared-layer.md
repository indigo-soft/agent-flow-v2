# ADR-024: Flat Modular Architecture with Shared Layer

## Статус

Accepted

Supersedes: [ADR-018](archive/018-file-structure-flat-modular.md)

## Контекст

Проєкт використовував класичну **Flat Modular Architecture** (ADR-018), де всі модулі знаходились в одній теці `src/` на
одному рівні:

```
src/
├── agents/          # AI агенти
├── api/             # API Gateway
├── dashboard/       # Frontend
├── database/        # Database service
├── queue/           # Event Queue
├── integrations/    # GitHub, AI Provider
├── logger/          # Logging
├── config/          # Configuration
├── core/            # Core utilities
└── shared/          # Shared code
```

**Проблеми:**

1. **Немає чіткого розмежування між доменними та shared модулями**
    - Незрозуміло які модулі можуть залежати від яких
    - `agents/architect` може імпортувати `agents/workflow`? (спойлер: ні, не може)
    - `database` може імпортувати `logger`? (так, може)

2. **Порушення принципу незалежності доменних модулів**
    - Доменні модулі (агенти) повинні бути незалежними один від одного
    - Вони взаємодіють тільки через Event Queue (або рідко через HTTP)
    - Але на рівні структури це не очевидно

3. **Складність масштабування**
    - При додаванні нових модулів незрозуміло: це доменний чи shared?
    - Немає чіткого правила де розміщувати новий функціонал

4. **Відсутність архітектурних guardrails**
    - TypeScript дозволяє імпорт будь-де
    - Немає автоматичної перевірки залежностей між модулями
    - Легко порушити правило "доменні модулі незалежні"

## Рішення

Використовуємо **Flat Modular Architecture with Shared Layer** — це розширення класичної Flat Modular Architecture з
явним розділенням на два рівні:

```
src/
├── modules/         # Доменні модулі (бізнес-логіка)
│   ├── architect-agent/
│   ├── workflow-agent/
│   ├── code-review-agent/
│   └── documentation-agent/
│
└── components/      # Shared компоненти (технічні модулі)
    ├── api/         # API Gateway
    ├── database/    # Database service
    ├── queue/       # Event Queue
    ├── logger/      # Logging
    ├── config/      # Configuration
    ├── ai-provider/ # AI integrations
    ├── github/      # GitHub integration
    └── dashboard/   # Frontend (окремий shared модуль)
```

**Ключові правила:**

1. **`modules/` — тільки доменні модулі:**
    - Містять бізнес-логіку системи
    - Незалежні один від одного
    - Взаємодіють тільки через Event Queue (або рідко через HTTP)
    - Можуть залежати тільки від `components/`

2. **`components/` — тільки shared модулі:**
    - Технічні компоненти багаторазового використання
    - Можуть залежати один від одного (наприклад, `database` використовує `logger`)
    - Не можуть залежати від `modules/`

3. **Всередині `modules/` та `components/` — Flat Modular Architecture:**
    - Прості модулі (5–10 файлів): всі файли в корені
    - Складні модулі (20+ файлів): domain/application/infrastructure

4. **Frontend (`dashboard/`) — окремий shared модуль:**
    - Знаходиться в `components/dashboard/`
    - Це тільки frontend код
    - Backend API знаходиться в `components/api/`

## Альтернативи

### Альтернатива 1: Залишити Flat Modular Architecture (ADR-018)

**Переваги:**

- ✅ Нічого не потрібно міняти
- ✅ Простіше для малих проєктів
- ✅ Менше тек верхнього рівня

**Недоліки:**

- ❌ Немає чіткого розмежування доменних та shared модулів
- ❌ Легко порушити архітектурні правила
- ❌ Складно масштабувати при зростанні проєкту
- ❌ Новим розробникам незрозуміло що від чого може залежати

**Чому не обрали:** Проєкт росте, з'являються нові агенти. Потрібні чіткі архітектурні guardrails для запобігання "
spaghetti imports".

### Альтернатива 2: Повний Domain-Driven Design (DDD) з Bounded Contexts

**Переваги:**

- ✅ Дуже чітке розмежування доменів
- ✅ Кожен Bounded Context — окремий субдомен
- ✅ Стандартний підхід для великих enterprise систем

**Недоліки:**

- ❌ Overkill для проєкту такого розміру
- ❌ Занадто багато вкладеності (domains/contexts/modules/layers)
- ❌ Складніше для розробників без DDD досвіду
- ❌ Більше boilerplate коду

**Чому не обрали:** Занадто складно. Ми хочемо зберегти простоту Flat Modular Architecture, але додати структуру для
розмежування модулів.

### Альтернатива 3: Monorepo з packages (apps/ та packages/)

**Переваги:**

- ✅ Фізичне розділення через workspace packages
- ✅ Чіткий dependency graph через package.json
- ✅ Можливість version control для кожного package

**Недоліки:**

- ❌ Занадто багато верхніх тек (apps/, packages/, libs/)
- ❌ Складніша конфігурація TypeScript paths
- ❌ Більше boilerplate (package.json для кожного модуля)
- ❌ Overkill для проєкту де все деплоїться разом

**Чому не обрали:** Ми вже використовуємо pnpm workspaces на рівні всього проєкту (ADR-016). Додаткове розділення
всередині backend — зайве ускладнення.

### Альтернатива 4: Feature-based structure (features/)

**Переваги:**

- ✅ Модулі організовані навколо features
- ✅ Популярний у Next.js та React проєктах
- ✅ Легко знайти всі файли однієї фічі

**Недоліки:**

- ❌ Розмиває межу між доменною логікою та інфраструктурою
- ❌ Важко розділити shared компоненти
- ❌ Не підходить для event-driven архітектури
- ❌ Більше підходить для frontend, ніж для backend

**Чому не обрали:** У нас не feature-based система, а agent-based. Агенти — це доменні модулі, а не features.

## Обґрунтування

### Чому саме це рішення?

1. **Явне розмежування = менше помилок** ✅
    - Структура тек одразу показує: доменний модуль чи shared
    - Важко випадково створити неправильну залежність
    - Code review стає простішим (бачимо imports між modules/)

2. **Зберігаємо простоту Flat Modular Architecture** ✅
    - Всередині `modules/` та `components/` — той самий flat підхід
    - Максимум 3 рівні вкладеності
    - Не потребує вивчення DDD чи інших складних патернів

3. **Легко масштабувати** ✅
    - Додати новий агент: `modules/new-agent/`
    - Додати новий shared компонент: `components/new-service/`
    - Правило завжди очевидне

4. **Готовність до microservices** ✅
    - У майбутньому легко виділити модуль з `modules/` у окремий сервіс
    - Shared компоненти з `components/` стають npm packages
    - Архітектура вже підготована до розділення

5. **Відповідає event-driven архітектурі** ✅
    - Доменні модулі в `modules/` не залежать один від одного
    - Event Queue в `components/queue/` — shared інфраструктура
    - API Gateway в `components/api/` — shared entry point

### Ключові переваги над ADR-018:

| Аспект                           | ADR-018 (Flat Modular)      | ADR-024 (with Shared Layer) |
|----------------------------------|-----------------------------|-----------------------------|
| Розмежування модулів             | ❌ Неявне                    | ✅ Явне (2 теки)             |
| Запобігання неправильним imports | ❌ Тільки через дисципліну   | ✅ Структура + lint rules    |
| Масштабованість                  | ⚠️ Складно при зростанні    | ✅ Чіткі правила             |
| Onboarding нових розробників     | ⚠️ Потрібно вивчити правила | ✅ Структура = документація  |
| Готовність до microservices      | ⚠️ Потрібен рефакторинг     | ✅ Вже готово                |

## Наслідки

### Позитивні

- ✅ **Чітка архітектура** — структура тек = архітектурна документація
- ✅ **Запобігання помилкам** — важко створити неправильну залежність
- ✅ **Простий onboarding** — новому розробнику одразу зрозуміло де що лежить
- ✅ **Легше code review** — бачимо imports між modules/ = red flag
- ✅ **Готовність до масштабування** — легко виділити модулі у microservices
- ✅ **Зберігаємо простоту** — всередині тек той самий flat підхід
- ✅ **TypeScript paths чіткіші** — `@modules/*` vs `@components/*`
- ✅ **Можливість додати lint rules** — заборонити imports між modules/

### Негативні

- ⚠️ **Потрібна міграція існуючого коду** — перемістити модулі в нові теки
- ⚠️ **Оновити всі imports** — змінити шляхи в TypeScript
- ⚠️ **Оновити конфігурацію** — tsconfig.json paths, Jest config
- ⚠️ **Можливі breaking changes** — якщо хтось працює над фічами паралельно

### Нейтральні

- ℹ️ **На один рівень більше вкладеності** — `src/modules/architect/` замість `src/agents/architect/`
- ℹ️ **Потрібно навчити команду новим правилам** — але структура інтуїтивна
- ℹ️ **Зміна звичного** — але це одноразова зміна

## Структура модулів

### Domain Modules (`modules/`)

Доменні модулі містять бізнес-логіку системи:

```
modules/
├── architect-agent/          # AI агент для аналізу та планування
│   ├── architect.service.ts
│   ├── architect.controller.ts
│   ├── architect.module.ts
│   └── dto/
│
├── workflow-agent/           # AI агент для виконання завдань
│   ├── workflow.service.ts
│   └── ...
│
├── code-review-agent/        # AI агент для code review
│   └── ...
│
└── documentation-agent/      # AI агент для документації
    └── ...
```

**Правила для domain modules:**

- ❌ НЕ можуть імпортувати інші модулі з `modules/`
- ✅ Можуть імпортувати з `components/`
- ✅ Взаємодіють через Event Queue (рідко через HTTP)
- ✅ Містять бізнес-логіку специфічну для домену

### Shared Components (`components/`)

Shared компоненти — технічна інфраструктура:

```
components/
├── api/                      # API Gateway (entry point)
│   ├── tasks/
│   ├── conversations/
│   └── drafts/
│
├── database/                 # Database service (Prisma)
│   ├── prisma/
│   └── database.service.ts
│
├── queue/                    # Event Queue (BullMQ)
│   ├── queue.service.ts
│   └── processors/
│
├── logger/                   # Logging (Pino)
│   └── logger.service.ts
│
├── config/                   # Configuration
│   └── config.service.ts
│
├── ai-provider/              # AI Provider integration
│   └── openai.service.ts
│
├── github/                   # GitHub integration
│   └── github.service.ts
│
└── dashboard/                # Frontend (Next.js)
    ├── app/
    ├── components/
    └── lib/
```

**Правила для shared components:**

- ✅ Можуть імпортувати інші компоненти з `components/`
- ❌ НЕ можуть імпортувати з `modules/`
- ✅ Надають сервіси для domain modules
- ✅ Повторно використовуються

## Взаємодія модулів

### Дозволені залежності:

```
modules/architect-agent/  →  components/database/
modules/architect-agent/  →  components/queue/
modules/workflow-agent/   →  components/ai-provider/
components/database/      →  components/logger/
components/api/           →  modules/architect-agent/
```

### Заборонені залежності:

```
modules/architect-agent/  ✗  modules/workflow-agent/     # Доменні модулі незалежні!
components/database/      ✗  modules/architect-agent/    # Shared не залежить від domain
modules/architect-agent/  ✗  modules/code-review-agent/  # Тільки через Event Queue!
```

### Виключення (рідкісні випадки):

У **виключних** випадках доменні модулі можуть взаємодіяти через HTTP:

```
modules/workflow-agent/  →  HTTP Request  →  components/api/  →  modules/architect-agent/
```

**Важливо:** Це ВИКЛЮЧЕННЯ. Завжди пріоритет — Event Queue. HTTP використовується тільки коли:

- Потрібна синхронна відповідь
- Timeout критичний
- Event Queue не підходить технічно

Всі такі випадки повинні бути задокументовані в README модуля.

## Приклад TypeScript Paths

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

Приклад imports:

```typescript
// ✅ Domain module імпортує shared component
import { DatabaseService } from '@components/database';
import { QueueService } from '@components/queue';

// ✅ Shared component імпортує інший shared component
import { LoggerService } from '@components/logger';

// ❌ Domain module НЕ імпортує інший domain module
import { WorkflowService } from '@modules/workflow-agent'; // ЗАБОРОНЕНО!

// ✅ API (shared) викликає domain module
import { ArchitectService } from '@modules/architect-agent';
```

## План упровадження

### Phase 1: Створення структури (Day 1)

- [x] Створити теки `src/modules/` та `src/components/`
- [ ] Оновити документацію (цей ADR)

### Phase 2: Міграція модулів (Day 2-3)

- [ ] Перемістити агенти: `src/agents/*` → `src/modules/*-agent/`
- [ ] Перемістити shared: `src/{api,database,queue,logger,config,integrations,dashboard}` → `src/components/`

### Phase 3: Оновлення конфігурації (Day 3)

- [ ] Оновити `tsconfig.json` paths
- [ ] Оновити Jest config
- [ ] Оновити ESLint config (додати правила для imports)
- [ ] Оновити imports у всьому коді

### Phase 4: Тестування (Day 4)

- [ ] Запустити тести
- [ ] Запустити dev server
- [ ] Перевірити всі функції працюють

### Phase 5: Документація (Day 4-5)

- [ ] Оновити `docs/guides/architecture.md`
- [ ] Оновити `docs/architecture/modules.md`
- [ ] Оновити README.md у кожному модулі
- [ ] Оновити `.github/copilot-instructions.md`

### Rollback plan:

- Git revert усіх комітів міграції
- Повернутися до ADR-018 структури

## Метрики успіху

- ✅ Всі imports між `modules/` видалені або задокументовані як виключення
- ✅ Нові розробники можуть знайти потрібний модуль за < 30 секунд
- ✅ Code review показує 0 порушень архітектурних правил
- ✅ CI/CD pipeline успішно збирає проєкт
- ✅ Всі тести проходять після міграції

## Зв'язки

- **Supersedes:** [ADR-018](archive/018-file-structure-flat-modular.md) — Flat Modular File Structure
- **Related to:** [ADR-009](archive/009-monorepo-structure.md) — Monorepo Structure
- **Related to:** [ADR-001](001-backend-framework-nestjs.md) — Backend Framework (NestJS)
- **Related to:** [ADR-003](003-queue-system-bullmq.md) — Queue System (BullMQ)

## Примітки

### Чому не назвали `shared/` замість `components/`?

Тому що `shared/` вже існує як тека для спільного коду між backend та frontend. `components/` краще відображає що це
технічні компоненти системи.

### Чому агенти перейменовані на `*-agent`?

Щоб відрізняти їх від інших можливих domain modules у майбутньому. Наприклад, якщо з'явиться `modules/analytics/` — це
не агент, а інший домен.

### Що робити якщо не впевнений куди покласти модуль?

**Питання:** Це доменна логіка чи технічна інфраструктура?

- **Доменна логіка** (специфічна для бізнес-вимог) → `modules/`
- **Технічна інфраструктура** (може бути перевикористана) → `components/`

**Приклади:**

- `AuthService` — технічна інфраструктура → `components/auth/`
- `UserManagementService` — доменна логіка → `modules/user-management/`
- `EmailService` — технічна інфраструктура → `components/email/`
- `NotificationAgent` — доменна логіка (AI агент) → `modules/notification-agent/`

## Дата

2026-02-19

## Теги

`architecture` `modules` `domain-driven` `separation-of-concerns` `scalability` `event-driven`
