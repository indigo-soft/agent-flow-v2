# ADR-014: Підсумок інструментів для code quality

## Статус

Прийнято

## Інструменти

| Інструмент      | Призначення               | Коли запускається                                                                      |
|-----------------|---------------------------|----------------------------------------------------------------------------------------|
| **Prettier**    | Форматування коду         | • Format on save (IDE)<br>• Pre-commit (lint-staged)<br>• CI/CD                        |
| **ESLint**      | Лінтинг, best practices   | • IDE (real-time)<br>• Pre-commit (lint-staged)<br>• CI/CD                             |
| **TypeScript**  | Type checking             | • IDE (real-time)<br>• Pre-commit (changed files)<br>• Pre-push (all files)<br>• CI/CD |
| **Husky**       | Git hooks management      | • Pre-commit<br>• Commit-msg<br>• Pre-push                                             |
| **lint-staged** | Run tools on staged files | • Pre-commit                                                                           |
| **commitlint**  | Validate commit messages  | • Commit-msg hook                                                                      |

## Workflow

```
Developer writes code
        ↓
IDE:  ESLint highlights issues (real-time)
IDE: Prettier formats on save
        ↓
Developer:  git add . 
Developer: git commit -m "feat(backend): add feature"
        ↓
Pre-commit hook (Husky):
  → lint-staged: 
    → ESLint --fix (staged files)
    → Prettier --write (staged files)
  → Type check (changed projects)
        ↓
Commit-msg hook (Husky):
  → commitlint validates message format
        ↓
Developer: git push
        ↓
Pre-push hook (Husky):
  → Run tests (changed files)
  → Type check (all files)
        ↓
CI/CD (GitHub Actions):
  → ESLint (all files)
  → Prettier check (all files)
  → Type check (all projects)
  → Tests (all tests)
  → Build
        ↓
✅ Code merged to main
```

## Installation

```bash
# Root package.json
pnpm add -D -w \
  prettier prettier-plugin-prisma \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-config-prettier eslint-plugin-import \
  eslint-plugin-security eslint-plugin-unused-imports \
  eslint-plugin-simple-import-sort \
  eslint-import-resolver-typescript \
  husky lint-staged \
  @commitlint/cli @commitlint/config-conventional \
  sort-package-json

# Frontend specific
cd apps/dashboard
pnpm add -D \
  eslint-config-next \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y

# Initialize
npx husky init
```

## Configuration files

```
root/
├── .prettierrc              # Prettier config
├── .prettierignore
├── .eslintrc.js             # Base ESLint config
├── . eslintignore
├── commitlint.config.js     # Commit message rules
├── . lintstagedrc.js         # lint-staged config
├── . husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── apps/
│   ├── backend/
│   │   └── . eslintrc.js     # Backend ESLint (extends root)
│   └── dashboard/
│       └── .eslintrc.js     # Frontend ESLint (extends root)
└── . vscode/
    ├── settings.json        # IDE settings
    └── extensions.json      # Recommended extensions
```

## VS Code Extensions (рекомендовані)

```json
{
  "recommendations": [
    "esbenp. prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: CI

on: [ push, pull_request ]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Check formatting
        run: pnpm format:check

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check:all

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

## Scripts (Root package.json)

```json
{
  "scripts": {
    "prepare": "husky",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,prisma}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,prisma}\"",
    "lint": "eslint \"**/*.{ts,tsx,js,jsx}\"",
    "lint:fix": "eslint \"**/*.{ts,tsx,js,jsx}\" --fix",
    "type-check: all": "pnpm -r run type-check",
    "type-check:changed": "node scripts/type-check-changed. js",
    "test": "pnpm -r run test",
    "test:changed": "node scripts/test-changed.js",
    "validate": "pnpm format:check && pnpm lint && pnpm type-check:all && pnpm test"
  }
}
```

## Best Practices

1. **Не обходьте hooks без потреби**
    - `--no-verify` тільки для WIP commits
    - CI/CD все одно перевірить

2. **Fix issues у IDE, не у hook**
    - Використовуйте format on save
    - Виправляйте ESLint помилки під час написання

3. **Коміть малими порціями**
    - Менше файлів → швидші hooks
    - Легше знайти проблему

4. **Дотримуйтесь conventional commits**
    - Чіткий git history
    - Автогенерація CHANGELOG
    - Семантичне версіонування

5. **Регулярно оновлюйте tools**
    - Нові правила ESLint
    - Виправлення bugs у Prettier
    - Security updates

## Troubleshooting

### Husky hooks не запускаються

```bash
# Re-initialize
rm -rf .husky
npx husky init
```

### lint-staged повільний

```javascript
// . lintstagedrc.js - run sequentially
module.exports = {
    '**/*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write',
    ],
    // Don't run type check here, do it separately
};
```

### ESLint конфліктує з Prettier

```bash
# Встановіть eslint-config-prettier (вже є у стеку)
# Він має бути останнім у extends
{
  extends: [
    '...',
    'prettier', // Must be last! 
  ]
}
```

## Примітки

- Всі інструменти працюють разом
- IDE → git hooks → CI/CD (багаторівнева перевірка)
- Автоматизація зберігає час та нерви
