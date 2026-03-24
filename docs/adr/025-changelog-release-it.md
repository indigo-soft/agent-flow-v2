# ADR-025: Автоматичне формування Changelog (release-it)

## Статус

Прийнято

## Контекст

Проєкт дотримується специфікації [Conventional Commits](https://www.conventionalcommits.org/), що відкриває
можливість автоматично генерувати `CHANGELOG.md` та GitHub Releases безпосередньо з повідомлень комітів.
Ручне ведення changelog — трудомістке і схильне до помилок:

- Розробник може забути додати запис.
- Формат може відрізнятися від коміта до коміта.
- Під час швидких релізів changelog часто пропускається.
  Тому необхідно обрати інструмент, який автоматизує:

1. Визначення наступної версії на основі типів комітів (`feat` → minor, `fix` → patch, `feat!` → major).
2. Генерацію `CHANGELOG.md` із секціями Features, Bug Fixes тощо.
3. Створення Git-тегу та release commit.
4. Публікацію GitHub Release із авто-нотатками.

### Вимоги до інструменту

-

Підтримка [Conventional Commits](https://www.conventionalcommits.org/) / [conventional commits preset](https://github.com/conventional-changelog/conventional-changelog).

- Запуск через `npm scripts` (поточний workflow).
- Можливість перейти на **GitHub Actions** без суттєвих змін конфігурації.
- Активна підтримка та розвиток (не abandonware).
- Мінімальний vendor lock-in.
- Enterprise-ready: dry-run режим, гнучкі hooks, можливість кастомізації.

## Рішення

Використовувати **[release-it](https://github.com/release-it/release-it)** разом із плагіном
**[@release-it/conventional-changelog](https://github.com/release-it/conventional-changelog)** для
автоматичного визначення версії, генерації `CHANGELOG.md`, створення Git-тегу та публікації GitHub Release.
**Версії:**

- `release-it`: `^19.x`
- `@release-it/conventional-changelog`: `^10.x`

## Альтернативи

### Альтернатива 1: semantic-release

**Переваги:**

- ✅ Повна автоматизація CI/CD без будь-якої ручної взаємодії
- ✅ Дуже велика екосистема плагінів
- ✅ Широке використання у відкритих проєктах
  **Недоліки:**
- ❌ Жорстко прив'язаний до CI — локальний запуск ускладнений і не є primary use-case
- ❌ "All-or-nothing" підхід: або повна автоматизація, або нічого
- ❌ Значна конфігурація та overhead для нашого типу проєкту
- ❌ Складніше налагодження при проблемах

**Чому не обрали:** На поточному етапі потрібна можливість запускати релізи локально через `npm scripts`.
semantic-release орієнтований виключно на CI, що не відповідає нашому поточному workflow.

### Альтернатива 2: commit-and-tag-version

**Переваги:**

- ✅ Простий у використанні
- ✅ Добре відомий (спадкоємець `standard-version`)
- ✅ Підтримує Conventional Commits
  **Недоліки:**
- ❌ Не публікує GitHub Releases (тільки Git-теги)
- ❌ Не підтримує interactive mode
- ❌ Менший набір функцій (немає hooks, dry-run обмежений)
- ❌ Менш активний розвиток порівняно з release-it

**Чому не обрали:** Відсутність убудованої публікації GitHub Releases — критична для нашого майбутнього workflow.

### Альтернатива 3: Ручне ведення Changelog

**Переваги:**

- ✅ Повний контроль над умістом
- ✅ Нульова залежність від зовнішніх інструментів
  **Недоліки:**
- ❌ Трудомістко і схильне до помилок
- ❌ Часто пропускається під час швидких релізів
- ❌ Несумісно з CI/CD автоматизацією
- ❌ Немає гарантії відповідності фактичним змінам у коді

**Чому не обрали:** Не масштабується, суперечить принципу автоматизації проєкту.

## Обґрунтування

### Чому release-it

#### 1. Сучасний та активно підтримуваний

- ⭐ **17 000+ зірок на GitHub**
- 🔄 Активний розвиток, регулярні релізи
- 📦 Широка спільнота та екосистем плагінів
- 🏢 Використовується у production в Enterprise проєктах

#### 2. Гнучкість: локально + CI

`release-it` однаково добре працює як при **локальному запуску** через `npm scripts`:

```bash
npm run release:patch
npm run release:dry
```

Так і в **GitHub Actions** без суттєвих змін конфігурації:

```yaml
-   name: Release
    run: npx release-it --ci
    env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Це критично для нашого поетапного підходу: спочатку `npm scripts`, потім — повна автоматизація через GitHub Actions.

#### 3. Enterprise-ready функціонал

- **Dry-run режим** — перегляд змін без їх застосування (`--dry-run`)
- **Interactive mode** — вибір версії через інтерактивне меню
- **Lifecycle Hooks** — `before:init`, `after:bump`, `after:git:release`, `after:github:release`
- **CI mode** — `--ci` прапор для non-interactive виконання

#### 4. Конфігурація одним файлом

Вся конфігурація — в `.release-it.json`:

- Git commit, tag, push
- GitHub Release публікація
- Налаштування changelog
- Hooks для виводу повідомлень

#### 5. Плагін conventional-changelog

Плагін `@release-it/conventional-changelog` надає:

- Автоматичне визначення версії на основі типів комітів (semver bump)
- Генерацію `CHANGELOG.md` із секціями за типами комітів
- Підтримку
  будь-якого [conventional-changelog preset](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages)

#### 6. Мінімальний vendor lock-in

`release-it` — інструмент без lock-in: конфігурація зрозуміла, логіку легко відтворити без нього. При необхідності
міграція на інший інструмент мінімальна.

## Імплементація

### Встановлення

```bash
pnpm add -D release-it @release-it/conventional-changelog
```

### Конфігурація

**Файл:** `.release-it.json`

```json
{
    "git": {
        "commit": true,
        "commitMessage": "chore(release): v${version}",
        "tag": true,
        "tagName": "v${version}",
        "push": true,
        "requireCleanWorkingDir": true
    },
    "github": {
        "release": true,
        "releaseName": "Release v${version}",
        "tokenRef": "GITHUB_TOKEN"
    },
    "npm": {
        "publish": false,
        "version": true
    },
    "hooks": {
        "before:init": [
            "echo '🔍 Перевірка стану репозиторію...'"
        ],
        "after:bump": [
            "echo '📦 Версію оновлено до ${version}'"
        ],
        "after:git:release": [
            "echo '🏷️ Git-тег створено: v${version}'"
        ],
        "after:github:release": [
            "echo '🚀 GitHub Release опубліковано!'"
        ]
    },
    "plugins": {
        "@release-it/conventional-changelog": {
            "preset": "conventionalcommits",
            "infile": "CHANGELOG.md"
        }
    }
}
```

### npm Scripts

```json
{
    "scripts": {
        "release": "bash scripts/release/release.sh",
        "release:dry": "bash scripts/release/release.sh --dry",
        "release:patch": "bash scripts/release/release.sh --type=patch",
        "release:minor": "bash scripts/release/release.sh --type=minor",
        "release:major": "bash scripts/release/release.sh --type=major"
    }
}
```

### Wrapper-скрипт

Команди делегуються кастомному Bash-скрипту `scripts/release/release.sh`, який перед викликом `release-it`
виконує набір pre-release перевірок (чиста робоча директорія, правильна гілка, відповідність lockfile тощо).
Детальніше: [`docs/guides/release-flow.md`](../guides/release-flow.md).

### Майбутня автоматизація через GitHub Actions

Перехід на GitHub Actions потребує мінімальних змін — лише додати workflow файл:

```yaml
# .github/workflows/release.yml
name: Release
on:
    push:
        branches: [ main ]
jobs:
    release:
        runs-on: ubuntu-latest
        steps:
            -   uses: actions/checkout@v4
                with:
                    fetch-depth: 0
            -   uses: actions/setup-node@v4
                with:
                    node-version: 24
            -   run: npm ci
            -   run: npx release-it --ci
                env:
                    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Конфігурація `.release-it.json` залишається незмінною — це ключова перевага release-it.

### Відповідність Conventional Commits → semver

| Тип коміту                  | Секція CHANGELOG           | Bump    |
|-----------------------------|----------------------------|---------|
| `feat`                      | ✨ Features                 | `minor` |
| `fix`                       | 🐛 Bug Fixes               | `patch` |
| `perf`                      | ⚡ Performance Improvements | `patch` |
| `revert`                    | ⏪ Reverts                  | `patch` |
| `docs`                      | 📚 Documentation           | —       |
| `chore`                     | 🔧 Miscellaneous Chores    | —       |
| `feat!` / `BREAKING CHANGE` | 💥 Breaking Changes        | `major` |

## Наслідки

### Позитивні

- ✅ **Автоматичний `CHANGELOG.md`** — генерується з commit history, не вимагає ручного редагування
- ✅ **Автоматичні GitHub Releases** — нотатки формуються автоматично
- ✅ **Єдиний workflow** — однакова команда локально й в CI
- ✅ **Dry-run** — безпечна перевірка перед застосуванням
- ✅ **Прозорість** — кожна зміна версії прив'язана до конкретних комітів
- ✅ **Мотивація для якісних комітів** — команда бачить результат Conventional Commits у changelog

### Негативні

- ⚠️ **Залежність від якості комітів** — якщо commit messages написані неправильно, changelog буде неповним
- ⚠️ **`CHANGELOG.md` не редагується вручну** — будь-які ручні зміни будуть перезаписані на наступному релізі
- ⚠️ **`GITHUB_TOKEN` обов'язковий** — без токена GitHub Release не публікується

### Нейтральні

- `CHANGELOG.md` оновлюється автоматично при кожному релізі
- Версія в `package.json` оновлюється автоматично
- Release commit та Git-тег створюються автоматично

## Зв'язок з іншими ADR

- [ADR-015: Git Workflow and Branching Strategy](015-git-workflow-branching-strategy.md) — Conventional Commits є
  основою для автоматичної версіонізації
- [ADR-023: Git Hooks (Lefthook)](023-git-hooks-lefthook.md) — `commit-msg` hook валідує формат комітів через
  commitlint, що гарантує коректний вхід для release-it
- [ADR-016: Package Manager (pnpm)](016-package-manager-pnpm.md) — release-it встановлено як dev dependency через
  pnpm

## Ресурси

- **release-it GitHub:** https://github.com/release-it/release-it
- **Документація:** https://github.com/release-it/release-it/blob/main/docs/
- **@release-it/conventional-changelog:** https://github.com/release-it/conventional-changelog
- **Conventional Commits:** https://www.conventionalcommits.org/
- **Release Flow Guide:** [`docs/guides/release-flow.md`](../guides/release-flow.md)
