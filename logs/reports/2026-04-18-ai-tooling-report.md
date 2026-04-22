# AI Tooling Analysis — agent-flow-v2

**Дата:** 2026-04-18
**Автор:** Аналіз підготовлено спільно з Claude
**Статус:** Proposed (для обговорення та подальшого розбиття на ADR/issues)

## Контекст

Проєкт **agent-flow-v2** — це система з чотирма ШІ-агентами (Architect, Workflow, Code Review, Documentation), які взаємодіють через event-driven архітектуру. Ядро — компонент `components/ai-provider/`, який поки не реалізований.

**Мета звіту:** систематично проаналізувати сучасну AI-екосистему (станом на Q2 2026) і визначити, що з пакетів, практик, конфігурацій та технологій варто впровадити, що відкласти, а що тримати в полі зору як потенційні покращення.

**Обмеження, які я враховував:**
- Стек зафіксований: NestJS, Prisma, BullMQ, Next.js, pnpm (ADR-001, ADR-024)
- Self-hosted, без third-party managed сервісів (ADR-017, ADR-019)
- TypeScript-only, без Python-залежностей
- MVP-стадія: 1–2 розробники, оптимізація на швидкість доставлення + безпеку даних

---

## Аналіз екосистеми

### 1. AI SDK / абстракція провайдера

Найважливіше рішення після вибору провайдера — **який шар абстракції** використати для взаємодії з LLM. Прямий Anthropic SDK — це мінімум, але він змушує писати власні ретраї, структуровані виходи, стрімінг, fallback-логіку.

**Ключові варіанти у 2026:**

| Інструмент                                          | Плюси                                                                                                                                                                  | Мінуси для нашого кейсу                                                             |
|-----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| **Vercel AI SDK 6** (`ai`)                          | TS-first, 20M+ завантажень на місяць, Agent abstraction у v6, вбудований tool calling, streaming, Zod-схеми, стандартний провайдер для Anthropic (`@ai-sdk/anthropic`) | Зав'язаний на React-екосистему для фронтенду, але бекенд-частина працює окремо      |
| Anthropic SDK напряму (`@anthropic-ai/sdk`)         | Нуль абстракцій, повний контроль, офіційна підтримка                                                                                                                   | Треба самому писати retry/backoff, tool loop, structured outputs, провайдер-фолбеки |
| LangChain JS                                        | Найбагатша екосистема, LangGraph для складних workflow                                                                                                                 | 101 KB bundle, python-ported API, більше boilerplate, overkill для нашого обсягу    |
| Mastra                                              | Сучасний TS-native, workflow-first                                                                                                                                     | Молодий (0.x), малий ком'юніті, ризиковано як ядро                                  |
| Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Офіційний SDK для агентів, вбудовані structured outputs, управління контекстом                                                                                         | Оптимізований під autonomous agents, менш гнучкий для нашої event-driven моделі     |

**Рекомендація:** **Vercel AI SDK** як основний шар абстракції у `components/ai-provider/`. Причини:
1. Провайдер-агностичний — зміна моделі — це зміна одного рядка
2. Native `generateObject` з Zod для structured outputs (це точно те, що нам треба для Architect Agent, який повертає структуровані плани)
3. Вбудований tool loop — критично для Code Review Agent
4. TypeScript-first, працює без React (у бекенді лише `ai` + `@ai-sdk/anthropic`)

### 2. Prompt caching — найбільший ROI

Prompt caching від Anthropic дає **-90% на cached input tokens** і -85% latency. Для нашого кейсу це критично, бо:
- Architect Agent має довгий системний промпт з прикладами структурованих планів
- Code Review Agent передає контекст завдання + diff — контекст стабільний, diff змінюється
- Documentation Agent працює з repeatable templates

**Мінімальний розмір блоку кешу:** 1024 токени для Sonnet/Opus, 2048 для Haiku. Системні промпти агентів точно будуть такої довжини, якщо включити приклади.

**Два режими:** 5-хвилинний кеш (+25% при записі) і 1-годинний (+100% при записі). Для нас 5-хвилинного вистачить — у робочий час агенти будуть активні постійно, кеш буде "warm".

### 3. Structured Outputs — обов'язково для агентів

Anthropic API тепер підтримує structured outputs нативно через `output_config` + JSON Schema, або через tool-based approach з `tool_choice`. У TS-стеку це означає **Zod-схеми → JSON Schema → гарантований типобезпечний вихід**.

Це не опція — це базова вимога для нашої системи. Інакше Architect Agent повертатиме текст, який треба парсити регулярками, і це буде дуже крихко.

### 4. Observability — без цього production неможливий

ШІ-системи мають три унікальні проблеми, які звичайний моніторинг не бачить:
1. **Дрейф якості** — промпт може почати генерувати гірші результати після оновлення моделі
2. **Вартість** — один bad agent loop може з'їсти $500 за ніч
3. **Дебагінг** — неможливо зрозуміти, чому агент прийняв рішення X без trace'у всіх проміжних кроків

**Варіанти:**

| Інструмент      | Ліцензія         | Self-host                                     | Ціна cloud                          |
|-----------------|------------------|-----------------------------------------------|-------------------------------------|
| **Langfuse**    | MIT / Apache 2.0 | ✅ Docker-compose, повністю працює self-hosted | Free tier 50k events, потім $50/міс |
| LangSmith       | Проприетарна     | Тільки Enterprise                             | $39/користувач/міс                  |
| Helicone        | MIT, proxy-based | ✅                                             | Free 10k req, потім $79/міс         |
| Phoenix (Arize) | Elastic 2.0      | ✅                                             | Тільки self-host, безкоштовно       |
| Braintrust      | Проприетарна     | ❌                                             | Платний                             |

**Рекомендація:** **Langfuse self-hosted**. Причини:
1. Узгоджується з ADR-017 (no Docker, self-hosted), хоча сам Langfuse зазвичай розгортається у Docker — це можна обійти native deployment компонентів PostgreSQL + ClickHouse
2. OpenTelemetry-сумісний, інтегрується з Pino (наш logger)
3. Одночасно observability + prompt management + evaluations (три в одному, не треба окремо збирати)
4. Vercel AI SDK має native Langfuse integration через OpenTelemetry

### 5. Prompt testing — Promptfoo

`promptfoo` — це "Jest для промптів". OpenAI придбав проєкт у березні 2026, MIT-ліцензія зберігається. Для test-driven підходу до промптів це зараз **de-facto standard**.

**Що дає:**
- YAML-конфіги з прикладами, assertions, rubrics
- CI/CD інтеграція — падіння якості промпту блокує merge
- Matrix-порівняння: один промпт × декілька моделей × декілька test cases
- LLM-as-judge для суб'єктивних оцінок

Для нашого кейсу критично мати тести для Architect Agent (структура плану) і Code Review Agent (точність виявлення багів).

### 6. Token counting та cost budgeting

Без активного tracking токенів легко спалити бюджет. `@anthropic-ai/tokenizer` дає точний підрахунок до відправки запиту. Це дозволяє:
- Відхиляти задачі, які перевищать контекстне вікно
- Per-user / per-task бюджети
- Попереджати про дорогі запити

### 7. Agent Skills (.claude/skills, SKILL.md)

Anthropic у жовтні 2025 запустили **Agent Skills** — стандарт для portable instructions + scripts + templates у форматі папок з `SKILL.md` файлом. Працює у Claude.ai, Claude Code, API, Agent SDK.

Для **нашого кейсу** skills важливі двома способами:
1. **Як споживач**: у нашому репо можна мати `.claude/skills/` з нашими domain skills (code-style, testing-practices, adversarial-review) для розробників, які користуються Claude Code
2. **Як виробник**: наші агенти потенційно могли б бути впаковані як skills для зовнішніх клієнтів — але це R&D напрямок, не для MVP

### 8. Anthropic Code Review — зовнішнє рішення

У березні 2026 Anthropic запустила власний multi-agent PR reviewer у Claude Code для Teams/Enterprise ($15-25 за ревʼю). Це прямий конкурент нашому Code Review Agent.

**Висновок:** це не проблема, а інформація. Наша диференціація:
- Повний self-hosted контроль (у них дані йдуть у хмару)
- Інтеграція з нашим workflow (Kanban → гілки → PR → мердж, єдиний цикл)
- Наш агент не просто ревʼю — він частина більшого event-driven потоку

### 9. Prompt injection та guardrails

Для self-hosted MVP з 1–2 користувачами це низький ризик. Але архітектурно варто закласти:
- System prompts зберігаються окремо, ніколи не конкатенуються з user input
- Тексти бесід перед відправкою проходять базову sanitization (control characters, надмірна довжина)
- Output verification для Code Review Agent (не дозволяти ШІ "схвалювати" PR на основі injection у коментарях у коді)

Бібліотеки типу **LLM Guard**, **Prompt Armor**, **Lakera** — це питання майбутнього, коли з'являться зовнішні користувачі.

### 10. pgvector та RAG

У нас є PostgreSQL — значить pgvector "безкоштовний" (одна extension). Це відкриває RAG-сценарії:
- Architect Agent шукає схожі минулі завдання перед формуванням плану
- Code Review Agent шукає схожі попередні ревʼю для consistent feedback
- Documentation Agent знаходить пов'язані розділи документації

**Але**: це майбутнє, не зараз. Без RAG MVP працює, з RAG — стає розумнішим на дистанції.

---

## Списки рекомендацій

### ✅ Корисно зараз (впровадити у складі MVP)

| #  | Пункт                                                                                                                | Чому                                                                                                          | Орієнтовні зусилля                                         |
|----|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| 1  | **Vercel AI SDK** як ядро `components/ai-provider/` (`ai` + `@ai-sdk/anthropic`)                                     | Стандарт індустрії, TS-first, провайдер-агностичний, structured outputs, tool loop, streaming — усе з коробки | 2-3 дні інтеграції                                         |
| 2  | **Zod-схеми для всіх LLM-відповідей** у `components/ai-provider/dtos.ts`                                             | Без типобезпеки відповіді агентів будуть крихкими; це базова вимога                                           | 1 день                                                     |
| 3  | **Anthropic prompt caching** з дня 0 (cache_control на системних промптах агентів)                                   | -90% cost, -85% latency. Критично для Architect та Code Review агентів з довгими системними промптами         | 0.5 дня                                                    |
| 4  | **Promptfoo** як test framework для промптів, інтеграція у pre-push hook (Lefthook)                                  | Test-driven prompts, узгоджується з ADR-013/023. Запобігає регресіям якості при зміні промптів                | 1-2 дні початкової конфігурації + тести для кожного агента |
| 5  | **Langfuse self-hosted** для observability, prompt management, evaluations                                           | Self-hosted (ADR-019), повністю покриває потреби у трасуванні агентів, запобігає "black box" проблемі         | 1 день розгортання + інтеграція з Pino                     |
| 6  | **`@anthropic-ai/tokenizer`** для pre-request token counting                                                         | Запобігає перевитратам, контекстне вікно, per-task бюджети                                                    | 0.5 дня                                                    |
| 7  | **Prompt-файли окремо від коду** (`src/modules/{agent}/prompts/*.md` або `.hbs`)                                     | Версіонування, легке редагування без ребілду, інтеграція з Langfuse Prompt Registry пізніше                   | 1 день + рефакторинг перших агентів                        |
| 8  | **Retry з exponential backoff** (`p-retry`) обгортка навколо LLM-запитів у `ai-provider.service.ts`                  | Anthropic/OpenAI періодично повертають 429/529. Без ретраїв 1 помилка = поломка всього завдання               | 0.5 дня                                                    |
| 9  | **Cost tracking у БД** (Prisma model `LlmUsage` з полями: agent, model, input/cached/output tokens, cost, timestamp) | Прозорість витрат, alerts при аномаліях, per-agent бюджети                                                    | 1 день                                                     |
| 10 | **`CLAUDE.md` у root проєкту** — конфігурація для розробників, які використовують Claude Code/Cursor                 | Узгоджена поведінка всіх AI-tools для команди, мінімум часу на "навчання" кожного інструмента                 | 0.5 дня                                                    |
| 11 | **JSON Schema + `output_config`** (native Anthropic structured outputs) замість ручного парсингу                     | Гарантія валідного JSON, менше логіки парсингу, менше помилок                                                 | Якщо AI SDK використовується — він це робить під капотом   |
| 12 | **Env-валідація через Joi/Zod** зі специфічною перевіркою AI_PROVIDER_API_KEY формату (починається з `sk-ant-`)      | Запобігає типовим помилкам деплою, швидкий fail на старті                                                     | 0.5 дня                                                    |
| 13 | **Secrets encryption at rest** для збережених API ключів (ADR-019 вже це описує, треба реалізувати)                  | ADR-019 вимагає; без цього — порушення власного рішення                                                       | 1 день                                                     |
| 14 | **`temperature: 0` + `seed`** для Code Review Agent для детермінізму                                                 | Без цього одні і ті ж коміти отримують різні ревʼю — невідтворюваний debug                                    | 0 днів (просто конфіг)                                     |

**Загалом на базову AI-інфраструктуру: ~10–14 днів роботи одного розробника.**

---

### 🔮 Майбутнє (відкласти, але тримати в полі зору)

| #  | Пункт                                                                                                 | Коли повернутися                                                                                   | Чому не зараз                                           |
|----|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| 1  | **pgvector** для semantic search по минулих завданнях/ревʼю                                           | Коли набереться 100+ завершених завдань і з'явиться реальна потреба                                | MVP працює без RAG; передчасна оптимізація              |
| 2  | **Embedding generation** (OpenAI `text-embedding-3-small` або Anthropic, коли вони випустять)         | Разом з pgvector                                                                                   | Без vector store не має сенсу                           |
| 3  | **MCP Server** для експорту наших агентів назовні (щоб Claude Code міг викликати наш Architect Agent) | Коли будуть зовнішні користувачі або інтеграція з сторонніми IDE                                   | Зараз немає консументів; це точка росту, не MVP         |
| 4  | **LLM Guard / Prompt Armor** для input sanitization                                                   | Коли будуть зовнішні (не-trusted) користувачі                                                      | Self-hosted MVP = користувачі довірені                  |
| 5  | **Mastra** як альтернатива Vercel AI SDK                                                              | Якщо AI SDK виявиться надто низькорівневим для наших workflows                                     | Поки AI SDK v6 покриває наші кейси                      |
| 6  | **LangGraph / workflow DSL** для складних багатокрокових агентних графів                              | Коли прості послідовності викликів перестануть вистачати (наприклад, reflexion-loop у Code Review) | Наші workflow поки лінійні, event-driven через BullMQ   |
| 7  | **Anthropic Batch API (-50%)** для Documentation Agent                                                | Коли Documentation Agent виконуватиметься асинхронно раз на день/тиждень                           | Поки він викликається подієво, batch не застосовний     |
| 8  | **Multi-provider fallback** (Anthropic → OpenAI → Gemini)                                             | Коли SLA стане критичним                                                                           | Для 1-2 користувачів downtime 1h/місяць допустимий      |
| 9  | **DSPy-style automatic prompt optimization**                                                          | Коли збереться dataset з 500+ оцінених прикладів                                                   | Без даних optimizer працювати не зможе                  |
| 10 | **Fine-tuning / prompt distillation** (переведення простих задач на Haiku з fine-tuned промптом)      | Коли token cost перевищить $500/міс                                                                | Економія не виправдовує складність на малому обсязі     |
| 11 | **Model routing** (простi задачі → Haiku, складні → Opus)                                             | Коли будуть конкретні метрики якості на різних моделях                                             | Без evals неможливо прийняти обґрунтоване рішення       |
| 12 | **SigNoz / OpenTelemetry повна інтеграція** LLM-трейсів з APM                                         | Коли моніторинг стане складнішим за те, що покриває Langfuse                                       | Langfuse покриває LLM-специфіку, APM потрібен для решти |
| 13 | **Anthropic Agent Skills** для експорту наших агентів                                                 | Коли з'явиться public API/маркетплейс                                                              | Скіли — це portable layer для зовнішнього world         |
| 14 | **Red-teaming** через Promptfoo (vulnerability scanning)                                              | Перед будь-яким публічним релізом                                                                  | Для внутрішнього tool з 2 користувачами надмірно        |
| 15 | **Human-in-the-loop approval UI** у Dashboard перед виконанням destructive операцій агента            | Коли агенти отримають доступ до production-систем                                                  | Зараз вони працюють через PR, людина завжди merge'ить   |

---

### 🎁 Забаганки (nice-to-have, без них дискомфорту немає)

| #  | Пункт                                                                                                                 | Чим покращить досвід                                                                                        |
|----|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| 1  | **Anthropic Claude GitHub App** (нативний `@claude review` на PR)                                                     | Дублював би нашого Code Review Agent для порівняння — сировинний baseline проти нашого налаштованого агента |
| 2  | **Langfuse Playground** у development environment                                                                     | Швидка ітерація промптів без перезапуску сервера; "live prompt tuning"                                      |
| 3  | **CLI для локального запуску агентів** (`pnpm agent architect --draft path/to/conversation.md`)                       | Можна дебажити окремих агентів поза повним NestJS-стеком                                                    |
| 4  | **Streaming responses у Dashboard** (WebSocket + Vercel AI SDK `useChat`) замість request/response                    | UX: користувач бачить план у процесі генерації, а не через 15 секунд                                        |
| 5  | **Prompt diffs у PR** (коли змінюється файл `prompts/*.md`, CI автоматично прогоняє Promptfoo і коментує розбіжності) | Видимість впливу зміни промпту на якість                                                                    |
| 6  | **Agent "explain yourself" endpoint** — агент повертає не лише рішення, а й reasoning chain                           | Для debug та довіри до рішень агента                                                                        |
| 7  | **Prompt caching hit-rate dashboard** у Langfuse                                                                      | Видимість, чи кеш реально працює (може виявитись, що ми періодично інвалідуємо префікс)                     |
| 8  | **Dev-only model: Haiku для всіх агентів у dev environment**                                                          | Економія при розробці — Haiku у 3× дешевший за Sonnet, якість на debug-задачах прийнятна                    |
| 9  | **Slack-інтеграція Architect Agent** — пересилати бесіди зі Slack, отримувати чернетки плану назад                    | Знижує тертя для початкового use case (структуризація обговорень)                                           |
| 10 | **Automatic CHANGELOG entries від Documentation Agent** при merge PR (з LLM-generated summary на основі commits)      | Автоматизація того, що ADR-025 вже частково вирішує через release-it                                        |
| 11 | **Prompt Registry UI** у Dashboard (адмін може редагувати промпти без комміту)                                        | Non-developer stakeholders можуть адаптувати поведінку агентів                                              |
| 12 | **"Adversarial review" skill** — агент, що атакує план іншого агента, шукаючи слабкі місця                            | Методологія "red team" для самоперевірки системи                                                            |
| 13 | **Prometheus-метрики** для LLM-викликів (latency p50/p95/p99, error rate) паралельно з Langfuse                       | Стандартний dashboard у Grafana, єдине місце для всіх метрик                                                |
| 14 | **Session replay** у Langfuse для відтворення повного контексту падіння агента                                        | Дебагінг стає на порядок простішим                                                                          |
| 15 | **Per-user cost quotas** у Dashboard                                                                                  | Видимість витрат, disclosure для стейкхолдерів                                                              |

---

## План упровадження

### Фаза 1: Фундамент (1–2 тижні)
Пункти 1–6, 8, 11–14 з "Корисно зараз". Результат: що працює `components/ai-provider/` з базовим observability та caching.

### Фаза 2: Перший агент (1–2 тижні)
Architect Agent на новій інфраструктурі, з promptfoo-тестами, Langfuse трасуванням, структурованими виходами.

### Фаза 3: Інструментування (1 тиждень)
Пункти 7, 9, 10. Cost tracking, prompt registry, CLAUDE.md для команди.

### Фаза 4: Scale-out (далі)
Решта агентів на тій же інфраструктурі. Перехід до майбутніх пунктів за фактичною потребою.

---

## Метрики успіху

- [ ] `components/ai-provider/` покритий Promptfoo-тестами для всіх агентів (baseline >80% pass rate)
- [ ] Cost per task < $0.10 для Architect, < $0.50 для Code Review (без caching — було б у 5× більше)
- [ ] p95 latency для Architect Agent < 8с (з caching)
- [ ] 100% LLM-викликів трасуються у Langfuse
- [ ] Zero hardcoded промптів у коді — усі винесені у `prompts/*.md`
- [ ] Monthly LLM cost < $50 на MVP-етапі (1-2 користувачі)

---

## Зв'язки

- Related to: ADR-017 (no Docker — треба адаптувати Langfuse setup до native)
- Related to: ADR-019 (Security Strategy — encryption API ключів обов'язкова)
- Related to: ADR-021 (Observability Strategy — Langfuse доповнює, не замінює Pino/інші)
- Related to: ADR-024 (Flat Modular Architecture — `ai-provider` як shared component)
- Depends on: вибір провайдера (попередньо Anthropic Claude, див. попереднє обговорення)

## Наступні кроки

1. Обговорити звіт і визначити, які пункти зі списку "Корисно зараз" ідуть у Phase 1 розробки AI-компонента
2. Створити окремі ADR для найважливіших архітектурних рішень:
   - ADR-027: AI SDK Choice (Vercel AI SDK)
   - ADR-028: LLM Observability (Langfuse self-hosted)
   - ADR-029: Prompt Testing (Promptfoo)
   - ADR-030: Prompt Caching Strategy
3. Створити GitHub Issues для кожного пункту "Корисно зараз"
4. Заповнити `.env.example` детальними AI-specific полями (модель, температура, max_tokens, cache_ttl)

## Відкриті питання

- Чи варто заразу закласти абстракцію для multi-provider, або починати з Anthropic-only і рефакторити при потребі?
- Який SLA потрібен для Code Review Agent? Це впливає на рішення щодо fallback-провайдера
- Де фізично розгортати Langfuse? Той же сервер, що й основний додаток, чи окремий?
- Чи варто експериментувати з Opus 4.7 для Architect Agent (вищa якість) або триматися Sonnet 4.6 (кращий cost/quality для MVP)?

---

*Звіт базується на стані AI-екосистеми станом на квітень 2026. Інструменти й моделі еволюціонують швидко — перегляньте пункти "Майбутнє" та "Забаганки" через 3–6 місяців.*
