# ADR-029: Prompt Testing — Promptfoo як test framework для промптів

## Статус

Accepted

## Контекст

Промпти агентів — це бізнес-логіка, записана природньою мовою. Зміна промпту — це
фактично зміна коду, яка впливає на поведінку системи. Однак без системного підходу:

1. Промпти змінюються без тестів ("здається, так краще")
2. Регресії виявляються лише в production
3. Порівняти "старий промпт vs новий" неможливо систематично
4. Один і той самий промпт може давати різні результати на різних моделях

**Конкретна проблема для agent-flow-v2:**

- Architect Agent: змінили формулювання у системному промпті → план перестав
  включати підзадачі → всі нові завдання без acceptance criteria → помічено через
  тиждень у production
- Code Review Agent: "розмили" інструкцію → агент почав давати APPROVED на код
  з очевидними SQL injection → виявили вручну через 3 дні

Без автоматизованих тестів промптів обидва сценарії гарантовано повторяться.

**Вимоги:**

- CLI-first, інтегрується у Lefthook (ADR-023) та GitHub Actions
- YAML/JSON-конфіг (version-controlled разом з промптами)
- Multi-model: порівняти claude-sonnet-4-6 vs claude-haiku-4-5 на тих самих тестах
- LLM-as-judge для суб'єктивних перевірок (не лише regex)
- MIT-ліцензія (OpenAI придбав проєкт у березні 2026, MIT зберігається)

## Рішення

Використовуємо **Promptfoo** для тестування промптів агентів.

**Структура тестів:**

```
src/modules/
├── architect-agent/
│   ├── prompts/
│   │   └── architect-system.md
│   └── evals/
│       ├── promptfooconfig.yaml
│       └── test-cases/
│           ├── simple-feature.txt
│           └── complex-refactor.txt
├── code-review-agent/
│   └── evals/
│       └── promptfooconfig.yaml
└── documentation-agent/
    └── evals/
        └── promptfooconfig.yaml
```

**Приклад конфігурації для Architect Agent:**

```yaml
# src/modules/architect-agent/evals/promptfooconfig.yaml
description: Architect Agent eval suite

prompts:
  - file://../../prompts/architect-system.md

providers:
  - id: anthropic:claude-sonnet-4-6
    config:
      temperature: 0
  - id: anthropic:claude-haiku-4-5-20251001
    config:
      temperature: 0

tests:
  - description: Проста задача на нову фічу
    vars:
      conversation: file://test-cases/simple-feature.txt
    assert:
      - type: javascript
        value: output => {
          const obj = JSON.parse(output);
          return obj.epics?.length > 0 && obj.title?.length > 0;
        }
      - type: contains-json
      - type: llm-rubric
        value: |
          План повинен:
          1. Містити хоча б один епік
          2. Кожна задача мати критерії готовності (acceptanceCriteria)
          3. Бути логічно структурованим

  - description: Складний рефакторинг — чи враховуються ризики
    vars:
      conversation: file://test-cases/complex-refactor.txt
    assert:
      - type: llm-rubric
        value: |
          План рефакторингу повинен:
          1. Мати задачу на написання тестів перед рефакторингом
          2. Врахувати ризик регресій
          3. Запропонувати поступовий підхід (не "переписати все")
      - type: cost
        threshold: 0.05

  - description: Негативний сценарій — неструктурований текст
    vars:
      conversation: "Треба щось покращити у системі. Не знаю що."
    assert:
      - type: llm-rubric
        value: Агент повинен запросити уточнення або визначити конкретні напрямки, а не генерувати порожній план
```

**Приклад для Code Review Agent:**

```yaml
# src/modules/code-review-agent/evals/promptfooconfig.yaml
description: Code Review Agent eval suite

prompts:
  - file://../../prompts/code-review-system.md

providers:
  - id: anthropic:claude-sonnet-4-6
    config:
      temperature: 0

tests:
  - description: SQL Injection — повинен знайти і позначити REQUEST_CHANGES
    vars:
      diff: file://test-cases/sql-injection.diff
      task: "Додати пошук по імені користувача"
    assert:
      - type: contains
        value: "REQUEST_CHANGES"
      - type: not-contains
        value: "APPROVED"
      - type: llm-rubric
        value: Відповідь повинна явно вказати на SQL injection вразливість

  - description: Чистий код — повинен дати APPROVED
    vars:
      diff: file://test-cases/clean-feature.diff
      task: "Додати endpoint для отримання профілю користувача"
    assert:
      - type: contains
        value: "APPROVED"
```

**Скрипт запуску (package.json):**

```json
{
  "scripts": {
    "eval:architect": "promptfoo eval -c src/modules/architect-agent/evals/promptfooconfig.yaml",
    "eval:code-review": "promptfoo eval -c src/modules/code-review-agent/evals/promptfooconfig.yaml",
    "eval:all": "promptfoo eval -c src/modules/*/evals/promptfooconfig.yaml",
    "eval:view": "promptfoo view"
  }
}
```

**Інтеграція з Lefthook (ADR-023):**

```yaml
# lefthook.yml (доповнення до pre-push)
pre-push:
  commands:
    eval-changed-prompts:
      run: |
        CHANGED=$(git diff --name-only origin/main...HEAD | grep 'prompts/' | head -1)
        if [ -n "$CHANGED" ]; then
          echo "Промпти змінились, запускаємо evals..."
          pnpm eval:all --ci
        fi
```

**GitHub Actions (CI):**

```yaml
# .github/workflows/eval.yml
name: Prompt Evals
on:
  pull_request:
    paths:
      - 'src/**/prompts/**'
      - 'src/**/evals/**'
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm eval:all --ci
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Встановлення:**

```bash
pnpm add -D promptfoo
```

## Альтернативи

### Альтернатива 1: Ручне тестування (поточний підхід)

**Переваги:**
- ✅ Нуль нових залежностей

**Недоліки:**
- ❌ Регресії виявляються в production
- ❌ Не масштабується при 4+ агентах
- ❌ 4 агенти × 5 тест-кейсів = 20 ручних перевірок на кожну зміну промпту

**Чому не обрали:** Технічний борг що накопичується разом з кількістю промптів.

### Альтернатива 2: Jest з мок-відповідями

**Переваги:**
- ✅ Вже є у стеку (ADR-005)

**Недоліки:**
- ❌ Мок-відповіді ≠ реальна поведінка моделі
- ❌ Не виявляє регресії при оновленні моделі
- ❌ LLM-as-judge неможливий

**Чому не обрали:** Jest з моками тестує парсинг відповіді, не якість самої відповіді.
Обидва рівні тестування потрібні, вони не взаємозамінні.

### Альтернатива 3: Braintrust

**Переваги:**
- ✅ Продуманий evaluation workflow
- ✅ Автоматичне блокування деплою при регресії

**Недоліки:**
- ❌ Хмарний managed сервіс (ADR-019)
- ❌ Self-host не підтримується

**Чому не обрали:** Порушення ADR-019.

### Альтернатива 4: Langfuse Evaluations (ADR-028)

**Переваги:**
- ✅ Вже є у стеку

**Недоліки:**
- ❌ Evaluations — постфактум на production-трафіку
- ❌ Немає pre-deployment тестування і блокування PR
- ❌ Немає multi-model matrix-порівняння

**Чому не обрали:** Langfuse evals і Promptfoo вирішують різні задачі.
Langfuse — production monitoring, Promptfoo — pre-deployment regression testing.
Обидва потрібні, не взаємозамінні.

## Обґрунтування

### Promptfoo як "Jest для промптів"

Test-driven підхід вже закріплений: Jest для unit тестів, Lefthook для pre-push.
Promptfoo логічно розширює цю практику на промпти.

### Multi-model порівняння — конкретна практична цінність

```bash
promptfoo eval --providers anthropic:claude-sonnet-4-6,anthropic:claude-haiku-4-5-20251001
```

Матриця результатів покаже де Haiku справляється (дешевше) і де Sonnet необхідний.

### Детерміновані + LLM-as-judge assertions

| Тип перевірки | Приклад | Вартість |
|---|---|---|
| `contains` | відповідь містить "REQUEST_CHANGES" | $0 |
| `javascript` | валідний JSON з обовʼязковими полями | $0 |
| `cost` | запит коштує < $0.05 | $0 |
| `llm-rubric` | "план логічно структурований" | ~$0.01 |

Детерміновані assertions — безкоштовні, швидкі, запускаються завжди.
LLM-as-judge — тільки там де потрібна суб'єктивна оцінка.

## Наслідки

### Позитивні

- ✅ Регресії промптів виявляються у pre-push, а не в production
- ✅ PR з промптами автоматично запускає evals (GitHub Actions)
- ✅ Тест-кейси — жива документація очікуваної поведінки агентів
- ✅ Data-driven вибір моделі (Sonnet vs Haiku) замість інтуїції

### Негативні

- ⚠️ Кожен запуск eval витрачає реальні токени (~$0.10-0.50 за повний suite)
- ⚠️ При зміні промпту pre-push hook сповільнює процес на 1-3 хвилини
- ⚠️ Першочергове написання тест-кейсів займає час (~0.5 дня на агента)

### Нейтральні

- ℹ️ Команда вивчає YAML-формат `promptfooconfig.yaml`
- ℹ️ Токени для evals у CI — окрема стаття витрат (рекомендується Haiku для eval-суддів)

## Метрики успіху

- [ ] Eval suite існує для кожного з 4 агентів, мінімум 5 тест-кейсів кожен
- [ ] Pass rate > 90% для baseline (поточна версія промпту)
- [ ] PR з промптами не може бути змержений без зеленого eval CI
- [ ] Виявлено хоча б одну регресію промпту до production за перший місяць

## Зв'язки

- Related to: [ADR-023: Git Hooks (Lefthook)](023-git-hooks-lefthook.md) — Promptfoo інтегрується у pre-push hook
- Related to: [ADR-027: AI SDK](027-ai-sdk-vercel.md) — тестуємо промпти, які використовує ai-provider
- Related to: [ADR-028: LLM Observability](028-llm-observability-langfuse.md) — різні шари: Promptfoo (pre-deploy) + Langfuse (production)
- Related to: [ADR-030: Prompt Caching Strategy](030-prompt-caching-strategy.md) — тести запускаються без кешу для чистоти
- External docs: [Promptfoo docs](https://www.promptfoo.dev/docs) · [Promptfoo GitHub](https://github.com/promptfoo/promptfoo)

## Автори

- @indigo-soft

## Дата

2026-04-18

## Теги

`testing` `prompts` `promptfoo` `llm-evaluation` `regression` `ci-cd` `quality`
