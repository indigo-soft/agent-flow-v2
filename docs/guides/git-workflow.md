# Git Workflow Guide

**⚠️ ОБОВ'ЯЗКОВО ДО ПРОЧИТАННЯ перед початком розробки**

Цей гайд описує як працювати з Git у нашому проєкті.

## Зміст

- [Branching Strategy](#branching-strategy)
- [Створення гілок](#створення-гілок)
- [Naming Conventions](#naming-conventions)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Merge Strategy](#merge-strategy)
- [Приклади Workflow](#приклади-workflow)
- [Troubleshooting](#troubleshooting)

## Branching Strategy

Ми використовуємо **GitHub Flow**:

- **`main`** — єдина довготривала гілка, завжди deployable
- **Feature branches** — короткочасні, для кожної задачі
- **Pull Requests** — код ревʼю перед мерджем у main

### Структура

```
main (protected) ← завжди тут продакшн-ready код
  ├── feature/0001-architect-agent
  ├── feature/0042-kanban-board
  ├── fix/0123-database-connection
  └── docs/0099-api-documentation
```

## Створення гілок

### 1. Оновіть main

```bash
git checkout main
git pull origin main
```

### 2. Створіть нову гілку

```bash
git checkout -b <type>/<issue-number>-<short-description>
```

**⚠️ ВАЖЛИВО:** Номер issue є обов'язковим (мінімум 4 цифри).

**Приклади:**

```bash
git checkout -b feature/0001-architect-agent-implementation
git checkout -b fix/0042-kanban-drag-drop
git checkout -b docs/0099-api-endpoints
git checkout -b feature/1234-workflow-integration
```

## Naming Conventions

### Формат назви гілки

```
<type>/<issue-number>-<short-description>
```

**⚠️ ОБОВ'ЯЗКОВІ ПРАВИЛА:**

- Номер issue є **ОБОВ'ЯЗКОВИМ** для всіх гілок
- Мінімум 4 цифри (додати нулі спереду якщо потрібно)
- Якщо немає issue — створіть його перед початком роботи
- Не може бути гілки без номера issue

### Types

| Type        | Використання          | Приклад                          |
|-------------|-----------------------|----------------------------------|
| `feature/`  | Нова функціональність | `feature/0123-workflow-agent`    |
| `fix/`      | Виправлення бага      | `fix/0042-prisma-timeout`        |
| `docs/`     | Документація          | `docs/0099-readme-update`        |
| `refactor/` | Рефакторинг           | `refactor/0001-extract-service`  |
| `test/`     | Додавання тестів      | `test/0055-architect-unit-tests` |
| `chore/`    | Maintenance           | `chore/1234-update-deps`         |
| `perf/`     | Performance           | `perf/0088-optimize-queries`     |

### Правила назв

✅ **Добре:**

- `feature/0123-architect-draft-creation`
- `fix/0042-kanban-mobile-drag`
- `docs/0099-adr-git-workflow`
- `feature/1234-workflow-integration`
- `chore/5678-update-dependencies`

❌ **Погано:**

- `feature/NewFeature` (не CamelCase, немає issue)
- `myBranch` (немає типу, немає issue)
- `fix-bug` (не описово, немає типу, немає issue)
- `feature/123-auth-bug` (менше ніж 4 цифри)
- `feature/fix-auth-bug` (немає issue-number)
- `feature/додавання-функції` (не англійська, немає issue)

## Commit Messages

> 💡 **Commit Message Template:** The project includes a `.gitmessage` template that shows all
> valid types and scopes. Run `pnpm setup` after cloning to configure it automatically, or manually:
> ```bash
> git config commit.template .gitmessage
> ```

### Формат (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**⚠️ ВАЖЛИВО:** Scope є **ОБОВ'ЯЗКОВИМ**!

### Type

Той самий що й для гілок: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

### Scope (ОБОВ'ЯЗКОВИЙ!)

Модуль проєкту:

**Backend:** `architect`, `workflow`, `code-review`, `documentation`, `github`, `ai-provider`, `database`, `queue`,
`api`, `common`

**Frontend:** `kanban`, `draft-viewer`, `conversation-form`, `ui`, `lib`

**Shared:** `shared`, `types`, `deps`, `config`

**Правила scope:**

- ✅ Завжди в **kebab-case**
- ✅ Один з перелічених вище
- ❌ Не може бути порожнім

### Subject (ОБОВ'ЯЗКОВИЙ!)

- **Максимум 72 символів** (було 50)
- **Lowercase першої літери** (sentence-case)
- **Imperative mood** ("add" не "added")
- **Без крапки наприкінці**
- Без крапки наприкінці

### Приклади

```bash
# Простий
feat(architect): add draft creation service

# З body
feat(workflow): add branch creation logic

Creates feature branches using GitHub API. 
Follows naming convention: feature/<task-id>-<description>

# З footer
fix(kanban): prevent card duplication

Fixes race condition in drag and drop handler. 

Fixes #234

# Breaking change
feat(api): migrate to GraphQL

BREAKING CHANGE: REST endpoints deprecated. 
Use /graphql endpoint instead. 

Closes #100
```

### Коли комітити

✅ **Робіть коміт коли:**

- Завершили логічну одиницю роботи
- Код компілюється
- Тести проходять
- Lint перевірки OK

❌ **НЕ комітьте:**

- Код, що не компілюється
- Закоментований код
- `console.log` для debug
- Незавершені функції (або використайте `WIP: `)

### WIP Commits

Якщо треба закомітити незавершену роботу:

```bash
git commit --no-verify -m "WIP: architect service in progress"
```

⚠️ **Перед PR:** squash WIP коміти!

## Pull Requests

### Створення PR

1. **Переконайтесь, що синхронізовані з main:**
   ```bash
   git fetch origin
   git rebase origin/main
   git push --force-with-lease
   ```

2. **Відкрийте PR на GitHub**
    - Перейдіть на https://github.com/your-org/your-repo
    - Натисніть "Compare & pull request"

3. **Заповніть PR template:**
    - Опишіть, що змінено
    - Чому (посилання на issue)
    - Як тестувати
    - Checklist

### PR Title

Той самий формат, що й commit:

```
feat(architect): add draft creation service
```

### PR Description Template

```markdown
## Що змінено

- Додано ArchitectAgentService
- Додано endpoint POST /drafts
- Додано unit тести

## Чому

Closes #123

Потрібен сервіс для створення чернеток планів з неструктурованого тексту. 

## Як тестувати

1. Запустіть backend:  `pnpm --filter backend dev`
2. Надішліть POST до /drafts з body:  `{ "conversationText": "..." }`
3. Перевірте відповідь

## Checklist

- [x] Тести додано/оновлено
- [x] Документація оновлена
- [x] Lint перевірки пройдено
- [x] Type check пройдено
```

### Code Review

- Відповідайте на коментарі
- Робіть запитані зміни
- Push у ту ж гілку (PR оновиться автоматично)

## Merge Strategy

Використовуємо **Squash and Merge**:

- Усі коміти гілки стають одним комітом у main
- Чистий linear history
- Легко робити revert, якщо потрібно

### Після мерджу

```bash
# 1. Видалити гілку на GitHub (checkbox "Delete branch")

# 2. Локально:
git checkout main
git pull origin main

# 3. Видалити локальну feature гілку
git branch -d feature/0001-my-feature

# 4. Очистити застарілі remote branches
git fetch --prune
```

## Приклади Workflow

### Приклад 1: Проста функціональність

```bash
# День 1: Початок (issue #0025 вже створено)
git checkout main
git pull origin main
git checkout -b feature/0025-add-logging

# Робота... 
git add apps/backend/src/common/logger.service.ts
git commit -m "feat(backend): add Pino logger service"

git add apps/backend/src/common/logger.module.ts
git commit -m "feat(backend): add logger module"

git push -u origin feature/0025-add-logging

# День 2: Завершення
git add apps/backend/src/common/__tests__/logger.spec.ts
git commit -m "test(backend): add logger service tests"

git add docs/guides/logging.md
git commit -m "docs(backend): add logging guide"

git push

# Відкрити PR на GitHub
# Після схвалення та мерджу: 
git checkout main
git pull origin main
git branch -d feature/0025-add-logging
```

### Приклад 2: Із синхронізацією в main

```bash
# Ви працюєте у гілці (issue #0123)... 
git checkout feature/0123-kanban-board

# Main оновився (хтось змерджив іншу PR)
# Синхронізуйтесь: 
git fetch origin
git rebase origin/main

# Якщо є конфлікти:
# 1. Вирішіть у файлах
# 2. git add <resolved-files>
# 3. git rebase --continue

git push --force-with-lease

# Продовжуйте роботу...
```

### Приклад 3: Виправлення після code review

```bash
# PR створено (issue #0042), отримали коментарі від рев'ювера

# Внесіть зміни
git add . 
git commit -m "fix(kanban): address review comments"

git push

# PR автоматично оновиться
# Після схвалення — мердж
```

## Troubleshooting

### "I committed to main by mistake"

```bash
# Якщо ще не запушили:
git reset --soft HEAD~1  # Скасувати коміт, зберегти зміни

# Створіть правильну гілку (з issue number!)
git checkout -b feature/0123-my-feature
git push -u origin feature/0123-my-feature
```

### "I need to change the last commit message"

```bash
git commit --amend -m "new message"

# Якщо вже запушили:
git push --force-with-lease
```

### "I forgot to add a file to the commit"

```bash
git add forgotten-file.ts
git commit --amend --no-edit

# Якщо вже запушили:
git push --force-with-lease
```

### "I want to undo local changes"

```bash
# Скасувати uncommitted зміни
git checkout -- . 

# Або
git restore . 

# ��касувати останній коміт (зберегти зміни)
git reset --soft HEAD~1

# Скасувати останній коміт (видалити зміни) ⚠️
git reset --hard HEAD~1
```

### "Merge conflict during rebase"

```bash
# 1. Подивіться конфліктні файли
git status

# 2. Відкрийте файли, знайдіть маркери
<<<<<<< HEAD
код з main
=======
ваш код
>>>>>>> feature/my-feature

# 3. Вирішіть конфлікти (видаліть маркери, залиште правильний код)

# 4. Додайте вирішені файли
git add <resolved-files>

# 5. Продовжте rebase
git rebase --continue

# 6. Якщо хочете скасувати rebase: 
git rebase --abort
```

### "I pushed sensitive data (passwords, keys)"

⚠️ **ТЕРМІНОВА ДІЯ:**

```bash
# 1. Видаліть секрет з коду
# 2. Коміт
git commit -m "fix:  remove sensitive data"

# 3. Force push
git push --force-with-lease

# 4. ⚠️ ВАЖЛИВО: Змініть/rotate секрети! 
# GitHub зберігає історію, секрети все ще можна знайти
```

Краще:

- Використовуйте `.env` файли (додані у `.gitignore`)
- Ніколи не комітьте секрети

## Git Commands Quick Reference

```bash
# Status та інфо
git status
git log --oneline --graph --all
git branch -a

# Гілки
git checkout main
git checkout -b feature/0123-new-feature
git branch -d feature/0042-old-feature

# Синхронізація
git fetch origin
git pull origin main
git push origin feature/0123-my-feature

# Коміти
git add .
git commit -m "message"
git commit --amend

# Rebase
git rebase origin/main
git rebase --continue
git rebase --abort

# Reset
git reset --soft HEAD~1   # Скасувати коміт, зберегти зміни
git reset --hard HEAD~1   # Скасувати коміт і зміни

# Cleanup
git fetch --prune
git branch -d feature/0042-done-feature
```

## Додаткові ресурси

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Book](https://git-scm.com/book/en/v2)

## Питання?

- Перевірте [ADR-015](../adr/015-git-workflow-branching-strategy.md)
