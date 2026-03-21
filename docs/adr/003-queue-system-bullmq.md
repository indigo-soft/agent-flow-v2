# ADR-003: Використання BullMQ для черг повідомлень

## Статус

Прийнято

## Контекст

Проєкт базується на event-driven архітектурі, де агенти слухають події з черги та обробляють їх.

Ключові події:

- "Робота над завданням розпочата"
- "Зробити рев'ю"
- "Продовжити рев'ю"
- "Повторне рев'ю"
- "Завдання виконано"
- "Оновити документацію"

Вимоги до черги:

- Гарантоване доставляння повідомлень
- Retry mechanism при помилках
- Dead Letter Queue для failed jobs
- Можливість приоритизації
- Моніторинг стану черги

Розглянуті альтернативи:

- **Redis Streams** — нативний Redis механізм
- **BullMQ** — спеціалізована бібліотека для черг на Redis
- **RabbitMQ** — окремий message broker
- **Kafka** — distributed streaming platform

## Рішення

Використовуємо **BullMQ** для черг повідомлень.

## Обґрунтування

### Переваги BullMQ:

1. **Вбудовані можливості**
    - ✅ Автоматичний retry з exponential backoff
    - ✅ Dead Letter Queue з коробки
    - ✅ Job priorities
    - ✅ Delayed jobs
    - ✅ Rate limiting
    - ✅ Job progress tracking

2. **Інтеграція з NestJS**
    - Офіційний пакет `@nestjs/bull`
    - Декларативні процесори через `@Processor()` та `@Process()`
    - Dependency Injection працює у процесорах

3. **Базується на Redis**
    - Не потрібен окремий брокер повідомлень
    - Redis вже використовується для кешування
    - Простіший deployment

4. **Моніторинг**
    - Bull Board — готовий UI для моніторингу черг
    - Metrics для Prometheus
    - Events для всіх стадій job lifecycle

5. **Reliability**
    - Гарантована обробка (at-least-once delivery)
    - Persisted jobs (зберігаються у Redis)
    - Graceful shutdown

6. **Developer Experience**
    - Чудова документація
    - TypeScript підтримка
    - Активна спільнота

### Чому не інші варіанти:

**Redis Streams:**

- ❌ Немає вбудованого retry mechanism
- ❌ Немає вбудованого DLQ
- ❌ Треба самому імплементувати багато функціональності
- ✅ Нижчий overhead (але для нашого випадку не критично)

**RabbitMQ:**

- ❌ Окремий сервіс (ускладнює deployment)
- ❌ Більша складність налаштування
- ❌ Overkill для наших потреб
- ✅ Більше можливостей для складних routing scenarios (не потрібно)

**Kafka:**

- ❌ Надто складний для MVP
- ❌ Розрахований на high-throughput streaming (не наш case)
- ❌ Складний deployment та maintenance
- ✅ Horizontal scaling (не потрібно для MVP)

## Наслідки

### Позитивні:

- Швидка розробка (не треба писати retry/DLQ логіку)
- Надійна обробка подій
- Простий моніторинг через Bull Board
- Легко тестувати (jobs можна обробляти синхронно у тестах)

### Негативні:

- Залежність від Redis (але він вже використовується)
- Single point of failure (Redis), але можна використати Redis Sentinel/Cluster

### Нейтральні:

- Треба налаштувати Redis persistence для гарантії збереження jobs

## Структура черг

```typescript
// Окрема черга для кожного агента
queues: 
  - workflow-events    // Workflow Agent
  - code-review-events // Code Review Agent
  - documentation-events // Documentation Agent
```

## Приклад коду

```typescript
// workflow-agent.module.ts
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'workflow-events',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Зберігаємо останні 100 успішних
        removeOnFail: 500,     // Зберігаємо останні 500 failed для аналізу
      },
    }),
  ],
  providers: [WorkflowProcessor],
})
export class WorkflowAgentModule {}

// workflow. processor.ts
@Processor('workflow-events')
export class WorkflowProcessor {
  @Process('task-started')
  async handleTaskStarted(job: Job) {
    // Автоматичний retry при throw Error
    // Автоматичний DLQ після вичерпання attempts
  }
}
```

## Примітки

- Використовуємо BullMQ v4. x (найновіша стабільна)
- Налаштовуємо Redis persistence (AOF або RDB)
- Додаємо Bull Board для monitoring на `/admin/queues`
