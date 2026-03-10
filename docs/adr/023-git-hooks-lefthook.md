# ADR-023: Міграція з Husky на Lefthook для Git Hooks

## Статус

Прийнято

## Контекст

У проєкті використовувався Husky для управління Git hooks (див. [ADR-013](archive/013-git-hooks-husky-lint-staged.md)).
З часом
виникли потреби в:

- **Швидшій продуктивності** — Husky написаний на Node.js, що додає overhead
- **Кращій конфігурації** — потреба у більш зручному та структурованому конфігу
- **Parallel execution** — можливість запускати декілька команд паралельно
- **Skip options** — гнучкість у пропуску певних hooks за умов

Розглянуті альтернативи:

- **Lefthook** — швидкий (Go), YAML конфіг, parallel execution
- **simple-git-hooks** — простіший, але менше можливостей
- **pre-commit** (Python) — не Node.js native
- Залишитись на Husky

## Рішення

Мігрувати з **Husky** на **Lefthook** для управління Git hooks.

## Обґрунтування

### Переваги Lefthook над Husky:

#### 1. **Продуктивність (Performance)**

- ⚡ **Написаний на Go** — бінарник, а не Node.js скрипт
- ⚡ **Швидший запуск** — немає Node.js startup overhead
- ⚡ **Паралельне виконання** — hooks можуть запускатись паралельно

**Бенчмарк:**

```
Husky:    ~150ms startup + команди
Lefthook: ~10ms startup + команди
```

Для проєкту з частими комітами це дає значну економію часу.

#### 2. **Зручніший конфіг (YAML)**

**Husky** (Bash скрипти):

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
pnpm type-check
```

**Lefthook** (YAML):

```yaml
pre-commit:
    parallel: true
    commands:
        lint-staged:
            run: npx lint-staged
        type-check:
            run: pnpm type-check
```

✅ Більш читабельний  
✅ Легше налаштувати parallel execution  
✅ Вбудована підтримка skip conditions

#### 3. **Parallel Execution**

Lefthook може запускати команди паралельно:

```yaml
pre-commit:
    parallel: true  # lint-staged і type-check паралельно
    commands:
        lint-staged:
            run: npx lint-staged
        type-check:
            run: pnpm type-check
```

Husky запускає команди послідовно, що повільніше.

#### 4. **Skip Options**

Lefthook має вбудовані skip conditions:

```yaml
pre-push:
    commands:
        test:
            run: pnpm test
            skip:
                - merge    # Не запускати при merge
                - rebase   # Не запускати при rebase
```

У Husky треба писати bash логіку вручну.

#### 5. **Менше конфліктів**

Husky створює `.husky/` директорію, яка може конфліктувати з іншими інструментами.  
Lefthook використовує стандартні `.git/hooks/` з власними wrapper'ами.

### Чому не інші варіанти:

**simple-git-hooks:**

- ❌ Немає parallel execution
- ❌ Менше можливостей для skip conditions
- ✅ Простіший, але занадто простий для наших потреб

**pre-commit (Python):**

- ❌ Потребує Python
- ❌ Не Node.js native
- ❌ Додаткова залежність

**Залишитись на Husky:**

- ❌ Повільніше
- ❌ Bash конфіг менш зручний
- ❌ Немає parallel execution out of the box

### Lefthook у production

Lefthook використовується у великих проєктах:

- ✅ **Shopify** — внутрішні проєкти
- ✅ **GitLab** — для розробки GitLab
- ✅ **Evil Martians** — автори Lefthook
- ✅ **6K+ stars на GitHub**

## Імплементація

### Установка

```bash
# Видалити Husky
pnpm remove husky

# Додати Lefthook
pnpm add -D lefthook

# Оновити package.json
{
  "scripts": {
    "prepare": "lefthook install"  # Замість "husky install"
  }
}
```

### Конфігурація

**Файл:** `lefthook.yml`

```yaml
# Pre-commit hook
pre-commit:
    parallel: false  # lint-staged сам оптимізує
    commands:
        lint-staged:
            glob: "*.{js,jsx,ts,tsx,json,md,prisma,css,scss}"
            run: npx lint-staged

# Commit-msg hook
commit-msg:
    parallel: false
    commands:
        commitlint:
            run: npx commitlint --edit {1}

# Pre-push hook
pre-push:
    parallel: false
    commands:
        type-check:
            run: pnpm type-check
        test:
            run: pnpm test --bail --findRelatedTests
            skip:
                - merge
                - rebase
```

### Міграція

1. ✅ Видалити `.husky/` директорію
2. ✅ Створити `lefthook.yml`
3. ✅ Запустити `lefthook install`
4. ✅ Протестувати hooks

## Додаткові можливості Lefthook

### 1. Scripts

Можна виносити складну логіку у скрипти:

```yaml
pre-commit:
    scripts:
        "validate-branch.sh":
            runner: bash
```

### 2. Environment Variables

```yaml
pre-push:
    commands:
        deploy:
            run: ./deploy.sh
            env:
                ENVIRONMENT: staging
```

### 3. Follow

Показувати output тільки якщо команда failed:

```yaml
pre-commit:
    commands:
        lint:
            run: pnpm lint
            follow: false  # Не показувати output якщо успішно
```

## Наслідки

### Позитивні:

- ✅ **Швидша продуктивність** — менше overhead, паралельне виконання
- ✅ **Кращий DX** — YAML конфіг зручніший за Bash
- ✅ **Більше можливостей** — skip conditions, parallel, scripts
- ✅ **Менша кодова база** — не треба писати Bash логіку
- ✅ **Production-ready** — використовується у великих проєктах

### Негативні:

- ⚠️ **Менша популярність** — Husky популярніший (але Lefthook росте)
- ⚠️ **Більший розмір** — бінарник (~8MB) vs Node.js скрипт (~1MB)
- ⚠️ **Навчання команди** — треба навчитись YAML конфігу (мінімально)

### Нейтральні:

- Команда повинна переустановити hooks (`pnpm install`)
- Конфігурація відрізняється, але проста

## Breaking Changes

### Для розробників:

1. **Після оновлення:**
   ```bash
   # Видалити старі Husky hooks
   rm -rf .husky
   
   # Переустановити залежності
   pnpm install
   ```

2. **Skip hooks (змінений синтаксис):**
   ```bash
   # Husky
   HUSKY=0 git commit -m "message"
   
   # Lefthook
   LEFTHOOK=0 git commit -m "message"
   
   # Або skip конкретний hook
   LEFTHOOK_EXCLUDE=pre-commit git commit -m "message"
   ```

## Моніторинг

Lefthook виводить детальну інформацію про виконання hooks:

```
╭──────────────────────────────────────╮
│ 🥊 lefthook v2.1.0  hook: commit-msg │
╰──────────────────────────────────────╯
┃  commitlint ❯ 
✔️ commitlint (0.68 seconds)

summary: (done in 0.68 seconds)
```

Це допомагає відстежувати продуктивність та проблеми.

## Зв'язок з іншими ADR

- [ADR-013: Git Hooks (Husky + lint-staged)](archive/013-git-hooks-husky-lint-staged.md) — **Superseded** цим ADR
- [ADR-015: Git Workflow and Branching Strategy](015-git-workflow-branching-strategy.md) — використовує hooks для
  валідації

## Примітки

- Lefthook автоматично встановлюється через `pnpm install` (prepare script)
- Конфігурація у `lefthook.yml` — single source of truth
- lint-staged залишається, тільки спосіб виклику змінився
- commitlint працює так само, тільки через Lefthook hook

## Ресурси

- **Lefthook GitHub:** https://github.com/evilmartians/lefthook
- **Документація:** https://github.com/evilmartians/lefthook/blob/master/docs/configuration.md
- **Міграція з Husky:** https://github.com/evilmartians/lefthook/blob/master/docs/migration.md
- **Наш міграційний гайд:** `../MIGRATION_HUSKY_TO_LEFTHOOK.md`
