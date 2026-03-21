# ADR-004: Використання PostgreSQL з Prisma ORM

## Статус

Прийнято

## Контекст

Проєкт потребує реляційної бази даних для зберігання:

- Чернеток планів
- Завдань (епіки, задачі, підзадачі) з ієрархією
- Критеріїв готовності
- Артефактів (файли, посилання)
- Метаданих (GitHub PR ID, branch name тощо)
- Історії змін статусів

Вимоги:

- Підтримка складних запитів (joins, filtering)
- Транзакції для атомарних операцій
- Міграції схеми
- Type-safety для TypeScript
- Можливість зберігати JSON дані (артефакти, метадані)

Розглянуті альтернативи:

**БД:**

- PostgreSQL
- MariaDB/MySQL
- SQLite

**ORM:**

- Prisma
- TypeORM
- Drizzle ORM
- Zenstack (обгортка над Prisma)

## Рішення

Використовуємо **PostgreSQL** як базу даних та **Prisma** як ORM.

## Обґрунтування

### Чому PostgreSQL:

1. **JSON/JSONB підтримка**
    - Ідеально для зберігання артефактів, метаданих
    - Індексування JSON полів
    - Запити всередині JSON структур

2. **Складні типи даних**
    - Arrays
    - ENUM типи (для статусів завдань)
    - Full-text search (якщо знадобиться)

3. **Reliability**
    - ACID compliance
    - Надійні транзакції
    - Proven у production

4. **Екосистема**
    - Найкраща підтримка у Node.js
    - Величезна кількість інструментів
    - Відмінний Prisma support

5. **Розширюваність**
    - Row Level Security (для multi-tenancy у майбутньому)
    - Extensions (pg_trgm для fuzzy search тощо)
    - Partitioning для великих таблиць

### Чому Prisma:

1. **Type Safety**
    - Автогенерація TypeScript типів з schema
    - Compile-time перевірка запитів
    - Autocomplete для всіх запитів

2. **Developer Experience**
    - Декларативна схема (легко читати)
    - Prisma Studio (GUI для перегляду даних)
    - Чудова документація

3. **Міграції**
    - Автоматична генерація міграцій
    - Rollback можливість
    - Version control для schema

4. **Інтеграція з NestJS**
    - Простий PrismaService через DI
    - Middleware підтримка
    - Logging та error handling

5. **Performance**
    - Connection pooling
    - Query optimization
    - Prepared statements

6. **Relations**
    - Зручна робота з вкладеними сутностями
    - Eager/lazy loading
    - Cascade operations

### Чому не інші варіанти:

**MariaDB/MySQL:**

- ❌ Гірша JSON підтримка
- ❌ Менше можливостей для складних типів
- ✅ Трохи швидший для простих queries (але не критично)

**TypeORM:**

- ❌ Гірша type safety
- ❌ Active Record pattern (більше coupling)
- ❌ Складніші міграції
- ✅ Більше можливостей для складних scenarios (не потрібно для MVP)

**Drizzle ORM:**

- ❌ Менша спільнота
- ❌ Менше матеріалів/прикладів
- ✅ Трохи більше контролю (не потрібно)

**Zenstack:**

- ❌ Overkill для MVP (додає access control policies)
- ❌ Ще один шар абстракції
- ✅ Корисний для складних multi-tenant додатків (не наш case)

## Наслідки

### Позитивні:

- Повна type-safety від БД до API
- Легкість рефакторингу схеми
- Prisma Studio для debugging
- Простота тестування (легко створити test DB)

### Негативні:

- Prisma генерує багато коду (node_modules розмір)
- Деякі edge cases можуть потребувати raw SQL
- Трохи більший overhead порівняно з raw queries

### Нейтральні:

- Команда повинна розуміти Prisma schema синтаксис
- Міграції треба комітити у git

## Схема даних (приклад)

```prisma
// prisma/schema. prisma

model Draft {
  id        String   @id @default(cuid())
  content   String
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tasks Task[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(NEW)
  priority    Int        @default(0)
  
  // Ієрархія
  parentId    String?
  parent      Task?      @relation("TaskHierarchy", fields: [parentId], references: [id])
  subtasks    Task[]     @relation("TaskHierarchy")
  
  // GitHub integration
  branchName  String? 
  prId        Int? 
  prUrl       String?
  
  // Артефакти
  artifacts   Json? 
  
  // Критерії готовності
  acceptanceCriteria String[]
  
  // Timestamps
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  startedAt   DateTime?
  completedAt DateTime?
  
  draftId     String
  draft       Draft      @relation(fields: [draftId], references: [id])
  
  @@index([status])
  @@index([parentId])
}

enum TaskStatus {
  NEW
  PLANNED
  IN_PROGRESS
  IN_REVIEW
  CHANGES_REQUESTED
  DONE
  ERROR
}
```

## Примітки

- Використовуємо PostgreSQL 15+
- Використовуємо Prisma 5.x
- Налаштовуємо connection pooling через `pgbouncer` для production
- Регулярні backups БД
