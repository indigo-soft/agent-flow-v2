# ADR-006: Використання Pino для logging

## Статус

Прийнято

## Контекст

Проєкт потребує системи логування для:

- HTTP requests/responses
- Помилки у агентах
- Події у чергах (job started, completed, failed)
- Інтеграції з зовнішніми API (GitHub, AI Provider)
- Debug інформації під час розробки

Вимоги:

- Structured logging (JSON формат)
- Різні рівні логування (debug, info, warn, error)
- Log rotation для production
- Низький overhead (не сповільнювати додаток)
- TypeScript підтримка

Розглянуті альтернативи:

- **Pino** — найшвидший JSON logger для Node.js
- **Winston** — найпопулярніший logger
- **Bunyan** — structured logger
- Зберігання у PostgreSQL/Redis

## Рішення

Використовуємо **Pino** для logging з file-based підходом.

## Обґрунтування

### Переваги Pino:

1. **Performance**
    - Найшвидший серед Node.js loggers (benchmarks)
    - Асинхронний за замовчуванням
    - Мінімальний overhead (~1-2% CPU)

2. **Structured logging**
    - JSON формат з коробки
    - Легко парсити для аналізу
    - Стандартизовані поля

3. **Інтеграція з NestJS**
    - Офіційний пакет `nestjs-pino`
    - Автоматичне логування HTTP requests
    - Dependency injection

4. **Інтеграція з Fastify**
    - Native Fastify logger (Pino)
    - Zero configuration

5. **Child loggers**
    - Контекстні логи (per-request, per-module)
    - Автоматичне додавання metadata

6. **Pretty printing**
    - `pino-pretty` для читабельних логів у development
    - JSON для production

7. **Log rotation**
    - `pino-roll` або `logrotate` для ротації файлів
    - Автоматичне видалення старих логів

### Чому не інші варіанти:

**Winston:**

- ❌ Повільніший за Pino (2-3x у benchmarks)
- ❌ Більш складна конфігурація
- ✅ Більше transports (але нам не потрібно)
- ✅ Більша спільнота (але Pino теж популярний)

**Bunyan:**

- ❌ Не такий активний розвиток
- ❌ Повільніший за Pino
- ✅ Схожий підхід (structured JSON)

**PostgreSQL/Redis для логів:**

- ❌ Погана performance (БД не для логів)
- ❌ Швидке розростання таблиць
- ❌ Складність очищення
- ❌ Single point of failure

## Наслідки

### Позитивні:

- Мінімальний вплив на performance
- Structured logs легко аналізувати
- Простота інтеграції з NestJS + Fastify
- Готовність до інтеграції з централізованими системами (Loki, ELK)

### Негативні:

- JSON логи важко читати без pretty printer
- Треба налаштовувати log rotation

### Нейтральні:

- Логи зберігаються у файлах (для production можна додати Loki/ELK)

## Конфігурація

### Development

```typescript
// main.ts (development)
import {Logger} from 'nestjs-pino';

const app = await NestFactory.create(AppModule, {
    logger: false, // Вимикаємо стандартний logger
});

app.useLogger(app.get(Logger));

// app.module.ts
@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                transport: {
                    target: 'pino-pretty', // Readable logs
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss',
                        ignore: 'pid,hostname',
                    },
                },
                level: 'debug',
            },
        }),
    ],
})
```

### Production

```typescript
// app.module.ts (production)
@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                level: 'info',
                formatters: {
                    level: (label) => {
                        return {level: label};
                    },
                },
                redact: {
                    paths: ['req.headers.authorization', 'req.body.password'],
                    remove: true,
                },
            },
        }),
    ],
})
```

## Log levels

- **debug:** Детальна інформація для debugging
- **info:** Загальні події (task started, PR created)
- **warn:** Попередження (retry attempt, deprecation)
- **error:** Помилки (job failed, API error)
- **fatal:** Критичні помилки (database connection lost)

## Структура логів

```json
{
  "level": "info",
  "time": 1705747200000,
  "pid": 12345,
  "hostname": "api-server",
  "req": {
    "id": "req-123",
    "method": "POST",
    "url": "/tasks/abc/status"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 45,
  "msg": "request completed",
  "module": "WorkflowAgent",
  "taskId": "task-abc",
  "event": "task-started"
}
```

## Log rotation

```bash
# logrotate config for production
/var/log/app/*. log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  missingok
  create 0644 app app
}
```

## Майбутні покращення

Коли проєкт виросте:

- Інтеграція з **Grafana Loki** для централізованих логів
- Metrics через **Prometheus** + Pino metrics
- Error tracking через **Sentry**

## Примітки

- Використовуємо `pino` v8. x
- Використовуємо `nestjs-pino` v3.x
- У production логи пишемо у `/var/log/app/`
- Log rotation налаштовується через `logrotate`
