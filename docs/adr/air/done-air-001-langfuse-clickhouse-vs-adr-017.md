# AIR-001: Langfuse self-hosting потребує ClickHouse — нова native-залежність (конфлікт ADR-028 ↔ ADR-017)

## Статус

Resolved

## Зачеплені ADR

| ADR | Назва | Статус після вирішення |
|-----|-------|------------------------|
| [ADR-017](../017-no-docker-native-development-production.md) | Нативна розробка та deployment без Docker | Accepted — **не змінюється** |
| [ADR-028](../028-llm-observability-langfuse.md) | LLM Observability (Langfuse self-hosted) | Accepted — **враховує обмеження** |

## Опис конфлікту

**ADR-017** встановлює принцип: вся розробка та production deployment — native, без Docker.

**ADR-028** обирає Langfuse як LLM observability інструмент. Офіційна документація
Langfuse рекомендує розгортання через Docker Compose. Ця рекомендація — прямий
конфлікт з ADR-017.

Крім того, Langfuse у self-hosted режимі вимагає **ClickHouse** для зберігання подій.
ClickHouse — новий компонент інфраструктури, якого раніше не було у стеку.

**Поточний стек (ADR-017):**
```
PostgreSQL  →  native (системний сервіс)
Redis       →  native (системний сервіс)
Backend     →  Node.js під PM2
Frontend    →  Node.js під PM2
```

**Після ADR-028 (нова залежність):**
```
PostgreSQL   →  native (без змін)
Redis        →  native (без змін)
ClickHouse   →  ⚠️ нова native залежність (apt)
Backend      →  Node.js під PM2 (без змін)
Frontend     →  Node.js під PM2 (без змін)
Langfuse     →  Node.js під PM2 (новий процес)
```

## Оцінка серйозності

**Рівень:** Moderate (не блокуючий)

Конфлікт існує у формі "Langfuse зазвичай розгортається через Docker", а не
"Langfuse неможливо розгорнути без Docker". ClickHouse підтримує native-інсталяцію
через apt на Ubuntu 22.04, тому принцип ADR-017 можна дотримати.

**Що НЕ є конфліктом:** ADR-017 забороняє Docker як runtime для наших застосунків.
Він не забороняє встановлювати нові native-залежності через пакетний менеджер ОС.
ClickHouse як системний сервіс (аналогічно PostgreSQL та Redis) не суперечить ADR-017.

## Альтернативні шляхи розв'язання

### Шлях А: Дозволити Docker лише для Langfuse (exception)

Визнати ADR-017 як "no Docker для основного застосунку" і дозволити Docker для
сторонніх інструментів.

**Переваги:**
- ✅ Простіше розгортання Langfuse (docker-compose up)
- ✅ Офіційно підтримувана конфігурація

**Недоліки:**
- ❌ Порушує ADR-017 як принцип, а не лише як правило
- ❌ Прецедент: після першого виключення з'являться інші
- ❌ Docker-демон на сервері = overhead та security surface

**Статус:** ❌ Відхилено

### Шлях Б: Native ClickHouse + Native Langfuse Server

Встановлюємо ClickHouse через apt, запускаємо Langfuse server як Node.js процес під PM2.

**Переваги:**
- ✅ Повна відповідність принципу ADR-017
- ✅ Узгоджується з тим, як вже запускаємо PostgreSQL та Redis

**Недоліки:**
- ⚠️ Ручне налаштування ClickHouse (не автоматизоване через docker-compose)
- ⚠️ Менш протестована конфігурація Langfuse без Docker

**Статус:** ✅ Прийнято

### Шлях В: Замінити Langfuse на інструмент без ClickHouse

Обрати Helicone або Phoenix (self-hosted), які не потребують ClickHouse.

**Недоліки:**
- ❌ Helicone не має prompt registry та evaluations (критичні функції для нас)
- ❌ Phoenix — Elastic License 2.0 (обмеження комерційного використання)

**Статус:** ❌ Відхилено

### Шлях Г: Відкласти LLM Observability взагалі

Залишитися тільки на Pino logs (ADR-021) і не додавати Langfuse.

**Недоліки:**
- ❌ LLM-специфічні проблеми (cost overrun, quality drift) залишаються у "чорному ящику"
- ❌ ADR-021 явно відклав OpenTelemetry "на пізніше" — цей момент настав

**Статус:** ❌ Відхилено

## Прийняте рішення

**Обраний Шлях Б: Native ClickHouse + Native Langfuse Server.**

ADR-017 **не змінюється** і **не порушується**. ClickHouse встановлюється як
native системний сервіс, Langfuse запускається під PM2.

**Уточнення принципу ADR-017:**

> ADR-017 забороняє Docker як **deployment механізм** для наших застосунків.
> Він не обмежує встановлення нових системних залежностей через пакетний менеджер ОС.
> Нові native-залежності (ClickHouse) встановлюються як системні сервіси (systemd),
> що повністю відповідає духу та букві ADR-017.

**Прецедент для майбутніх AIR:** якщо нова залежність встановлюється native (apt/binary),
вона не суперечить ADR-017. Docker як runtime — окреме питання.

## Наслідки прийнятого рішення

### Для ADR-017

Жодних змін. Принцип "no Docker" залишається чинним. Додається неявне уточнення:
встановлення native системних сервісів через apt дозволено і не суперечить ADR-017.

### Для ADR-028

Документує native deployment процедуру (apt install clickhouse-server) замість
стандартного docker-compose. Деталі в секції "Рішення" ADR-028.

### Для команди

- [ ] Оновити `docs/guides/requirements.md` — ClickHouse у списку системних залежностей
- [ ] Написати `scripts/setup/install-clickhouse.sh`
- [ ] Оновити `docs/guides/deployment.md` — кроки розгортання Langfuse
- [ ] Додати ClickHouse health check у monitoring scripts (ADR-021)

## Пов'язані дії

- [x] Зафіксувати рішення в ADR-028 (секція Обґрунтування)
- [x] Оновити ADR-028: додати `Conflict resolved by: AIR-001`
- [x] Оновити ADR-017: додати `Conflict resolved by: AIR-001` *(pending)*
- [ ] Оновити `docs/guides/requirements.md`
- [ ] Написати `scripts/setup/install-clickhouse.sh`
- [ ] Оновити `docs/guides/deployment.md`

## Дата виявлення

2026-04-18

## Дата вирішення

2026-04-18

## Теги

`architecture-conflict` `langfuse` `clickhouse` `docker` `infrastructure`
