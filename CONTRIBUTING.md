# Contributing Guide

Дякуємо за інтерес до проєкту! Цей гайд допоможе вам почати.

## 📋 Перед початком

1. ✅ Прочитайте [Git Workflow Guide](docs/guides/git-workflow.md)
2. ✅ Налаштуйте середовище розробки (див. [README.md](README.md))
3. ✅ Ознайомтесь з [Code of Conduct](CODE_OF_CONDUCT.md)

## 🔀 Git Workflow

### TL;DR

```bash
# 1. Створити гілку
git checkout -b feature/my-feature

# 2. Робити коміти
git commit -m "feat(scope): description"

# 3. Push
git push -u origin feature/my-feature

# 4. Відкрити PR на GitHub
```

### Детальний процес

1. **Fork та Clone** (для зовнішніх контриб'юторів)
   ```bash
   git clone https://github.com/YOUR-USERNAME/ai-workflow-assistant.git
   cd ai-workflow-assistant
   git remote add upstream https://github.com/ORIGINAL-OWNER/ai-workflow-assistant. git
   ```

2. **Створіть гілку від main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/descriptive-name
   ```

3. **Зробіть зміни**
    - Пишіть код
    - Додавайте тести
    - Оновлюйте документацію

4. **Коміт за Conventional Commits**
   ```bash
   git add .
   git commit -m "feat(module): add new feature"
   ```

   **Формат:**
   ```
   <type>(<scope>): <description>
   
   [optional body]
   
   [optional footer]
   ```

   **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

   **Приклади:**
   ```bash
   feat(architect): add draft creation service
   fix(kanban): resolve drag and drop on mobile
   docs(readme): update installation steps
   test(workflow): add unit tests for branch creation
   ```

5. **Push та створіть PR**
   ```bash
   git push -u origin feature/descriptive-name
   ```

   Потім відкрийте PR на GitHub.

## ✅ PR Checklist

Перед створенням PR переконайтесь, що:

- [ ] Код відповідає [Coding Standards](docs/guides/coding-standards.md)
- [ ] Усі тести проходять (`pnpm test`)
- [ ] Додано нові тести (якщо потрібно)
- [ ] ESLint перевірка пройшла (`pnpm lint`)
- [ ] Prettier форматування виконано (`pnpm format`)
- [ ] Type check пройшов (`pnpm typecheck`)
- [ ] Оновлено документацію (якщо потрібно)
- [ ] Commit messages відповідають Conventional Commits
- [ ] PR має описовий title
- [ ] PR description пояснює "що" та "чому"

## 📝 PR Template

GitHub автоматично підставить template (див. [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)).

Заповніть усі секції:

- **Що змінено**
- **Чому** (посилання на issue)
- **Як тестувати**
- **Screenshots** (для UI змін)
- **Checklist**

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific module
pnpm --filter @agent-flow/backend test

# Run tests in watch mode
pnpm test --watch
```

## 🎨 Code Style

Проєкт використовує:

- **ESLint** для лінтингу
- **Prettier** для форматування
- **Husky** для git hooks

Усе запускається автоматично при коміті.

**Вручну:**

```bash
pnpm lint          # Check
pnpm lint:fix      # Fix

pnpm format        # Format all
pnpm format:check  # Check formatting
```

## 📚 Документація

При додаванні нової функціональності оновіть:

- [ ] Code comments (JSDoc для публічних API)
- [ ] README.md (якщо змінився setup/usage)
- [ ] API документацію (`docs/api/`)
- [ ] Гайди (`docs/guides/`) якщо потрібно
- [ ] ADR (`docs/adr/`) для архітектурних рішень

## 🐛 Bug Reports

Використовуйте [Issue Template](.github/ISSUE_TEMPLATE/bug_report.md).

Обов'язково включіть:

- Кроки для відтворення
- Очікувана поведінка
- Фактична поведінка
- Environment (OS, Node version, etc.)
- Logs/screenshots

## 💡 Feature Requests

Використовуйте [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md).

Опишіть:

- Use case (навіщо потрібна функція)
- Запропоноване рішення
- Альтернативи, які ви розглядали

## ❓ Питання

Є питання?

- Перевірте [документацію](docs)

## 📜 License

Контрибутячи, ви погоджуєтесь, що ваш код буде під [MIT License](LICENSE.md).

## 🙏 Дякуємо!

Кожен внесок цінний, незалежно від розміру! 
