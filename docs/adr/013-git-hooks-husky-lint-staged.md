# ADR-013: Використання Husky + lint-staged для git hooks

## Статус

**Superseded** by [ADR-023: Міграція з Husky на Lefthook](023-git-hooks-lefthook.md)

_(Оригінально: Прийнято 2024-01-20, Superseded: 2026-02-11)_

## Контекст

Потрібен механізм для автоматичної перевірки коду перед commit та push:

- Форматування коду (Prettier)
- Лінтинг (ESLint)
- Type checking (TypeScript)
- Запуск тестів

Мета: запобігти попаданню неякісного коду у git history.

Розглянуті альтернативи:

- **Husky + lint-staged** — найпопулярніше рішення
- **pre-commit** (Python-based)
- **lefthook** (Go-based, швидший)
- Ручні git hooks
- Тільки CI/CD перевірки

## Рішення

Використовуємо **Husky** для управління git hooks + **lint-staged** для запуску команд тільки на staged файлах.

## Обґрунтування

### Переваги Husky + lint-staged:

1. **Industry standard**
    - Найпопулярніше рішення у Node.js екосистемі
    - Використовується у більшості проєктів
    - Чудова документація

2. **lint-staged performance**
    - Запускає команди **тільки на staged файлах**
    - Не перевіряє весь проєкт кожного разу
    - Швидкі commits

3. **Простота налаштування**
    - Мінімальна конфігурація
    - Працює з monorepo
    - Автоматична установка hooks

4. **Гнучкість**
    - Різні hooks (pre-commit, commit-msg, pre-push)
    - Можна запускати будь-які команди
    - Можн�� скіпнути через `--no-verify` (для edge cases)

### Чому не інші варіанти:

**lefthook:**

- ❌ Менша спільнота
- ❌ Менше інтеграцій
- ✅ Швидший (але для нашого випадку не критично)

**pre-commit (Python):**

- ❌ Потребує Python
- ❌ Не Node.js native
- ❌ Менше підходить для JS/TS проєктів

**Ручні git hooks:**

- ❌ Не commitяться у git (кожен розробник має налаштувати сам)
- ❌ Важко синхронізувати між командою

**Тільки CI/CD:**

- ❌ Пізня валідація (після push)
- ❌ Марна трата часу CI
- ❌ Забруднення git history

## Установка

```bash
# Root
pnpm add -D -w husky lint-staged

# Ініціалізація
npx husky init
```

## Конфігурація

### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
.  "$(dirname -- "$0")/_/husky. sh"

# Run lint-staged
pnpm lint-staged

# Type check (only changed files' projects)
pnpm type-check: changed
```

### `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format (conventional commits)
npx --no -- commitlint --edit $1
```

### `.husky/pre-push`

```bash
#!/usr/bin/env sh
.  "$(dirname -- "$0")/_/husky.sh"

# Run tests before push
pnpm test: changed

# Full type check
pnpm type-check:all
```

### `.lintstagedrc.js`

```javascript
module.exports = {
    // TypeScript files (backend + frontend)
    '**/*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write',
        // Type check буде окремо у pre-commit hook
    ],

    // JavaScript files
    '**/*.{js,jsx}': [
        'eslint --fix',
        'prettier --write',
    ],

    // JSON, Markdown
    '**/*.{json,md}': [
        'prettier --write',
    ],

    // Prisma schema
    'apps/backend/prisma/schema.prisma': [
        'prettier --write',
        // Generate Prisma Client після змін schema
        () => 'cd apps/backend && pnpm prisma generate',
    ],

    // Package.json files
    '**/package.json': [
        'prettier --write',
        // Sort package.json (optional)
        'sort-package-json',
    ],
};
```

### `commitlint.config.js` (Conventional Commits)

```bash
pnpm add -D -w @commitlint/cli @commitlint/config-conventional
```

```javascript
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat',     // Нова функціональність
                'fix',      // Виправлення бага
                'docs',     // Документація
                'style',    // Форматування
                'refactor', // Рефакторинг
                'perf',     // Performance
                'test',     // Тести
                'chore',    // Maintenance
                'ci',       // CI/CD
                'build',    // Build system
                'revert',   // Revert commit
            ],
        ],
        'scope-enum': [
            2,
            'always',
            [
                'backend',
                'frontend',
                'shared',
                'architect',
                'workflow',
                'code-review',
                'documentation',
                'github',
                'ai-provider',
                'database',
                'queue',
                'deps',
            ],
        ],
        'subject-case': [2, 'always', 'sentence-case'],
    },
};
```

### `package.json` scripts

```json
{
  "scripts": {
    "prepare": "husky",
    "type-check: changed": "node scripts/type-check-changed.js",
    "test:changed": "node scripts/test-changed.js"
  },
  "devDependencies": {
    "@commitlint/cli": "^18.6.0",
    "@commitlint/config-conventional": "^18.6.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "sort-package-json": "^2.6.0"
  }
}
```

### Helper scripts

**`scripts/type-check-changed.js`:**

```javascript
#!/usr/bin/env node
const {execSync} = require('child_process');

// Get changed TypeScript files
const changedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR')
    .toString()
    .trim()
    .split('\n')
    .filter(file => file.match(/\. tsx?$/));

if (changedFiles.length === 0) {
    console.log('No TypeScript files changed, skipping type check');
    process.exit(0);
}

// Determine which apps have changes
const apps = new Set();
changedFiles.forEach(file => {
    if (file.startsWith('apps/backend/')) apps.add('backend');
    if (file.startsWith('apps/dashboard/')) apps.add('dashboard');
    if (file.startsWith('packages/')) {
        apps.add('backend');
        apps.add('dashboard');
    }
});

// Run type check for affected apps
apps.forEach(app => {
    console.log(`Type checking ${app}...`);
    execSync(`pnpm --filter ${app} type-check`, {stdio: 'inherit'});
});
```

**`scripts/test-changed.js`:**

```javascript
#!/usr/bin/env node
const {execSync} = require('child_process');

// Get changed test files
const changedFiles = execSync('git diff --name-only --diff-filter=ACMR HEAD~1')
    .toString()
    .trim()
    .split('\n')
    .filter(file => file.match(/\.(spec|test)\.tsx?$/));

if (changedFiles.length === 0) {
    console.log('No test files changed, skipping tests');
    process.exit(0);
}

// Run tests for changed files
console.log('Running tests for changed files...');
execSync(`jest ${changedFiles.join(' ')}`, {stdio: 'inherit'});
```

## Workflow

### Pre-commit hook

```
Developer runs:  git commit -m "feat(backend): add task creation"
↓
Husky triggers: . husky/pre-commit
↓
lint-staged runs: 
  1. ESLint --fix (staged . ts/. tsx files)
  2. Prettier --write (staged files)
  3. Prisma generate (if schema changed)
↓
type-check:changed runs:
  - TypeScript compiler for affected apps
↓
If all pass → commit succeeds
If any fail → commit aborted, developer fixes issues
```

### Commit-msg hook

```
Commit message created
↓
Husky triggers:  .husky/commit-msg
↓
commitlint validates format: 
  ✅ "feat(backend): add task creation"
  ❌ "added task creation" (missing type)
  ❌ "feat:  TASK CREATION" (wrong case)
↓
If valid → proceed
If invalid → commit aborted with error message
```

### Pre-push hook

```
Developer runs: git push
↓
Husky triggers:  .husky/pre-push
↓
Runs: 
  1. test:changed (tests for changed files)
  2. type-check:all (full type check)
↓
If all pass → push succeeds
If any fail → push aborted
```

## Skip hooks (edge cases)

```bash
# Skip pre-commit + commit-msg
git commit --no-verify -m "WIP: quick fix"

# Skip pre-push
git push --no-verify
```

**⚠️ Використовувати рідко!  Тільки для WIP commits.**

## CI/CD як fallback

Навіть з git hooks, CI/CD повинен запускати всі перевірки:

```yaml
# .github/workflows/ci. yml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm lint
      - run:
          pnpm format: check
      - run: pnpm type-check:all
      - run: pnpm test
```

**Чому:** Git hooks можна обійти через `--no-verify`.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Приклади:**

```
feat(backend): add workflow agent processor

Implement BullMQ processor for workflow events. 
Handles task-started and task-completed events. 

Closes #123
```

```
fix(frontend): kanban drag and drop on mobile

Fixed touch events handling in @hello-pangea/dnd
```

```
docs(adr): add decision record for git hooks
```

```
chore(deps): update dependencies

- prettier@3.2.4 → 3.2.5
- eslint@8.56.0 → 8.57.0
```

## Наслідки

### Позитивні:

- ✅ Якісний код у git history
- ✅ Швидкий feedback loop (до commit, не після push)
- ✅ Менше помилок у CI/CD
- ✅ Consistent commit messages
- ✅ Автоматичне форматування

### Негативні:

- ⚠️ Трохи повільніші commits (але тільки на змінених файлах)
- ⚠️ Можна обійти через `--no-verify` (але CI/CD ловить)

### Нейтральні:

- Команда повинна дотримуватись conventional commits
- Інколи треба `--no-verify` для WIP commits

## Примітки

- Husky hooks commitяться у git
- lint-staged працює тільки з staged файлами (швидко)
- CI/CD як fallback (якщо хтось обійде hooks)
- Conventional commits для автогенерації CHANGELOG
