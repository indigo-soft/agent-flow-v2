# Architecture Decision Records (ADR)

Цей каталог містить Architecture Decision Records (ADR) та Architecture Issue Records (AIR) —
документи, що фіксують архітектурні рішення та конфлікти між ними.

**Навігація:**
- 📋 [INDEX.md](INDEX.md) — повний список усіх ADR
- ⚡ [air/README.md](air/README.md) — що таке AIR, список поточних

---

## Що таке ADR?

ADR (Architecture Decision Record) — документ, що фіксує:

- **Яке** архітектурне рішення було прийнято
- **Чому** саме це рішення, а не альтернативи
- **Які** наслідки цього рішення

### Навіщо це потрібно?

✅ **Історія рішень** — через рік пам'ятатимете чому обрали PostgreSQL, а не MongoDB  
✅ **Onboarding** — нові члени команди швидко розуміють архітектуру  
✅ **Уникнення debates** — рішення вже прийняте та задокументоване  
✅ **Context для змін** — коли треба змінити рішення, є контекст для аналізу

### Коли створювати ADR?

Створюйте ADR, коли приймаєте рішення про:

- 🏗️ **Архітектуру** — вибір framework, структура проєкту, патерни
- 🛠️ **Технології** — вибір бази даних, черги повідомлень, логування
- 📐 **Підходи** — Git workflow, testing strategy, deployment
- 🔒 **Обмеження** — security policies, performance requirements
- 🔄 **Зміни** — коли переходите з однієї технології на іншу

### Коли НЕ створювати ADR?

❌ Дрібні імплементаційні деталі (яку бібліотеку для date formatting)  
❌ Очевидні рішення (використовувати TypeScript у TypeScript проєкті)  
❌ Тимчасові workarounds  
❌ Code style (для цього є ESLint config)

---

## Як створити новий ADR

### 1. Визначте наступний номер

```bash
ls docs/adr/*.md | sort | tail -1
# напр.: 030-prompt-caching-strategy.md → наступний 031
```

### 2. Скопіюйте шаблон

```bash
cp docs/adr/templates/TEMPLATE.md docs/adr/031-your-decision-title.md
```

Доступні шаблони у `templates/`:
- `TEMPLATE.md` — повний шаблон з усіма секціями та коментарями
- `TEMPLATE-SHORT.md` — короткий шаблон для простих рішень

### 3. Заповніть секції

- **Статус**: починайте з `Proposed`
- **Контекст**: чому виникло це питання?
- **Рішення**: що конкретно вирішили?
- **Альтернативи**: що ще розглядали і чому відхилили?
- **Обґрунтування**: чому саме це рішення?
- **Наслідки**: що змінюється (позитивне, негативне, нейтральне)?

### 4. Перевірте конфлікти

Чи нове рішення суперечить наявному ADR? Якщо так — спочатку створіть AIR.  
Детальніше: [air/README.md](air/README.md)

### 5. Додайте до індексу

Оновіть таблицю у [INDEX.md](INDEX.md).

---

## Lifecycle ADR

```
Proposed → Accepted → Deprecated → Superseded
           ↓
         Rejected
```

| Статус | Означає |
|--------|---------|
| **Proposed** | Обговорюється, рішення ще не прийняте |
| **Accepted** | Рішення прийняте та діє |
| **Deprecated** | Застаріле, але ще використовується в коді |
| **Superseded** | Замінене іншим ADR (вказати яким) |
| **Rejected** | Відхилено (обов'язково пояснити чому) |

### Переходи статусів

**Proposed → Accepted:** команда погодилась, PR змерджений  
**Accepted → Deprecated:** почалась міграція на нове рішення, старе ще живе в коді  
**Deprecated → Superseded:** міграція завершена, вказати посилання на новий ADR  
**Proposed → Rejected:** вирішили не використовувати, пояснити чому в ADR

---

## Архівування Superseded ADR

Коли ADR отримує статус **Superseded** — він переміщується до `archive/`.

### Процес

1. **Оновити статус в ADR:**
   ```markdown
   ## Статус
   Superseded by [ADR-024](../024-new-decision.md)
   ```

2. **Перемістити файл:**
   ```bash
   mv docs/adr/018-old-decision.md docs/adr/archive/
   ```

3. **Оновити посилання:**
   - В `INDEX.md`: `[018](archive/018-old-decision.md)` + статус `Superseded`
   - В новому ADR, що замінює: `Supersedes: [ADR-018](archive/018-old-decision.md)`

**Примітка:** файли в `archive/` не видаляються — тільки переміщуються. Історія важлива.

---

## Формат назви файлу

```
XXX-short-descriptive-title.md
```

- `XXX` — порядковий номер з leading zeros (001, 002 ... 030, 031)
- `short-descriptive-title` — коротка назва в kebab-case, англійська

**Приклади:**

- ✅ `001-backend-framework-nestjs.md`
- ✅ `030-prompt-caching-strategy.md`
- ❌ `1-backend.md` (немає leading zeros)
- ❌ `ADR-001-Backend.md` (не починається з числа)

---

## Best Practices

### ✅ Добре

- Писати ADR **коли приймаєте** рішення, не після
- Бути чесними про недоліки рішення
- Описувати альтернативи які розглядали
- Використовувати конкретні приклади та дані
- Оновлювати ADR якщо контекст змінюється
- Коротко та зрозуміло (1–3 сторінки)
- Перевіряти конфлікти з наявними ADR → створювати AIR якщо є

### ❌ Погано

- Писати ADR через місяць після прийняття рішення
- Ігнорувати недоліки
- Не описувати альтернативи ("просто обрали X")
- Писати романи на 10 сторінок
- Ігнорувати конфлікти між ADR

---

## Корисні посилання

- [ADR GitHub Org](https://adr.github.io/) — колекція ADR templates
- [ThoughtWorks on ADR](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
- [ADR Tools](https://github.com/npryce/adr-tools) — CLI для управління ADR
