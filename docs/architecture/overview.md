# Огляд архітектури

**agent-flow-v2** — це асистент для автоматизації розробки ПЗ на базі ШІ-агентів. Система автоматизує процес від аналізу
ідей до розгортання та документації.

## Архітектурний підхід

Система використовує **Flat Modular Architecture with Shared Layer** — розширення класичної Flat Modular Architecture з
явним розділенням на доменні модулі та shared компоненти.

**Детальний опис:** [Architecture Guide](../guides/architecture.md)  
**ADR:
** [ADR-024: Flat Modular Architecture with Shared Layer](../adr/024-flat-modular-architecture-with-shared-layer.md)

### Структура:

```
src/
├── modules/         # Доменні модулі (AI агенти)
│   ├── architect-agent/
│   ├── workflow-agent/
│   ├── code-review-agent/
│   └── documentation-agent/
│
└── components/      # Shared компоненти (технічна інфраструктура)
    ├── api/         # API Gateway
    ├── database/    # Database service
    ├── queue/       # Event Queue
    ├── logger/      # Logging
    ├── config/      # Configuration
    ├── ai-provider/ # AI Provider integration
    ├── github/      # GitHub integration
    └── dashboard/   # Frontend (Next.js)
```

## Основна концепція

Система побудована на взаємодії декількох спеціалізованих агентів, які спілкуються через подійну модель (Event-driven
architecture).

### Domain Modules (бізнес-логіка):

1. **Architect Agent** (`modules/architect-agent/`): Аналізує бесіди та створює структуровані плани.
2. **Workflow Agent** (`modules/workflow-agent/`): Керує життєвим циклом завдань (гілки, мерджі).
3. **Code Review Agent** (`modules/code-review-agent/`): Проводить автоматичне рев'ю коду через ШІ.
4. **Documentation Agent** (`modules/documentation-agent/`): Підтримує документацію в актуальному стані.

### Shared Components (технічна інфраструктура):

1. **API Gateway** (`components/api/`): Центральний вузол для обробки запитів, валідації та маршрутизації.
2. **Dashboard** (`components/dashboard/`): Користувацький інтерфейс на Next.js для управління завданнями та перегляду
   чернеток.
3. **Database Service** (`components/database/`): Prisma + PostgreSQL для збереження даних.
4. **Event Queue** (`components/queue/`): BullMQ для event-driven взаємодії між агентами.
5. **GitHub Integration** (`components/github/`): Робота з репозиторіями.
6. **AI Provider** (`components/ai-provider/`): Взаємодія з LLM (OpenAI, Claude тощо).
7. **Logger** (`components/logger/`): Pino для структурованого логування.
8. **Config** (`components/config/`): Централізована конфігурація.

## Технологічний стек

* **Backend**: NestJS (Fastify), Prisma (PostgreSQL), BullMQ (Redis), Pino (Logging).
* **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons.
* **Monorepo**: pnpm workspaces.

Детальніше про кожен модуль читайте у [modules.md](./modules.md).
