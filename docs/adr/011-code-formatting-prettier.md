# ADR-011: Використання Prettier для форматування коду

## Статус

Прийнято

## Контекст

Проєкт є monorepo з кількома застосунками (backend NestJS, frontend Next.js) та різними типами файлів (TypeScript,
JSX/TSX, JSON, Markdown, Prisma schema).

Потрібен інструмент для:

- Автоматичного форматування коду
- Уніфікації стилю у всьому проєкті
- Запобігання debates про code style
- Інтеграції з IDE та git hooks

Розглянуті альтернативи:

- **Prettier** — opinionated code formatter
- **dprint** — Rust-based formatter
- **ESLint --fix** — може форматувати, але це не його основна функція
- Ручне форматування

## Рішення

Використовуємо **Prettier** як єдиний code formatter для всього monorepo.

## Обґрунтування

### Переваги Prettier:

1. **Opinionated**
    - Мінімум конфігурації
    - Немає debates про стиль
    - Consistent код у всьому проєкті

2. **Підтримка багатьох мов**
    - TypeScript, JavaScript
    - JSX/TSX
    - JSON, YAML
    - Markdown
    - CSS, SCSS
    - **Prisma** (через `prettier-plugin-prisma`)

3. **Інтеграція з екосистемою**
    - Всі популярні IDE (VS Code, WebStorm)
   - Git hooks (через Lefthook, див. ADR-023)
    - CI/CD (перевірка форматування)
    - ESLint (через `eslint-config-prettier`)

4. **Industry standard**
    - Найпопулярніший formatter
    - Використовується у більшості проєктів
    - Команда вже знайома

5. **Performance**
    - Швидкий для monorepo
   - Incremental formatting (через Lefthook, тільки staged файли)

### Чому не інші варіанти:

**dprint:**

- ❌ Менша екосистема
- ❌ Менше IDE інтеграцій
- ✅ Швидший (але Prettier достатньо швидкий)
- ✅ Підтримка більше мов (але нам не потрібно)

**ESLint --fix:**

- ❌ Форматування — не основна функція
- ❌ Повільніше за Prettier
- ❌ Більше конфігурації
- ✅ Може використовуватися разом з Prettier

**Ручне форматування:**

- ❌ Inconsistent код
- ❌ Марна трата часу
- ❌ Code review про форматування

## Конфігурація

### Root `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine":  "lf",
  "bracketSpacing": true,
  "plugins": ["prettier-plugin-prisma"]
}
```

### `.prettierignore`

```
# Dependencies
node_modules
**/node_modules

# Build outputs
dist
build
.next
out

# Generated files
**/. prisma
**/generated

# Logs
*. log

# Coverage
coverage

# Env files
.env*
! .env. example

# Lock files
pnpm-lock.yaml
package-lock.json
yarn.lock
```

## IDE Інтеграція

### VS Code

**`.vscode/settings.json`:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor. defaultFormatter": "esbenp. prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

**`.vscode/extensions.json`:**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma"
  ]
}
```

## Scripts

### Root `package.json`

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,prisma}\"",
    "format: check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,prisma}\"",
    "format:changed": "prettier --write $(git diff --name-only --diff-filter=ACMR | grep -E '\\.(ts|tsx|js|jsx|json|md|prisma)$' | xargs)"
  },
  "devDependencies":  {
    "prettier": "^3.2.4",
    "prettier-plugin-prisma": "^5.0.0"
  }
}
```

## Git Hooks (Lefthook)

Автоматичне форматування перед commit (див. [ADR-023](023-git-hooks-lefthook.md)).

## CI/CD Перевірка

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  format: 
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm format: check
```

## Prisma Integration

**Prettier автоматично форматує Prisma schema:**

```prisma
// Before
model User{id String @id @default(cuid())
name String
  email String @unique
}

// After (prettier --write)
model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
}
```

## Наслідки

### Позитивні:

- ✅ Consistent код у всьому проєкті
- ✅ Немає debates про code style
- ✅ Автоматичне форматування (format on save)
- ✅ Швидші code reviews (не треба коментувати форматування)

### Негативні:

- ⚠️ Opinionated (але це також перевага)
- ⚠️ Може конфліктувати з особистими перевагами (але єдиний стиль важливіше)

### Нейтральні:

- Команда повинна прийняти Prettier стиль
- Не можна змінювати більшість налаштувань (minimal config)

## Примітки

- Використовуємо Prettier v3.x (latest)
- Prettier run перед ESLint (Prettier форматує, ESLint перевіряє логіку)
- Використовуємо `eslint-config-prettier` щоб уникнути конфліктів
