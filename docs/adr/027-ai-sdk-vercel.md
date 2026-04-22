# ADR-027: AI SDK — Vercel AI SDK як єдиний шар абстракції над LLM

## Статус

Accepted

## Контекст

Компонент `components/ai-provider/` — центральний вузол, через який усі чотири агенти
(Architect, Workflow, Code Review, Documentation) взаємодіють з LLM-провайдером.

Вибір SDK на цьому рівні — фундаментальне архітектурне рішення. Неправильний вибір
тягне за собою переписування всіх агентів при зміні провайдера, ручну реалізацію
retry/backoff/streaming/tool calling і відсутність type-safety у відповідях моделі.

**Конкретні вимоги до шару абстракції:**

- Підтримка Anthropic Claude (пріоритет) та OpenAI (фолбек / майбутнє)
- Структуровані відповіді з Zod-схемами (критично для Architect Agent — повертає ієрархію завдань)
- Tool calling / function calling (критично для Code Review Agent)
- Streaming для Dashboard UX
- TypeScript-first, нуль `any`
- Сумісність з NestJS (не прив'язаний до React runtime)
- Активна підтримка, велике ком'юніті

**Стан екосистеми (Q2 2026):**

| SDK | Завантажень/тиждень | Stars | Підхід |
|-----|-------------------|-------|--------|
| `@anthropic-ai/sdk` | 8M+ | 3k | Прямий, один провайдер |
| `ai` (Vercel AI SDK) | 20M+ | 21k | Абстракція, 25+ провайдерів |
| `langchain` | 1.3M | 16.7k | Framework, рівень вище |
| `@anthropic-ai/claude-agent-sdk` | — | — | Autonomous agents |
| `@mastra/core` | ~50k | 7k+ | TS-native, workflow-first |

## Рішення

Використовуємо **Vercel AI SDK v6** (`ai` + `@ai-sdk/anthropic`) як єдиний шар
абстракції у `components/ai-provider/`.

```
components/ai-provider/
├── ai-provider.module.ts
├── ai-provider.service.ts      # generateText, generateObject, streamText
├── ai-provider.config.ts       # провайдер, модель, параметри
├── schemas/                    # Zod-схеми структурованих відповідей
│   ├── plan-draft.schema.ts
│   ├── task-hierarchy.schema.ts
│   └── code-review.schema.ts
├── prompts/                    # промпти як окремі файли (ADR-030)
│   ├── architect-system.md
│   ├── code-review-system.md
│   └── documentation-system.md
├── ai-provider.service.spec.ts
└── index.ts
```

**Конфігурація:**

```typescript
// components/ai-provider/ai-provider.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiProviderConfig {
  constructor(private readonly config: ConfigService) {}

  get apiKey(): string {
    return this.config.getOrThrow<string>('AI_PROVIDER_API_KEY');
  }

  get model(): string {
    return this.config.get<string>('AI_MODEL', 'claude-sonnet-4-6');
  }

  get maxTokens(): number {
    return this.config.get<number>('AI_MAX_TOKENS', 8192);
  }

  get temperature(): number {
    return this.config.get<number>('AI_TEMPERATURE', 0);
  }
}
```

**Основний сервіс:**

```typescript
// components/ai-provider/ai-provider.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText } from 'ai';
import { ZodSchema } from 'zod';
import { AiProviderConfig } from './ai-provider.config';

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private readonly model;

  constructor(private readonly config: AiProviderConfig) {
    const anthropic = createAnthropic({ apiKey: this.config.apiKey });
    this.model = anthropic(this.config.model);
  }

  /**
   * Генерує структурований вихід, тип гарантований Zod-схемою.
   * Використовується Architect Agent та Code Review Agent.
   */
  async generateStructured<T>(params: {
    system: string;
    prompt: string;
    schema: ZodSchema<T>;
    schemaName?: string;
  }): Promise<T> {
    const { object } = await generateObject({
      model: this.model,
      system: params.system,
      prompt: params.prompt,
      schema: params.schema,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });

    this.logger.log({ msg: 'LLM structured output generated', schema: params.schemaName });
    return object;
  }

  /**
   * Генерує довільний текст.
   * Використовується Documentation Agent.
   */
  async generate(params: {
    system: string;
    prompt: string;
    temperature?: number;
  }): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: params.system,
      prompt: params.prompt,
      maxTokens: this.config.maxTokens,
      temperature: params.temperature ?? this.config.temperature,
    });
    return text;
  }
}
```

**Приклад Zod-схеми для Architect Agent:**

```typescript
// components/ai-provider/schemas/plan-draft.schema.ts
import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string().describe('Назва задачі'),
  description: z.string().describe('Детальний опис'),
  acceptanceCriteria: z.array(z.string()).describe('Критерії готовності'),
});

export const EpicSchema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(TaskSchema),
});

export const PlanDraftSchema = z.object({
  title: z.string().describe('Стислий заголовок плану'),
  summary: z.string().describe('Короткий опис ключових рішень'),
  epics: z.array(EpicSchema),
});

export type PlanDraft = z.infer<typeof PlanDraftSchema>;
```

**Нові змінні середовища (доповнення до `.env.example`):**

```env
# AI Provider
AI_PROVIDER_API_KEY=sk-ant-...           # Anthropic API key
AI_MODEL=claude-sonnet-4-6               # Production модель
AI_MAX_TOKENS=8192
AI_TEMPERATURE=0                         # 0 = детермінізм для code review

# Dev override (дешевша модель для розробки)
# AI_MODEL=claude-haiku-4-5-20251001
```

**Встановлення:**

```bash
pnpm add ai @ai-sdk/anthropic zod
```

## Альтернативи

### Альтернатива 1: `@anthropic-ai/sdk` напряму

**Переваги:**
- ✅ Zero abstractions — повний контроль
- ✅ Офіційна підтримка Anthropic, нові функції з'являються першими
- ✅ Найменший bundle

**Недоліки:**
- ❌ Зміна провайдера = переписування всіх агентів
- ❌ Structured outputs треба реалізовувати вручну через tool-based trick
- ❌ Retry/backoff — самостійна реалізація

**Чому не обрали:** Vendor lock-in на рівні коду усіх агентів. При потребі failover або
зміни провайдера доведеться рефакторити 4 модулі.

### Альтернатива 2: LangChain JS (`langchain` + `@langchain/anthropic`)

**Переваги:**
- ✅ Найбагатша екосистема (LangSmith, LangGraph, 90M downloads)
- ✅ Зрілі абстракції для RAG, vector stores

**Недоліки:**
- ❌ 101 KB gzipped bundle, не підтримує edge runtime
- ❌ Python-ported API — нетипові TypeScript патерни
- ❌ Overkill: BullMQ вже виконує роль orchestratora
- ❌ Вимагає LangSmith для повноцінного дебагінгу (конфлікт з ADR-028 де обрали Langfuse)

**Чому не обрали:** Надмірна складність для нашої event-driven архітектури.

### Альтернатива 3: `@anthropic-ai/claude-agent-sdk`

**Переваги:**
- ✅ Офіційний SDK Anthropic для агентів
- ✅ Structured outputs нативно з Zod

**Недоліки:**
- ❌ Оптимізований під autonomous loops; наші агенти запускаються з BullMQ-подій
- ❌ SDK управляє своїм циклом, що конфліктує з нашим event-driven design
- ❌ Нещодавній, менше виробничого досвіду

**Чому не обрали:** SDK дублює orchestration, яку BullMQ вже виконує.

### Альтернатива 4: Mastra

**Переваги:**
- ✅ TypeScript-native (не Python-порт)
- ✅ Workflow-first, близько до нашої event-driven моделі

**Недоліки:**
- ❌ Версія 0.x — нестабільний API
- ❌ Мале ком'юніті (~50k downloads), ризиковано як ядро MVP
- ❌ Mastra Cloud у beta, SOC 2 відсутній

**Чому не обрали:** Занадто рано. Переглянути якщо досягне 1.0 зі стабільним API.

## Обґрунтування

### 1. Провайдер-агностичність із нульовими змінами коду агентів

При зміні провайдера достатньо замінити `createAnthropic` на `createOpenAI` у
`ai-provider.config.ts`. Усі 4 агенти не змінюються.

### 2. `generateObject` + Zod — перша вимога системи

Architect Agent повертає ієрархічну структуру. Без `generateObject` — ручний парсинг:

```typescript
// До: крихко
const response = await anthropic.messages.create({ ... });
const json = JSON.parse(response.content[0].text); // може кинути SyntaxError
const plan = PlanDraftSchema.parse(json);           // може кинути ZodError

// Після: атомарно і типізовано
const { object: plan } = await generateObject({
  schema: PlanDraftSchema, // TypeScript знає тип plan на compile time
  ...
});
```

### 3. 20M+ downloads / тиждень — зрілість у production

Thomson Reuters побудував CoCounsel для 1300+ бухгалтерських фірм. Clay — Claygent
(AI web research agent at scale). Не experimental інструмент.

### 4. Native Langfuse інтеграція через OpenTelemetry

Vercel AI SDK 6 підтримує OpenTelemetry instrumentation. Langfuse (ADR-028) приймає
ці traces без додаткового коду.

### 5. NestJS-сумісність

`ai` core та `@ai-sdk/anthropic` не мають React-залежностей. Бекенд-функції
(`generateText`, `generateObject`, `streamText`) працюють у будь-якому Node.js runtime.

## Наслідки

### Позитивні

- ✅ Зміна провайдера — 1 рядок у конфігурації
- ✅ Structured outputs з compile-time типізацією через Zod
- ✅ Streaming готовий до підключення у Dashboard (Next.js `useChat`) без зміни бекенду
- ✅ AI SDK → Langfuse → OpenTelemetry — безшовний трейсінг (ADR-028)

### Негативні

- ⚠️ Нові Anthropic-фічі можуть з'являтися в офіційному SDK на 1-7 днів раніше ніж в адаптері
- ⚠️ Функції специфічні для Anthropic (Extended Thinking, cache_control на system) можуть вимагати escape hatch до `@anthropic-ai/sdk`

### Нейтральні

- ℹ️ Команда вивчає Vercel AI SDK API замість прямого Anthropic SDK
- ℹ️ `zod` стає виробничою залежністю (уніфікувати підхід з `class-validator` у DTO)

## Метрики успіху

- [ ] Нуль прямих імпортів `@anthropic-ai/sdk` у `modules/` — тільки через `AiProviderService`
- [ ] Zod-схема існує для кожного типу структурованого виходу агента
- [ ] Зміна `AI_MODEL` у `.env` перемикає модель для всіх агентів без змін у коді

## Зв'язки

- Related to: [ADR-024: Flat Modular Architecture](024-flat-modular-architecture-with-shared-layer.md) — `ai-provider` є shared component
- Related to: [ADR-028: LLM Observability](028-llm-observability-langfuse.md) — Langfuse інтегрується через OpenTelemetry middleware AI SDK
- Related to: [ADR-030: Prompt Caching Strategy](030-prompt-caching-strategy.md) — caching конфігурується на рівні провайдера у цьому SDK
- External docs: [Vercel AI SDK](https://ai-sdk.dev) · [AI SDK 6 release](https://vercel.com/blog/ai-sdk-6)

## Автори

- @indigo-soft

## Дата

2026-04-18

## Теги

`ai` `sdk` `anthropic` `vercel-ai-sdk` `structured-outputs` `zod` `tool-calling` `ai-provider`
