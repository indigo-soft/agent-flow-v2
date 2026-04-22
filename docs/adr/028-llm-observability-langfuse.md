# ADR-028: LLM Observability — Langfuse self-hosted

## Статус

Accepted

## Контекст

ADR-021 визначив поточну observability стратегію: Pino для structured logging, log-based
metrics, Slack alerts. Там явно зазначено: _"❌ Tracing (OpenTelemetry додати пізніше)"_.

З додаванням LLM-агентів виникають принципово нові класи проблем, які Pino-логи
**не здатні** вирішити:

**Клас 1 — Видимість рішень агента.** Агент зробив неправильне ревʼю. Чому? Без trace
кожного LLM-виклику з вхідним промптом, відповіддю та token usage — відповіді немає.

**Клас 2 — Дрейф якості.** Anthropic оновила модель. Architect Agent почав генерувати
менш детальні плани. Як це помітити до того як користувач поскаржиться? Потрібні
автоматичні evaluations на реальному трафіку.

**Клас 3 — Cost control.** Один `while(true)` у агенті або неправильно виставлений
`maxSteps` може за ніч витратити $500. Pino-лог покаже помилку постфактум; потрібен
real-time cost tracking з alertами.

**Клас 4 — Prompt iteration.** При зміні промпту треба порівняти нові відповіді зі
старими. Без centralized prompt registry та evaluation history це ручна робота.

Жоден з цих класів не покривається Pino + grep.

**Вимоги до інструменту:**

| Вимога | Пріоритет |
|--------|-----------|
| Self-hosted (ADR-017, ADR-019) | Обов'язково |
| Open source (MIT / Apache 2.0) | Обов'язково |
| LLM-специфічний tracing (prompt, completion, tokens, cost) | Обов'язково |
| Prompt registry та версіонування | Бажано |
| Evaluations (LLM-as-judge, людська оцінка) | Бажано |
| OpenTelemetry сумісність | Бажано |
| Інтеграція з Vercel AI SDK (ADR-027) | Бажано |

**⚠️ Конфлікт з ADR-017:** Langfuse у стандартному розгортанні використовує
Docker Compose. ADR-017 забороняє Docker. Деталі розв'язання у секції обґрунтування
та в [AIR-001](air-001-langfuse-clickhouse-vs-adr-017.md).

## Рішення

Використовуємо **Langfuse self-hosted** як LLM-observability шар.

Langfuse розгортається **native** (без Docker), паралельно з основним застосунком:

- **Langfuse server** — Node.js процес під PM2
- **PostgreSQL** — вже запущений (спільний інстанс, окрема БД `langfuse_db`)
- **ClickHouse** — нова native-залежність, встановлюється через apt
- **Redis** — вже запущений (спільний інстанс)

**Архітектура:**

```
[ NestJS Agents ] ─── OpenTelemetry ──▶ [ Langfuse Server :3001 ]
                                               │
                                  ┌────────────┴──────────────┐
                                  │                           │
                           [ PostgreSQL ]              [ ClickHouse ]
                        (traces metadata,            (raw events,
                          prompts, users)              fast aggregation)
```

**Інтеграція з Vercel AI SDK (ADR-027):**

```typescript
// src/main.ts або ai-provider.module.ts
import { LangfuseExporter } from 'langfuse-vercel';

// Один рядок — весь трейсинг AI SDK через OpenTelemetry
const langfuseExporter = new LangfuseExporter({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST, // http://localhost:3001
});
```

**Prompt Registry — промпти тягнуться з Langfuse в runtime:**

```typescript
// components/ai-provider/prompts/prompt-registry.service.ts
import { Langfuse } from 'langfuse';

@Injectable()
export class PromptRegistryService {
  private readonly lf = new Langfuse({ /* credentials */ });

  async getSystemPrompt(name: string): Promise<string> {
    const prompt = await this.lf.getPrompt(name);
    return prompt.compile();
  }
}
```

**Нові змінні середовища:**

```env
# Langfuse
LANGFUSE_HOST=http://localhost:3001
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_FLUSH_AT=15
LANGFUSE_FLUSH_INTERVAL=5000
```

**Встановлення пакетів:**

```bash
pnpm add langfuse langfuse-vercel
```

**Розгортання Langfuse (native, без Docker):**

```bash
# 1. ClickHouse (нова залежність)
sudo apt install -y clickhouse-server clickhouse-client
sudo systemctl enable clickhouse-server
sudo systemctl start clickhouse-server

# 2. Langfuse server
git clone https://github.com/langfuse/langfuse.git /home/deploy/langfuse
cd /home/deploy/langfuse && pnpm install

# 3. Міграції
DATABASE_URL="postgresql://user:pass@localhost:5432/langfuse_db" pnpm db:migrate

# 4. PM2 процес (ecosystem.langfuse.config.js)
# name: 'langfuse', port: 3001, env: DATABASE_URL, CLICKHOUSE_URL, REDIS_URL
pm2 start ecosystem.langfuse.config.js
```

## Альтернативи

### Альтернатива 1: LangSmith

**Переваги:**
- ✅ Zero infrastructure — cloud managed

**Недоліки:**
- ❌ $39/користувач/міс, self-host тільки Enterprise
- ❌ Дані агентів і промпти йдуть у хмару (порушення ADR-019)
- ❌ Прив'язаний до LangChain-екосистеми (ми обрали Vercel AI SDK)

**Чому не обрали:** Порушення ADR-019. Кодові ревʼю містять приватний код.

### Альтернатива 2: Helicone (self-hosted)

**Переваги:**
- ✅ MIT-ліцензія, proxy-based (нуль змін у коді)

**Недоліки:**
- ❌ Тільки request/response logging — немає prompt registry і evaluations
- ❌ Proxy додає latency (~5-15ms)
- ❌ Немає OpenTelemetry (немає інтеграції з Vercel AI SDK — ADR-027)

**Чому не обрали:** Недостатня функціональність.

### Альтернатива 3: Phoenix (Arize) self-hosted

**Переваги:**
- ✅ Повністю безкоштовний self-hosted
- ✅ OpenTelemetry native

**Недоліки:**
- ❌ Elastic License 2.0 — обмеження на комерційне використання
- ❌ Слабший prompt registry
- ❌ Фокус на ML/RAG, менш оптимізований для agent tracing

**Чому не обрали:** Langfuse ширший feature set при відкритішій ліцензії.

### Альтернатива 4: Розширення ADR-021 (Pino + custom scripts)

**Переваги:**
- ✅ Нульова нова інфраструктура

**Недоліки:**
- ❌ Треба самостійно будувати cost tracking, prompt versioning, trace visualization
- ❌ Кілька людино-місяців роботи, що конкурують з feature development

**Чому не обрали:** Build vs buy. Langfuse вирішив ці задачі. Нам треба будувати
AI Workflow Assistant, а не observability платформу.

## Обґрунтування

### Чому Langfuse

**1. Self-hosted з відкритою ліцензією.** Apache 2.0 (core) + MIT (SDK). Self-hosted
версія функціонально рівнозначна cloud. Дані залишаються на нашому сервері (ADR-019).

**2. Три функції в одному: tracing + prompt registry + evaluations.** Конкуренти
спеціалізовані — Langfuse покриває всі три без додаткових сервісів.

**3. Native інтеграція з Vercel AI SDK (ADR-027).** Один middleware — трейситься весь
AI SDK автоматично з моделлю, input/output tokens, latency, cost.

**4. Розв'язання конфлікту з ADR-017.** ClickHouse встановлюється через apt як
системний сервіс (аналогічно PostgreSQL). Langfuse server — Node.js під PM2.
Принцип "no Docker" зберігається. Деталі у [AIR-001](air-001-langfuse-clickhouse-vs-adr-017.md).

**5. ADR-021 відклав OpenTelemetry "на пізніше".** Цей ADR реалізує відкладене рішення,
не суперечить йому. Pino залишається для HTTP, queue jobs, DB. Langfuse — виключно
для LLM-специфічного шару.

**6. Retrofitting дорожчий.** Без трейсингу перші тижні з агентами — "чорний ящик".
Langfuse інтегрується за один день.

## Наслідки

### Позитивні

- ✅ Кожен LLM-виклик трасується: prompt, completion, tokens, cost, latency
- ✅ Cost dashboard — витрати per agent, per task, per day
- ✅ Evaluations — автоматичне оцінювання якості відповідей агентів
- ✅ ADR-021 залишається незмінним (Pino + alerts продовжують працювати)

### Негативні

- ⚠️ Нова native-залежність: **ClickHouse** (RAM ~500MB, disk ~1GB empty)
- ⚠️ Ще один PM2 процес (Langfuse server на порту 3001)
- ⚠️ Self-hosted може відставати від cloud щодо нових фіч (зазвичай 1-2 тижні)

### Нейтральні

- ℹ️ Нова секція `LANGFUSE_*` у `.env`
- ℹ️ `docs/guides/requirements.md` оновлюється — ClickHouse як системна залежність

## Метрики успіху

- [ ] 100% LLM-викликів усіх агентів трасуються у Langfuse
- [ ] Cost dashboard показує витрати в розрізі agent та task
- [ ] Evaluations запускаються автоматично для Architect та Code Review агентів

## Зв'язки

- Extends: [ADR-021: Observability Strategy](021-observability-strategy.md) — додає LLM-специфічний шар; Pino + alerts залишаються незмінними
- Partially conflicts: [ADR-017: No Docker](017-no-docker-native-development-production.md) — вирішено native deployment; деталі у [AIR-001](air/done-air-001-langfuse-clickhouse-vs-adr-017.md)
- Depends on: [ADR-027: AI SDK](027-ai-sdk-vercel.md) — Vercel AI SDK надає OpenTelemetry integration
- Related to: [ADR-019: Security Strategy](019-security-strategy.md) — self-hosted = дані не покидають сервер
- Related to: [ADR-030: Prompt Caching Strategy](030-prompt-caching-strategy.md) — Langfuse показує cache hit/miss у трасах
- External docs: [Langfuse docs](https://langfuse.com/docs) · [Self-host guide](https://langfuse.com/docs/deployment/self-host)

## Автори

- @indigo-soft

## Дата

2026-04-18

## Теги

`observability` `llm` `langfuse` `opentelemetry` `tracing` `prompt-registry` `evaluations` `self-hosted`
