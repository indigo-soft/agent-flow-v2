# ADR-030: Prompt Caching Strategy — кешування системних промптів Anthropic API

## Статус

Accepted

## Контекст

LLM-запити агентів мають специфічну структуру: великий незмінний префікс (системний
промпт + приклади) + невеликий змінний суфікс (вхідні дані задачі/бесіди/diff'у).

**Приклад для Code Review Agent:**

```
[системний промпт: ~3000 токенів]  ← незмінний між запитами
[контекст завдання: ~500 токенів]  ← рідко змінюється
[diff коду: ~1000 токенів]         ← змінюється щоразу
```

При 50 code review на місяць **без** кешування:
- 50 × 3500 вхідних токенів = 175 000 токенів
- @ $3 / 1M токенів = **$0.525/міс** тільки за системний промпт

**З** кешуванням:
- Перший запит: cache write = $0.011
- 49 наступних: cache read = $0.052 разом
- **Разом: $0.063/міс** — економія **88%**

**Ключові параметри Anthropic prompt caching (Q2 2026):**

| Параметр | Значення |
|----------|----------|
| Мінімальний розмір для кешування | 1024 токени (Sonnet/Opus) / 2048 (Haiku) |
| Вартість cache write | 1.25× від base input price |
| Вартість cache read | **0.1×** від base input price (-90%) |
| TTL стандартний | 5 хвилин (оновлюється при зверненні) |
| TTL розширений | 1 година (2× від base input price для write) |
| Максимум cache breakpoints | 4 на запит |
| Hit rate при незмінному префіксі | 100% (vs ~50% у OpenAI) |

**Break-even:** кеш окупається з **2-го запиту**.

## Рішення

Реалізуємо **явне prompt caching** через `cache_control: { type: "ephemeral" }` з
**5-хвилинним TTL** і **до 3 cache breakpoints** на запит (від загального до конкретного).

**Стратегія розміщення breakpoints:**

```
[BP1] Системний промпт агента (3000-5000 токенів)
      ↑ Незмінний між запитами — кешується завжди
[BP2] Контекст завдання (назва, тип, ID гілки)
      ↑ Стабільний між повторними ревʼю того ж PR
[BP3] Tool definitions / JSON schema агента
      ↑ Незмінні між запитами
--- Динамічна частина (без breakpoint) ---
     Diff / текст бесіди / конкретний запит
```

**Реалізація у `AiProviderService` (ADR-027):**

```typescript
// components/ai-provider/ai-provider.service.ts
import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Escape hatch до @anthropic-ai/sdk для cache_control на system
// (Vercel AI SDK поки не підтримує cache_control на system-рівні)
async generateStructuredWithCache<T>(params: {
  systemPrompt: string;    // завжди однаковий для агента
  taskContext?: string;    // рідко змінюється
  userMessage: string;     // динамічна частина
  schema: ZodSchema<T>;
}): Promise<T> {

  const client = new Anthropic({ apiKey: this.config.apiKey });

  const response = await client.messages.create({
    model: this.config.model,
    max_tokens: this.config.maxTokens,
    system: [
      {
        type: 'text',
        text: params.systemPrompt,
        cache_control: { type: 'ephemeral' },  // BP1
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          ...(params.taskContext ? [{
            type: 'text' as const,
            text: params.taskContext,
            cache_control: { type: 'ephemeral' } as const,  // BP2
          }] : []),
          {
            type: 'text',
            text: params.userMessage,   // без cache_control — динаміка
          },
        ],
      },
    ],
    tools: [
      {
        name: 'structured_output',
        description: 'Повернути структурований результат',
        input_schema: zodToJsonSchema(params.schema) as Anthropic.Tool['input_schema'],
        cache_control: { type: 'ephemeral' },  // BP3
      },
    ],
    tool_choice: { type: 'tool', name: 'structured_output' },
  });

  // Логуємо cache stats для Langfuse (ADR-028)
  this.logger.log({
    msg: 'LLM call completed',
    cacheReadTokens: response.usage.cache_read_input_tokens,
    cacheWriteTokens: response.usage.cache_creation_input_tokens,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  const toolUse = response.content.find(c => c.type === 'tool_use');
  return params.schema.parse(toolUse?.input);
}
```

**Правила для розробників при написанні промптів:**

```markdown
## Cache-friendly промпти

### Що йде у системний промпт (НЕЗМІННА частина → кешується)
- Опис ролі агента
- Загальні правила та обмеження
- Few-shot приклади форматів входу/виходу

### Що йде у user message (ЗМІННА частина → не кешується)
- Конкретний diff або бесіда
- ID задачі, назва гілки
- Деталі поточного запиту

### Чого НЕ МОЖНА робити
- ❌ Включати дати/timestamps у системний промпт
- ❌ Включати ID задачі у системний промпт
- ❌ Будь-яка змінна інформація до cache breakpoint інвалідує кеш
```

**Перевірка мінімального розміру:**

```typescript
// components/ai-provider/ai-provider.service.ts
const MIN_CACHE_TOKENS = 1024; // Anthropic мінімум для Sonnet/Opus

async loadSystemPrompt(agentName: string): Promise<string> {
  const raw = await fs.readFile(`prompts/${agentName}-system.md`, 'utf-8');
  const tokenCount = await this.tokenizer.countTokens(raw);

  if (tokenCount < MIN_CACHE_TOKENS) {
    this.logger.warn({
      msg: 'System prompt too short for caching — add examples to reach 1024 tokens',
      agentName,
      tokenCount,
      minRequired: MIN_CACHE_TOKENS,
    });
  }
  return raw;
}
```

**Нові змінні середовища (доповнення):**

```env
# Prompt caching
AI_CACHE_TTL=ephemeral          # ephemeral = 5 хвилин (за замовчуванням)
# AI_CACHE_TTL=1h               # 1-годинний TTL (дорожчий write, але для рідкого використання)
```

**Встановлення:**

```bash
pnpm add @anthropic-ai/sdk zod-to-json-schema @anthropic-ai/tokenizer
```

## Альтернативи

### Альтернатива 1: Без кешування (поточний стан)

**Переваги:**
- ✅ Нуль додаткового коду

**Недоліки:**
- ❌ Переплата ~88% за системні промпти при кожному запиті
- ❌ Вища latency (обробка 3000+ токенів кожен раз)

**Чому не обрали:** Break-even — 2 запити. Жодного аргументу "не зараз".

### Альтернатива 2: Redis semantic cache відповідей

**Переваги:**
- ✅ Однакові запити → миттєва відповідь без LLM взагалі

**Недоліки:**
- ❌ Кожен diff унікальний — hit rate → 0 для code review та architect
- ❌ Складна інвалідація при зміні промпту
- ❌ Не те ж саме що prompt caching: Redis кешує відповідь, Anthropic — обробку префіксу

**Чому не обрали:** Не підходить для наших use cases де кожен запит унікальний.

### Альтернатива 3: 1-годинний TTL замість 5-хвилинного

**Переваги:**
- ✅ Вища ймовірність cache hit при нечастому використанні (> 5 хвилин між запитами)

**Недоліки:**
- ❌ Cache write коштує 2× замість 1.25×
- ❌ При активному використанні 5-хвилинний кеш постійно "warm" і дешевший

**Чому не обрали:** На MVP з активними розробниками 5 хвилин достатньо.
Переглянути якщо використання рідше ніж раз на 10 хвилин.

### Альтернатива 4: Implicit caching через Vercel AI SDK

**Переваги:**
- ✅ Немає escape hatch до `@anthropic-ai/sdk`

**Недоліки:**
- ❌ Vercel AI SDK поки не підтримує `cache_control` на system-рівні
- ❌ Implicit caching (якщо з'явиться) — ~50% hit rate vs 100% при явному

**Чому не обрали:** Функціонал відсутній. Перейти на AI SDK коли підтримку додадуть.

## Обґрунтування

### Break-even після 2-го запиту

Перший запит +25% (cache write), кожен наступний -90% (cache read).
При будь-якій реалістичній частоті використання (> 2 запити на місяць) — прибуткове.

### 5-хвилинний TTL самовідновлюється при активному використанні

TTL оновлюється при кожному cache read. У робочий час кеш буде постійно "warm".

### Anthropic дає 100% hit rate при незмінному префіксі

OpenAI кешує автоматично з ~50% hit rate. Anthropic вимагає явного `cache_control`,
але гарантує 100% при незмінному префіксі. Для наших системних промптів (завжди
однакових) явний підхід Anthropic кращий.

### Escape hatch до `@anthropic-ai/sdk` — допустимий виняток

Обмежений одним місцем у коді (`AiProviderService`). Коли Vercel AI SDK додасть
підтримку `cache_control` на system — перехід буде прозорим.

## Наслідки

### Позитивні

- ✅ -85-90% вартості на системних промптах агентів
- ✅ -85% latency на cache read
- ✅ Cache hit/miss видно у Langfuse трасах (ADR-028) через `cache_read_input_tokens`
- ✅ Нуль змін у бізнес-логіці агентів — кешування у `AiProviderService`

### Негативні

- ⚠️ Escape hatch до `@anthropic-ai/sdk` для `cache_control`
- ⚠️ Промпти повинні бути > 1024 токенів (потребує прикладів у коротких промптах)
- ⚠️ Будь-яка змінна інформація у системному промпті інвалідує кеш

### Нейтральні

- ℹ️ `cache_creation_input_tokens` і `cache_read_input_tokens` — нові поля у Prisma model `LlmUsage`
- ℹ️ Додається залежність `@anthropic-ai/tokenizer` для підрахунку токенів перед відправкою
- ℹ️ `zod-to-json-schema` — нова залежність для конвертації Zod схем

## Метрики успіху

- [ ] Cache hit rate > 80% для Code Review та Architect агентів у production
- [ ] Monthly cost < $50 при 200+ LLM-запитах
- [ ] Жоден системний промпт не містить змінних даних (перевіряється code review)
- [ ] Langfuse dashboard показує `cache_read_input_tokens` для всіх агентів

## Зв'язки

- Depends on: [ADR-027: AI SDK](027-ai-sdk-vercel.md) — реалізовано у `AiProviderService` з escape hatch до `@anthropic-ai/sdk`
- Related to: [ADR-028: LLM Observability](028-llm-observability-langfuse.md) — cache hit/miss у Langfuse трасах
- Related to: [ADR-029: Prompt Testing](029-prompt-testing-promptfoo.md) — тести запускаються без кешу для чистоти результатів
- External docs: [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

## Автори

- @indigo-soft

## Дата

2026-04-18

## Теги

`ai` `performance` `cost-optimization` `anthropic` `prompt-caching` `cache` `ai-provider`
