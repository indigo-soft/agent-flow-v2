# ADR-012: Використання ESLint для лінтингу коду

## Статус

Прийнято

## Контекст

Проєкт використовує TypeScript для backend (NestJS) та frontend (Next.js + React).

Потрібен інструмент для:

- Виявлення помилок у коді
- Enforce best practices
- Виявлення проблем з типізацією
- Виявлення security issues
- Виявлення accessibility issues (frontend)
- Підтримка code quality

Розглянуті альтернативи:

- **ESLint** — де-факто стандарт для JavaScript/TypeScript
- **TSLint** (deprecated, не розглядається)
- **Biome** — новий Rust-based linter/formatter
- Тільки TypeScript compiler

## Рішення

Використовуємо **ESLint** з різними конфігураціями для backend та frontend.

## Обґрунтування

### Переваги ESLint:

1. **Industry standard**
    - Найпопулярніший linter для JS/TS
    - Підтримується всіма IDE
    - Величезна екосистема плагінів

2. **TypeScript підтримка**
    - `@typescript-eslint` — офіційний плагін
    - Type-aware rules
    - Інтеграція з TypeScript compiler

3. **Ecosystem plugins**
    - `eslint-plugin-import` — перевірка imports
    - `eslint-plugin-react` — React best practices
    - `eslint-plugin-react-hooks` — React hooks rules
    - `eslint-plugin-jsx-a11y` — accessibility
    - `eslint-plugin-security` — security issues
    - `@typescript-eslint/eslint-plugin` — TypeScript rules

4. **Інтеграція з frameworks**
    - NestJS — рекомендований конфіг
    - Next. js — вбудований `eslint-config-next`

5. **Автофікс**
    - Багато правил можна автоматично виправити
    - Інтеграція з IDE (fix on save)

### Чому не інші варіанти:

**Biome:**

- ❌ Менша екосистема (молодий проєкт)
- ❌ Менше плагінів
- ❌ Менше підтримки у IDE
- ✅ Швидший (Rust-based)
- ✅ Comби лінтер + форматер (але ми вже обрали Prettier)

**Тільки TypeScript:**

- ❌ Тільки перевірка типів
- ❌ Не перевіряє code style, best practices
- ❌ Не перевіряє security, accessibility

## Конфігурація

### Root `.eslintrc.js` (base)

```javascript
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    env: {
        node: true,
        es6: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin: import/recommended',
        'plugin:import/typescript',
        'prettier', // Вимикає ESLint rules що конфліктують з Prettier
    ],
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        // TypeScript
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],

        // Import
        'import/order': [
            'error',
            {
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                ],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],
        'import/no-unresolved': 'error',
        'import/no-cycle': 'error',

        // General
        'no-console': ['warn', {allow: ['warn', 'error']}],
        'prefer-const': 'error',
        'no-var': 'error',
    },
    settings: {
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
            },
        },
    },
};
```

### Backend `.eslintrc.js` (apps/backend)

```javascript
module.exports = {
    extends: ['../../. eslintrc.js'],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    rules: {
        // NestJS specific
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',

        // Decorators
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                // Ignore decorator parameters
                destructuredArrayIgnorePattern: '^_',
            },
        ],
    },
};
```

### Frontend `.eslintrc.js` (apps/dashboard)

```javascript
module.exports = {
    extends: [
        '../../.eslintrc.js',
        'next/core-web-vitals', // Next.js рекомендований конфіг
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
    ],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: ['react', 'react-hooks', 'jsx-a11y'],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // React
        'react/react-in-jsx-scope': 'off', // Next.js не потребує
        'react/prop-types': 'off', // Використовуємо TypeScript
        'react/jsx-uses-react': 'off',
        'react/jsx-uses-vars': 'error',

        // React Hooks
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // Accessibility
        'jsx-a11y/anchor-is-valid': [
            'error',
            {
                components: ['Link'],
                specialLink: ['hrefLeft', 'hrefRight'],
                aspects: ['invalidHref', 'preferButton'],
            },
        ],

        // Next.js specific
        '@next/next/no-html-link-for-pages': 'error',
    },
};
```

### `.eslintignore`

```
# Dependencies
node_modules
**/node_modules

# Build outputs
dist
build
.next
out
coverage

# Generated files
**/.prisma
**/generated
**/*.generated. ts

# Config files
*. config.js
. eslintrc.js

# Logs
*.log
```

## Додаткові плагіни

### Security

```bash
pnpm add -D -w eslint-plugin-security
```

```javascript
// . eslintrc.js
{
extends:
    [
        // ...
        'plugin:security/recommended',
    ],
        plugins
:
    ['security'],
}
```

### Unused imports (автоматичне видалення)

```bash
pnpm add -D -w eslint-plugin-unused-imports
```

```javascript
// .eslintrc.js
{
    plugins: ['unused-imports'],
        rules
:
    {
        '@typescript-eslint/no-unused-vars'
    :
        'off', // Вимикаємо стандартне правило
            'unused-imports/no-unused-imports'
    :
        'error',
            'unused-imports/no-unused-vars'
    :
        [
            'warn',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
    }
,
}
```

### Sorting (автоматичне сортування)

```bash
pnpm add -D -w eslint-plugin-simple-import-sort
```

```javascript
// .eslintrc.js
{
    plugins: ['simple-import-sort'],
        rules
:
    {
        'simple-import-sort/imports'
    :
        'error',
            'simple-import-sort/exports'
    :
        'error',
    }
,
}
```

## Scripts

### Root `package.json`

```json
{
  "scripts": {
    "lint": "eslint \"**/*.{ts,tsx,js,jsx}\"",
    "lint:fix": "eslint \"**/*.{ts,tsx,js,jsx}\" --fix",
    "lint:backend": "eslint \"apps/backend/**/*.{ts,js}\"",
    "lint:frontend": "eslint \"apps/dashboard/**/*.{ts,tsx,js,jsx}\"",
    "type-check": "tsc --noEmit",
    "type-check:all": "pnpm -r run type-check"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-security": "^2.1.0",
    "eslint-plugin-simple-import-sort": "^10.0.0",
    "eslint-plugin-unused-imports": "^3.0.0",
    "eslint-import-resolver-typescript": "^3.6.1"
  }
}
```

## IDE Integration (VS Code)

Вже включено у ADR-011, але додамо:

```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll. eslint": "explicit",
    "source.organizeImports": "never"
    // Використовуємо eslint-plugin-simple-import-sort
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [
    "./apps/backend",
    "./apps/dashboard"
  ]
}
```

## Git Hooks Integration

Див. ADR-013 (Husky + lint-staged).

## CI/CD Перевірка

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run:
          pnpm type-check: all
```

## Наслідки

### Позитивні:

- ✅ Виявлення помилок до runtime
- ✅ Enforce best practices
- ✅ Consistent code style
- ✅ Security та accessibility checks
- ✅ Автоматичні fixes

### Негативні:

- ⚠️ Може сповільнити розробку спочатку (крива навчання)
- ⚠️ Треба час на налаштування правил

### Нейтральні:

- Команда повинна дотримуватись правил
- Можна поступово додавати правила (починати з 'warn', потім 'error')

## Стратегія впровадження

1. **Phase 1:** Базові правила (recommended configs)
2. **Phase 2:** Security та accessibility плагіни
3. **Phase 3:** Custom rules для проєкту
4. **Phase 4:** Strict mode (всі warnings → errors)

## Примітки

- Використовуємо ESLint v8.x (flat config у v9 ще experimental)
- Регулярно оновлюємо плагіни
- Переглядаємо правила кожні 3-6 місяців
