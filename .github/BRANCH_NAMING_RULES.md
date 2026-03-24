# Branch Naming Rules

## ⚠️ ВАЖЛИВО: Обов'язкові правила

### Формат

```
<type>/<issue-number>-<short-description>
```

### Правила номеру issue

- ✅ **ОБОВ'ЯЗКОВИЙ** для всіх гілок
- ✅ **Мінімум 4 цифри** (з нулями спереду, якщо потрібно)
- ✅ Приклади: `0001`, `0042`, `0123`, `1234`, `5678`
- ⚠️ **Якщо немає issue — СТВОРІТЬ його перед створенням гілки!**
- ❌ **Не може бути гілки без номера issue**

### Types

| Type        | Використання          |
|-------------|-----------------------|
| `feature/`  | Нова функціональність |
| `fix/`      | Виправлення бага      |
| `docs/`     | Документація          |
| `refactor/` | Рефакторинг           |
| `test/`     | Додавання тестів      |
| `chore/`    | Maintenance           |
| `perf/`     | Performance           |

### ✅ Правильні приклади

```bash
feature/0001-architect-agent-implementation
feature/0042-kanban-drag-drop
feature/0123-github-integration
feature/1234-workflow-automation
fix/0099-database-connection-timeout
docs/0055-api-documentation-update
chore/5678-update-dependencies
```

### ❌ Неправильні приклади

```bash
feature/my-feature              # Немає номеру issue
feature/1-bug-fix               # Менше 4 цифр
feature/42-new-feature          # Менше 4 цифр
feature/123-implementation      # Менше 4 цифр
my-branch                       # Немає типу та issue
feature/NewFeature              # Немає issue, не kebab-case
```

## Швидкий старт

```bash
# 1. Створіть або знайдіть issue на GitHub
# Наприклад, issue #42

# 2. Створіть гілку з 4-значним номером
git checkout -b feature/0042-your-feature-name

# 3. Якщо issue номер >= 1000, використовуйте як є
git checkout -b feature/1234-your-feature-name
```

## Автоматична валідація

Проєкт має Git hook, який автоматично перевіряє формат назви гілки при push.

Якщо назва гілки неправильна, ви побачите помилку з детальними інструкціями.

## Додатково

- Детальніше: [docs/guides/git-workflow.md](../docs/guides/git-workflow.md)
- Naming Conventions: [docs/guides/naming-conventions.md](../docs/guides/naming-conventions.md)
- ADR: [docs/adr/015-git-workflow-branching-strategy.md](../docs/adr/015-git-workflow-branching-strategy.md)
