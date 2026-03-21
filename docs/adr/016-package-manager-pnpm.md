# ADR-016: Використання pnpm як package manager

## Статус

Accepted

## Контекст

Проєкт є monorepo з кількома застосунками (backend, frontend) та shared packages. Потрібен package manager для:

- Встановлення та управління залежностями
- Управління workspaces у monorepo
- Запуску скриптів у різних packages
- Lock файлів для reproducible builds

Вимоги:

- Підтримка workspaces (monorepo)
- Швидка установка залежностей
- Ефективне використання диска
- Deterministic installs (lock file)
- Хороша підтримка у CI/CD
- Безпека (уникнення phantom dependencies)

Розглянуті альтернативи:

- **npm** — стандартний package manager для Node.js
- **Yarn Classic** (v1) — популярна альтернатива npm
- **Yarn Berry** (v2+) — сучасна версія Yarn з Plug'n'Play
- **pnpm** — швидкий та ефективний package manager
- **Bun** — новий runtime з вбудованим package manager

## Рішення

Використовуємо **pnpm** (v8+) як package manager для всього monorepo.

## Обґрунтування

### Переваги pnpm:

1. **Швидкість**
    - **До 2x швидше** за npm та Yarn Classic
    - Паралельна установка пакетів
    - Incremental installs (тільки змінені packages)

   Benchmark (приблизно):
   ```
   npm install:      45s
   Yarn Classic:    35s
   pnpm install:     20s
   ```

2. **Ефективність диска**
    - **Content-addressable storage** — один пакет зберігається один раз на диску
    - Symlinks замість копіювання файлів
    - **Економія ~30-50% місця** порівняно з npm/Yarn

   Приклад:
   ```
   npm:    3 проєкти × 200MB = 600MB
   pnpm:   3 проєкти → 250MB (shared store)
   ```

3. **Strict mode (безпека)**
    - Уникає **phantom dependencies** (коли ви використовуєте пакет не вказаний у dependencies)
    - Flat `node_modules` тільки для declared dependencies
    - Більш передбачувана поведінка

   ```json
   // package.json
   {
     "dependencies": {
       "express": "^4.0.0"
       // lodash НЕ в dependencies
     }
   }
   ```

   ```typescript
   // npm/Yarn:  працює (lodash є transitive dependency express)
   import _ from 'lodash'; // ✅ працює але НЕ повинно
   
   // pnpm: помилка (правильно!)
   import _ from 'lodash'; // ❌ Module not found
   ```

4. **Workspaces (monorepo)**
    - Вбудована підтримка workspaces
    - `pnpm -r` (recursive) для запуску команд у всіх packages
    - `pnpm --filter` для вибіркового запуску
    - Proper hoisting для shared dependencies

   ```bash
   # Встановити у конкретний package
   pnpm add axios --filter backend
   
   # Запустити скрипт у всіх packages
   pnpm -r build
   
   # Запустити тільки у зміненому коді
   pnpm --filter=... HEAD build
   ```

5. **Lock file (`pnpm-lock.yaml`)**
    - Deterministic installs
    - Менший розмір ніж `package-lock.json`
    - Швидший parse

6. **Сумісність**
    - Працює з усіма npm packages
    - Підтримує `.npmrc` конфігурацію
    - Integrates з усіма CI/CD системами

7. **Активний розвиток**
    - Регулярні оновлення
    - Велика спільнота
    - Використовується у великих проєктах (Vue. js, Vite, Prisma)

### Чому не інші варіанти:

**npm (v9+):**

- ❌ Повільніший за pnpm
- ❌ Менш ефективне використання диска
- ❌ Phantom dependencies можливі
- ✅ Вбудований у Node.js (не треба окремо встановлювати)
- ✅ Найбільша сумісність (стандарт)

**Вердикт:** npm чудовий для простих проєктів, але для monorepo pnpm кращий.

**Yarn Classic (v1):**

- ❌ Deprecated (більше не розвивається активно)
- ❌ Повільніший за pnpm
- ❌ Phantom dependencies можливі
- ✅ Добре знайомий багатьом розробникам

**Вердикт:** Застарілий, краще використати pnpm або Yarn Berry.

**Yarn Berry (v2+, v3, v4):**

- ❌ Plug'n'Play (PnP) режим складний для налаштування
- ❌ Не всі пакети сумісні з PnP
- ❌ Велика крива навчання
- ❌ `.yarn/cache` та `.pnp. cjs` у git (опціонально, але рекомендовано)
- ✅ Дуже швидкий з PnP
- ✅ Сучасний

**Вердикт:** Потужний але overcomplicated для нашого MVP. pnpm дає 80% переваг з 20% складності.

**Bun:**

- ❌ Дуже новий (перша стабільна версія 2023)
- ❌ Менша екосистема
- ❌ Можливі проблеми сумісності
- ❌ Менше матеріалів/troubleshooting
- ✅ Найшвидший (Zig-based)
- ✅ Повний runtime (не тільки package manager)

**Вердикт:** Перспективний, але занадто ризиковано для production. Переглянемо через 1-2 роки.

## Наслідки

### Позитивні:

- ✅ Швидші installs (економія часу розробників та CI/CD)
- ✅ Менше використання диска (важливо для CI runners)
- ✅ Більш безпечні dependency trees (strict mode)
- ✅ Чудова підтримка monorepo
- ✅ Сучасний та активно розвивається

### Негативні:

- ⚠️ Розробники повинні встановити pnpm (`npm install -g pnpm`)
- ⚠️ Команди трохи відрізняються від npm (але схожі)
- ⚠️ У деяких edge cases може бути несумісність (рідко)

### Нейтральні:

- ℹ️ Lock file називається `pnpm-lock.yaml` (не `package-lock.json`)
- ℹ️ Команда повинна навчитись pnpm (але це швидко)
- ℹ️ CI/CD конфігурація потребує setup pnpm

## Конфігурація

### `.npmrc` (root)

```ini
# Використовувати strict mode (рекомендовано)
# Тільки declared dependencies доступні
auto-install-peers = false
strict-peer-dependencies = false

# Shamefully hoist (якщо щось не працює)
# Вимкніть strict mode для проблемних пакетів
# shamefully-hoist=true

# Public registry
registry = https://registry.npmjs.org/

# Save exact versions
save-exact = true

# Engine strict (вимагає правильну версію Node.js)
engine-strict = true
```

### `pnpm-workspace.yaml` (root)

```yaml
packages:
    # Apps
    - 'apps/*'
    # Shared packages
    - 'packages/*'
```

### `package.json` (root)

```json
{
    "name": "ai-workflow-assistant",
    "private": true,
    "engines": {
        "node": ">=20.0.0",
        "pnpm": ">=8.0.0"
    },
    "packageManager": "pnpm@8.15.0",
    "scripts": {
        "preinstall": "npx only-allow pnpm"
    }
}
```

**Пояснення:**

- `engines. pnpm` — вимагає pnpm 8+
- `packageManager` — Corepack використає цю версію
- `preinstall` — блокує `npm install` та `yarn install`

### Встановлення pnpm

**Варіант 1: npm (глобально)**

```bash
npm install -g pnpm
```

**Варіант 2: Corepack (рекомендовано для Node 16. 13+)**

```bash
corepack enable
corepack prepare pnpm@8.15.0 --activate
```

**Варіант 3: Standalone script**

```bash
curl -fsSL https://get.pnpm.io/install. sh | sh -
```

## Приклади команд

### Базові операції

```bash
# Install всіх dependencies
pnpm install

# Додати dependency
pnpm add <package>

# Додати dev dependency
pnpm add -D <package>

# Додати до workspace root
pnpm add -w <package>

# Видалити dependency
pnpm remove <package>

# Update dependencies
pnpm update
```

### Workspaces

```bash
# Встановити у конкретний package
pnpm add axios --filter backend
pnpm add react --filter dashboard

# Запустити скрипт у всіх packages
pnpm -r build      # recursive
pnpm -r test
pnpm -r lint

# Запустити у конкретному package
pnpm --filter backend dev
pnpm --filter dashboard build

# Запустити паралельно
pnpm -r --parallel dev

# Запустити тільки у зміненому коді (для CI)
pnpm --filter=...HEAD build
```

### Інше

```bash
# Очистити все (кеш + node_modules)
pnpm store prune

# Перевірити outdated packages
pnpm outdated

# Чому цей пакет встановлено? 
pnpm why <package>

# Patch package (якщо потрібно виправити bug)
pnpm patch <package>
```

## Migration з npm/Yarn

### Крок 1: Встановити pnpm

```bash
npm install -g pnpm
```

### Крок 2: Імпортувати lock file

```bash
# pnpm автоматично конвертує package-lock.json або yarn.lock
pnpm install
```

### Крок 3: Видалити старі файли

```bash
rm package-lock.json  # або yarn.lock
rm -rf node_modules
```

### Крок 4: Створити pnpm-workspace. yaml

```yaml
packages:
    - 'apps/*'
    - 'packages/*'
```

### Крок 5: Додати . npmrc (опціонально)

```ini
auto-install-peers = false
```

### Крок 6: Оновити CI/CD

Приклад для GitHub Actions:

```yaml
-   uses: pnpm/action-setup@v2
    with:
        version: 8

-   uses: actions/setup-node@v4
    with:
        node-version: '20'
        cache: 'pnpm'

-   run: pnpm install
-   run: pnpm test
```

## CI/CD Integration

### GitHub Actions

```yaml
name: CI

on: [ push, pull_request ]

jobs:
    test:
        runs-on: ubuntu-latest

        steps:
            -   uses: actions/checkout@v4

            -   uses: pnpm/action-setup@v2
                with:
                    version: 8

            -   uses: actions/setup-node@v4
                with:
                    node-version: '20'
                    cache: 'pnpm'

            -   name: Install dependencies
                run: pnpm install --frozen-lockfile

            -   name: Run tests
                run: pnpm test
```

### Docker

```dockerfile
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package. json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY .  .

# Build
RUN pnpm --filter backend build

CMD ["pnpm", "--filter", "backend", "start: prod"]
```

## Troubleshooting

### Проблема: Phantom dependency error

```
ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  No package. json found in ... 
```

**Рішення:** Додайте пакет у `dependencies`:

```bash
pnpm add <missing-package>
```

### Проблема: Peer dependency warning

```
WARN  Issues with peer dependencies found
```

**Рішення 1:** Встановіть peer dependency:

```bash
pnpm add <peer-dependency>
```

**Рішення 2:** Додайте у `.npmrc`:

```ini
auto-install-peers = true
```

### Проблема: Повільна установка

```bash
# Очистити кеш
pnpm store prune

# Спробувати знову
pnpm install
```

## Метрики успіху

- ✅ Install час < 30s для full install
- ✅ Install час < 5s для incremental install
- ✅ Disk usage на 30%+ менше ніж npm
- ✅ Немає phantom dependency bugs у production

## Майбутні покращення

- [ ] Налаштувати local `.pnpm-store` для Docker builds (швидше)
- [ ] Експериментувати з `pnpm deploy` для production builds
- [ ] Розглянути `pnpm catalog` для shared dependency versions (pnpm v9+)

## Зв'язки

- Related to: [ADR-009:  Monorepo Structure](archive/009-monorepo-structure.md)
- Related to: [ADR-013: Git Hooks](archive/013-git-hooks-husky-lint-staged.md) — використовує pnpm у скриптах

## Примітки

### Чому саме pnpm v8?

- **v7** — stable але старіша
- **v8** — current stable (2023-2024), рекомендована ✅
- **v9** — beta/experimental (нові функції, але може бути нестабільна)

**Вибір:** v8 як баланс між stability та features.

### Міграція на Yarn Berry або Bun у майбутньому?

Переглянемо через 1 рік:

- Якщо Bun стане mainstream — розглянемо міграцію
- Якщо pnpm performance стане проблемою — розглянемо Yarn Berry PnP
- Але для MVP — pnpm оптимальний вибір

## Дата

2024-01-20

## Теги

`tooling` `dependencies` `monorepo` `performance` `ci-cd`
