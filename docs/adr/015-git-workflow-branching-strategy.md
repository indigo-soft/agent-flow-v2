# ADR-015: Git Workflow та Branching Strategy

## Статус

Прийнято

## Контекст

Проєкт потребує чіткої стратегії роботи з Git:

- Коли створювати гілки
- Як називати гілки
- Коли робити коміти
- Як писати commit messages
- Коли мерджити
- Як організувати releases

Вимоги:

- Простота для solo/малої команди
- Чистий git history
- Можливість швидко знайти зміни
- Підтримка CI/CD
- Можливість rollback

Розглянуті стратегії:

- **GitHub Flow** — проста, одна main гілка + feature branches
- **Git Flow** — складна, multiple long-lived branches
- **Trunk-Based Development** — всі коміти у main
- **GitLab Flow** — середня складність

## Рішення

Використовуємо **GitHub Flow** з елементами **Conventional Commits**.

## Обґрунтування

### Чому GitHub Flow:

1. **Простота**
    - Одна головна гілка (`main`)
    - Feature branches для кожної задачі
    - Pull Requests для code review
    - Легко зрозуміти та дотримуватись

2. **Швидкість**
    - Швидкі релізи (кожен мердж у main — потенційний release)
    - Немає довгоживучих гілок
    - Continuous deployment ready

3. **Підхо��ить для MVP**
    - Не overengineered
    - Легко адаптувати
    - Працює для solo та команд

4. **CI/CD friendly**
    - Main завжди deployable
    - Automated testing на кожен PR
    - Automated deployment з main

### Чому НЕ інші стратегії:

**Git Flow:**

- ❌ Занадто складний для MVP
- ❌ Багато long-lived гілок (develop, release, hotfix)
- ❌ Повільні релізи
- ✅ Добре для scheduled releases (не наш випадок)

**Trunk-Based Development:**

- ❌ Немає code review перед мерджем (всі коміти прямо у main)
- ❌ Потребує дуже сильної дисципліни
- ✅ Найшвидший (але ризикований для поверхневого знання)

**GitLab Flow:**

- ❌ Environment branches (staging, production) — overkill для MVP
- ✅ Добре для великих команд (не наш випадок)

## Git Workflow

### Структура гілок

```
main (protected)
  ├── feature/architect-agent-draft-creation
  ├── feature/workflow-agent-branch-creation
  ├── feature/kanban-board-ui
  ├── fix/prisma-migration-error
  ├── docs/adr-git-workflow
  └── chore/update-dependencies
```

**Типи гілок:**

1. **`main`** — головна гілка
    - Завжди deployable
    - Protected (не можна пушити напряму)
    - Тільки мердж через PR
    - CI/CD запускається автоматично

2. **`feature/*`** — нова функціональність
    - Створюється від `main`
    - Мерджиться назад у `main` через PR
    - Видаляється після мерджу

3. **`fix/*`** — виправлення багів
    - Створюється від `main`
    - Мерджиться назад у `main` через PR
    - Видаляється після мерджу

4. **`docs/*`** — документація
    - Створюється від `main`
    - Мерджиться назад у `main` через PR
    - Видаляється після мерджу

5. **`chore/*`** — maintenance (deps, config тощо)
    - Створюється від `main`
    - Мерджиться назад у `main` через PR
    - Видаляється після мерджу

6. **`refactor/*`** — рефакторинг
    - Створюється від `main`
    - Мерджиться назад у `main` через PR
    - Видаляється після мерджу

## Naming Convention для гілок

### Формат

```
<type>/<short-description>
```

або з номером задач��:

```
<type>/<issue-number>-<short-description>
```

### Правила:

- ✅ Lowercase
- ✅ Kebab-case (слова через `-`)
- ✅ Короткий опис (3-5 слів)
- ✅ Англійська мова
- ❌ Без спецсимволів (крім `-` та `/`)
- ❌ Без spaces

### Приклади:

```bash
# Нова функціональність
feature/architect-agent-draft-creation
feature/123-kanban-drag-and-drop
feature/github-integration-create-pr

# Виправлення бага
fix/prisma-connection-timeout
fix/456-kanban-card-not-updating
fix/eslint-config-error

# Документація
docs/adr-git-workflow
docs/api-endpoints-readme
docs/deployment-guide

# Maintenance
chore/update-dependencies
chore/configure-prettier
chore/add-docker-compose

# Рефакторинг
refactor/extract-github-service
refactor/simplify-queue-logic
```

### ❌ Погані назви:

```bash
# Занадто загально
feature/new-feature
fix/bug

# Не kebab-case
feature/Architect_Agent
feature/kanbanBoard

# Спецсимволи
feature/add-task-#123
fix/bug@backend

# Українська мова (краще англійська для consistency)
feature/додавання-задачі
```

## Workflow Process

### 1. Початок роботи над задачею

```bash
# 1. Переконатись що main актуальний
git checkout main
git pull origin main

# 2. Створити нову гілку
git checkout -b feature/architect-agent-draft-creation

# Або з номером issue
git checkout -b feature/123-kanban-drag-and-drop
```

### 2. Робота над кодом

```bash
# Робите зміни у коді... 

# Перевірте статус
git status

# Додайте файли
git add .

# Або вибірково
git add apps/backend/src/modules/architect-agent/

# Закомітьте (pre-commit hook запуститься автоматично)
git commit -m "feat(architect): add draft creation service"

# Якщо pre-commit hook провалився
# Виправте помилки і спробуйте знову
git add .
git commit -m "feat(architect): add draft creation service"
```

### 3. Коли робити коміти

**Робіть коміт коли:**

✅ Завершили логічну одиницю роботи (функція, компонент, фікс)
✅ Код компілюється без помилок
✅ Тести проходять
✅ ESLint та Prettier перевірки пройшли

**Приклади логічних одиниць:**

```bash
# Хороші коміти (одна логічна зміна)
git commit -m "feat(architect): add ArchitectAgentService"
git commit -m "feat(architect): add DTO for draft creation"
git commit -m "feat(architect): add controller endpoint"
git commit -m "test(architect): add unit tests for service"

# Поганий коміт (занадто багато у одному)
git commit -m "feat(architect): add service, dto, controller, tests, and fix typo"
```

**Частота комітів:**

- 🎯 **Оптимально:** 3-10 комітів на день
- ⚠️ **Занадто часто:** Коміт кожні 5 хвилин (WIP spam)
- ⚠️ **Занадто рідко:** Один коміт на тиждень (важко зрозуміти зміни)

### 4. Push змін

```bash
# Перший push (створює гілку на remote)
git push -u origin feature/architect-agent-draft-creation

# Наступні pushes
git push

# Якщо треба force push (обережно!)
# Тільки якщо ви єдиний хто працює у гілці
git push --force-with-lease  # Безпечніше ніж --force
```

**Коли пушити:**

✅ Наприкінці робочого дня (backup)
✅ Перед тим як піти на обід (якщо важлива робота)
✅ Коли готові відкрити PR
✅ Коли хочете показати прогрес команді

❌ Після кожного коміту (якщо не закінчили функціональність)

### 5. Синхронізація з main

Якщо main оновився поки ви працювали:

```bash
# Варіант 1: Rebase (рекомендовано, чистіший history)
git checkout feature/your-branch
git fetch origin
git rebase origin/main

# Якщо є конфлікти: 
# 1. Вирішіть конфлікти у файлах
# 2. git add <resolved-files>
# 3. git rebase --continue

# Після rebase, force push (бо історія змінилась)
git push --force-with-lease

# Варіант 2: Merge (простіше, але "бруднішим" history)
git checkout feature/your-branch
git merge origin/main
git push
```

**Коли синхронізуватись:**

✅ Перед відкриттям PR
✅ Якщо main має зміни що впливають на вашу роботу
✅ Якщо виникли конфлікти у PR

### 6. Створення Pull Request

```bash
# 1. Переконатись що все закомічено та запушено
git status  # Має бути clean

# 2. Переконатись що синхронізовані з main
git fetch origin
git rebase origin/main  # або merge

# 3. Push
git push --force-with-lease  # Якщо робили rebase

# 4. Відкрити PR на GitHub
# Перейти на https://github.com/your-org/your-repo
# GitHub автоматично запропонує створити PR
```

### 7. Code Review та мердж

```bash
# Після схвалення PR: 
# 1. GitHub автоматично мерджить (Squash and merge або Rebase and merge)
# 2. Видаліть гілку на GitHub (checkbox "Delete branch")

# 3. Локально:
git checkout main
git pull origin main

# 4. Видаліть локальну feature гілку
git branch -d feature/architect-agent-draft-creation

# Якщо гілка не змерджена але ви впевнені: 
git branch -D feature/architect-agent-draft-creation

# 5. Очистити застарілі remote branches
git fetch --prune
```

## Commit Message Format

### Формат (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type (обов'язковий)

| Type       | Коли використовувати            | Приклад                                       |
|------------|---------------------------------|-----------------------------------------------|
| `feat`     | Нова функціональність           | `feat(architect): add draft creation`         |
| `fix`      | Виправлення бага                | `fix(kanban): drag and drop on mobile`        |
| `docs`     | Тільки документація             | `docs(readme): add setup instructions`        |
| `style`    | Форматування, не впливає на код | `style(backend): fix indentation`             |
| `refactor` | Рефакторинг (не feat, не fix)   | `refactor(github): extract PR service`        |
| `perf`     | Performance покращення          | `perf(database): add index on taskId`         |
| `test`     | Додавання тестів                | `test(workflow): add unit tests`              |
| `chore`    | Maintenance, deps               | `chore(deps): update prettier to 3.2.5`       |
| `ci`       | CI/CD зміни                     | `ci(github): add caching to workflow`         |
| `build`    | Build system зміни              | `build(docker): optimize image size`          |
| `revert`   | Revert попереднього коміту      | `revert: feat(architect): add draft creation` |

### Scope (опціональний, але рекомендований)

Scope вказує на модуль/частину проєкту:

**Backend scopes:**

- `architect` — Architect Agent
- `workflow` — Workflow Agent
- `code-review` — Code Review Agent
- `documentation` — Documentation Agent
- `github` — GitHub Integration
- `ai-provider` — AI Provider Integration
- `database` — Database Service
- `queue` — Queue/Events
- `api` — API endpoints

**Frontend scopes:**

- `kanban` — Kanban board
- `draft-viewer` — Draft viewer
- `conversation-form` — Conversation form
- `ui` — UI components

**Shared scopes:**

- `shared` — Shared code
- `types` — TypeScript types
- `deps` — Dependencies
- `config` — Configuration

### Subject (обов'язковий)

Правила:

- ✅ Короткий (50 символів макс)
- ✅ Нижній регістр першої літери (sentence-case)
- ✅ Без крапки наприкінці
- ✅ Imperative mood ("add" не "added" або "adds")
- ✅ Що робить цей коміт (не що ви зробили)

```bash
# ✅ Добре
feat(architect): add draft creation service
fix(kanban): resolve drag and drop issue
docs(adr): add git workflow decision

# ❌ Погано
feat(architect): Added draft creation service  # "Added" замість "add"
fix(kanban): Resolves drag and drop issue.      # Крапка наприкінці
docs:  updated documentation                     # "updated" замість "update", немає scope
FIX: bug                                        # Uppercase, не описово
```

### Body (опціональний)

Використовуйте body коли:

- Треба пояснити "чому" а не "що"
- Зміна нетривіальна
- Є контекст який важливий

```bash
git commit -m "feat(architect): add draft creation service

Implements ArchitectAgentService with AI provider integration. 
The service analyzes conversation text and creates structured
drafts using OpenAI API.

Uses exponential backoff retry strategy for API failures."
```

### Footer (опціональний)

Використовуйте footer для:

- Посилання на issues:  `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: ... `
- Co-authors: `Co-authored-by: Name <email>`

```bash
git commit -m "feat(api): change task status endpoint

BREAKING CHANGE: /tasks/: id/status now requires authentication

Closes #123
Co-authored-by: Ivan Petrov <ivan@example. com>"
```

### Приклади commit messages

#### Проста функціональність

```bash
feat(architect): add draft creation endpoint
```

#### З body

```bash
feat(workflow): add branch creation logic

Creates feature branches following the naming convention:
feature/<task-id>-<short-description>

Uses GitHub API with Octokit for branch creation.
```

#### Виправлення бага

```bash
fix(kanban): prevent card duplication on drop

Fixed issue where dropping a card quickly would create
duplicates due to race condition in state updates. 

Fixes #234
```

#### З breaking change

```bash
feat(api): migrate to GraphQL

BREAKING CHANGE: REST API endpoints are deprecated. 
Use GraphQL endpoint /graphql instead. 

Migration guide: docs/migration-to-graphql.md

Closes #100
```

#### Множинні зміни

```bash
chore(deps): update dependencies

- prettier@3.2.4 → 3.2.5
- eslint@8.56.0 → 8.57.0
- typescript@5.3.3 → 5.4.0
```

#### Revert

```bash
revert: feat(architect): add draft creation endpoint

This reverts commit abc123def456.

Reason: discovered critical bug in AI provider integration. 
Will re-implement with proper error handling.
```

### WIP Commits

Іноді треба закомітити незакінчену роботу (наприклад backup перед тим як піти):

```bash
# Використовуйте префікс WIP: 
git commit --no-verify -m "WIP: architect service implementation"

# Або
git commit --no-verify -m "wip(architect): draft creation in progress"

# ⚠️ --no-verify пропускає pre-commit hooks
# ⚠️ Не пушити WIP коміти без потреби
# ⚠️ Перед PR — squash WIP коміти у нормальний коміт
```

## Squashing Commits

Якщо у вашій гілці багато дрібних комітів, squash перед PR:

### Інтерактивний rebase

```bash
# Останні 5 комітів
git rebase -i HEAD~5

# Або від початку гілки
git rebase -i origin/main
```

У редакторі:

```
pick abc123 feat(architect): add service
pick def456 feat(architect): add dto
pick ghi789 fix(architect): typo
pick jkl012 test(architect): add tests
pick mno345 style(architect): format code

# Змініть на:
pick abc123 feat(architect): add service
squash def456 feat(architect): add dto
squash ghi789 fix(architect): typo
squash jkl012 test(architect): add tests
squash mno345 style(architect): format code

# Збережіть, напишіть final commit message: 
# feat(architect): add draft creation service
#
# - Implements ArchitectAgentService
# - Adds CreateDraftDto
# - Includes unit tests
```

```bash
# Force push (історія змінилась)
git push --force-with-lease
```

### Або використовуйте GitHub "Squash and merge"

При мердж PR на GitHub:

- **Squash and merge** — всі коміти гілки стануть одним у main
- **Rebase and merge** — всі коміти додаються у main (зберігається history)
- **Create merge commit** — створює merge commit (не рекомендовано для GitHub Flow)

**Рекомендація:  Squash and merge** для чистого history.

## Protected Branch Rules (main)

### GitHub Settings

```yaml
Branch protection rules for "main":

    ✅ Require pull request before merging
✅ Require approvals: 1 (для команди) або 0 (для solo)
    ✅ Dismiss stale reviews when new commits are pushed

    ✅ Require status checks before merging
    ✅ Require branches to be up to date
Status checks:
    - CI / lint
    - CI / type-check
    - CI / test
    - CI / build

    ✅ Require conversation resolution before merging

    ✅ Do not allow bypassing settings (навіть для адмінів)

    ✅ Automatically delete head branches (після мерджу)
```

## Git Commands Cheat Sheet

### Початок роботи

```bash
# Clone repo
git clone https://github.com/your-org/ai-workflow-assistant.git
cd ai-workflow-assistant

# Install dependencies
pnpm install

# Створити гілку
git checkout -b feature/my-feature
```

### Щоденна робота

```bash
# Статус
git status

# Додати файли
git add . 
git add path/to/file

# Коміт
git commit -m "feat(scope): description"

# Push
git push

# Pull latest main
git checkout main
git pull origin main
```

### Синхронізація

```bash
# Оновити main
git checkout main
git pull origin main

# Rebase feature гілку
git checkout feature/my-feature
git rebase origin/main

# Якщо конфлікти:
git status  # Подивитись конфлікти
# Вирішити у файлах
git add <resolved-files>
git rebase --continue

# Push після rebase
git push --force-with-lease
```

### Cleanup

```bash
# Видалити локальну гілку
git branch -d feature/my-feature

# Видалити remote гілку
git push origin --delete feature/my-feature

# Очистити застарілі remote branches
git fetch --prune

# Подивитись всі гілки
git branch -a
```

### Помилки та їх виправлення

```bash
# Забули додати файл у останній коміт
git add forgotten-file.ts
git commit --amend --no-edit

# Змінити останній commit message
git commit --amend -m "new message"

# Скасувати останній коміт (зберегти зміни)
git reset --soft HEAD~1

# Скасувати останній коміт (видалити зміни) ⚠️
git reset --hard HEAD~1

# Скасувати конкретний коміт (створює новий revert commit)
git revert abc123

# Видалити uncommitted зміни ⚠️
git checkout -- . 

# Stash зміни (збережи на потім)
git stash
git stash pop  # Повернути назад
```

## Наслідки

### Позитивні:

- ✅ Чистий та зрозумілий git history
- ✅ Легко знайти коли та чому щось змінилось
- ✅ Автоматична генерація CHANGELOG
- ✅ Semantic versioning можливий
- ✅ Code review через PR
- ✅ CI/CD integration

### Негативні:

- ⚠️ Потрібна дисципліна (дотримуватись conventions)
- ⚠️ Трохи більше часу на написання commit messages

### Нейтральні:

- Команда повинна навчитись conventional commits
- Треба налаштувати branch protection на GitHub

## Примітки

- Використовуємо GitHub Flow (проста стратегія)
- Conventional Commits для messages
- Squash and merge для чистого history
- Protected main branch
- Feature branches живуть коротко (1-3 дні)
- Rebase для синхронізації з main (чистіший history)
