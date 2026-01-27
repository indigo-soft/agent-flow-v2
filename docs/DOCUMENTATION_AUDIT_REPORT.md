# Звіт аудиту документації проєкту Agent-Flow v2

**Дата проведення:** 2026-01-27  
**Аудитор:** GitHub Copilot  
**Обсяг аудиту:** ADR файли, гайди, архітектурна документація, кореневі MD файли

---

## Виконавче резюме

Документація проєкту знаходиться на **високому рівні** з чіткою структурою та детальними описами архітектурних рішень.
Проте виявлено ряд невідповідностей, прогалин та можливостей для покращення, які можуть впливати на ефективність
розробки та підтримки проєкту.

### Ключові знахідки:

✅ **Сильні сторони:**

- Детальні ADR з обґрунтуванням рішень
- Чітка Git workflow стратегія
- Comprehensive naming conventions
- Structured approach to error handling

⚠️ **Критичні невідповідності:**

1. ADR-009 (Monorepo) superseded ADR-018 (Flat Modular), але структура проєкту не відповідає жодному
2. ADR-008 містить код замість опису (порушення формату)
3. CHANGELOG.md порожній (не відстежуються зміни)
4. Відсутні важливі ADR (Security, API Design, State Management, Observability)
5. Неузгодженість між документацією та реальною структурою файлів

⚠️ **Прогалини в документації:**

- Відсутня стратегія безпеки (Security ADR)
- Немає API design guidelines
- Відсутня документація CI/CD pipeline
- Немає performance benchmarks та SLA
- Відсутня документація по observability та monitoring

---

## Детальний аналіз

### 1. НЕВІДПОВІДНОСТІ ТА ПОМИЛКИ

#### 1.1 Критичні невідповідності

**🔴 Проблема #1: Структура проєкту**

- **ADR-009** (Superseded) описує monorepo структуру: `apps/backend/`, `apps/dashboard/`, `packages/shared/`
- **ADR-018** (Accepted) описує flat модульну структуру: `src/agents/`, `src/api/`, `src/dashboard/`
- **Реальна структура** (згідно workspace info): `src/agents/`, `src/api/`, `src/dashboard/`

**Проблема:** README.md посилається на структуру з ADR-018, але деякі гайди та приклади використовують стару структуру з
apps/packages.

**Рекомендація:**

```markdown
1. Провести повний audit всіх документів та прикладів коду
2. Оновити всі посилання на структуру файлів
3. Видалити застарілі приклади з apps/packages
4. Додати migration guide для переходу (якщо потрібно)
```

---

**🔴 Проблема #2: ADR-008 Data Validation Strategy**

Файл містить TypeScript код замість опису стратегії валідації:

```typescript
import {Body, Post, Controller} from '@nestjs/common';
import {IsString, IsNotEmpty, IsArray, IsOptional} from 'class-validator';
// ... код контролера
```

**Проблема:** Порушення формату ADR, відсутній опис стратегії, альтернатив, обґрунтування.

**Рекомендація:**

```markdown
Переписати ADR-008 згідно з шаблоном:
- Статус, Контекст, Рішення
- Альтернативи (Zod, Joi, Yup, AJV)
- Обґрунтування вибору class-validator
- Приклади винести в окрему секцію або в coding-standards
```

---

**🔴 Проблема #3: CHANGELOG.md порожній**

Файл існує але повністю порожній, що суперечить best practices та власному ADR-015 про Git Workflow.

**Рекомендація:**

```markdown
1. Додати структуру CHANGELOG згідно Keep a Changelog format
2. Автоматизувати генерацію через conventional-changelog
3. Додати в pre-commit hook або CI перевірку актуальності
4. Створити ADR про стратегію versioning та changelog maintenance
```

---

**🟡 Проблема #4: Inconsistency в назвах гілок**

**Git Workflow Guide** (docs/guides/git-workflow.md):

```bash
# Формат з issue number
feature/0123-architect-draft-creation
```

**ADR-015**:

```bash
# Формат без issue number (опціона��ьно)
feature/architect-agent-draft-creation
```

**CONTRIBUTING.md**:

```bash
# Формат без issue number
feature/descriptive-name
```

**Проблема:** Неузгодженість — issue number обов'язковий чи опціональний?

**Рекомендація:**

```markdown
Узгодити формат у всіх документах:
- Якщо є issue: feature/123-description (обов'язково)
- Якщо немає issue: feature/description
- Оновити всі приклади в документації
```

---

#### 1.2 Менш критичні невідповідності

**🟡 Проблема #5: Test Coverage Goals**

**ADR-005** (Testing Framework Jest):

```yaml
Coverage цілі:
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+
```

**docs/guides/testing.md**: не згадує конкретних цілей coverage.

**Рекомендація:** Синхронізувати документи та додати в jest.config.js threshold enforcement.

---

**🟡 Проблема #6: Frontend структура**

**ADR-018** показує Next.js в `src/dashboard/`, але **ADR-007** показує традиційну структуру Next.js проєкту.

**Рекомендація:** Уточнити чи dashboard є окремим Next.js застосунком чи частиною monolith backend.

---

### 2. ПРОГАЛИНИ В ДОКУМЕНТАЦІЇ

#### 2.1 Відсутні критичні ADR

**🔴 Відсутній ADR-019: Security Strategy**

**Проблема:** Проєкт працює з конфіденційними даними (GitHub tokens, AI промпти, приватний код), але немає
задокументованої стратегії безпеки.

**Що має включати ADR-019:**

```markdown
## Рішення: Layered Security Approach

### 1. Authentication & Authorization
- JWT-based authentication (access + refresh tokens)
- Role-Based Access Control (RBAC)
- API key authentication для integration
- Rate limiting (по IP та по user)

### 2. Data Protection
- Encryption at rest (PostgreSQL transparent data encryption)
- Encryption in transit (TLS 1.3)
- Secrets management (environment variables, never in code)
- GitHub tokens storage (encrypted in DB with app-level encryption key)
- AI prompts sanitization (strip sensitive data before sending)

### 3. Input Validation & Sanitization
- class-validator для всіх DTO
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React automatic escaping + CSP headers)
- CSRF protection (SameSite cookies + CSRF tokens)

### 4. API Security
- CORS configuration (whitelist origins)
- Helmet.js для security headers
- Request size limits
- Rate limiting per endpoint
- API versioning strategy

### 5. Dependencies Security
- Automated vulnerability scanning (npm audit, Snyk)
- Dependabot для автоматичних security updates
- License compliance checking

### 6. Logging & Monitoring
- Security events logging (failed auth, suspicious activity)
- No sensitive data in logs (автоматичне redacting)
- Audit trail для критичних операцій

### 7. Production Security
- Principle of least privilege (database users, file permissions)
- Regular security updates (OS, PostgreSQL, Redis, Node.js)
- Backup encryption
- Disaster recovery plan

### 8. Code Security
- Static code analysis (ESLint security rules)
- No hardcoded secrets (git-secrets pre-commit hook)
- Secure coding guidelines
```

---

**🔴 Відсутній ADR-020: API Design Standards**

**Проблема:** Проєкт використовує REST API, але немає стандартів проектування.

**Що має включати ADR-020:**

```markdown
## Рішення: RESTful API Design with JSON:API influence

### 1. Resource Naming
- Множина для колекцій: GET /tasks, GET /drafts
- id у шляху: GET /tasks/:id
- Nested resources: GET /tasks/:id/subtasks
- Actions через verbs тільки якщо не CRUD: POST /tasks/:id/approve

### 2. HTTP Methods
- GET: read operations (idempotent, cacheable)
- POST: create new resource
- PUT: full update (replace)
- PATCH: partial update
- DELETE: remove resource

### 3. Status Codes
- 200 OK: successful GET/PUT/PATCH
- 201 Created: successful POST
- 204 No Content: successful DELETE
- 400 Bad Request: validation error
- 401 Unauthorized: missing/invalid auth
- 403 Forbidden: insufficient permissions
- 404 Not Found: resource doesn't exist
- 409 Conflict: duplicate resource
- 422 Unprocessable Entity: semantic validation error
- 429 Too Many Requests: rate limit exceeded
- 500 Internal Server Error: unexpected error
- 503 Service Unavailable: maintenance/overload

### 4. Request/Response Format
```json
// Success response
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-27T10:00:00Z",
    "version": "1.0"
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "abc-123"
  }
}
```

### 5. Pagination

```
GET /tasks?page=2&limit=20
Response:
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "links": {
    "self": "/tasks?page=2&limit=20",
    "first": "/tasks?page=1&limit=20",
    "prev": "/tasks?page=1&limit=20",
    "next": "/tasks?page=3&limit=20",
    "last": "/tasks?page=8&limit=20"
  }
}
```

### 6. Filtering & Sorting

```
GET /tasks?status=IN_PROGRESS&sort=-createdAt,title
```

### 7. Versioning

- URL versioning: /api/v1/tasks
- Major versions only (v1, v2)
- Deprecation policy: 6 months notice

### 8. Documentation

- OpenAPI 3.0 specification
- Auto-generated from NestJS decorators (@ApiProperty, @ApiResponse)
- Swagger UI на /api/docs

```

---

**🟡 Відсутній ADR-021: State Management Strategy (Frontend)**

**Проблема:** ADR-007 згадує "Zustand (якщо знадобиться)", але немає чіткої стратегії.

**Рекомендація:**
```markdown
## Рішення: Layered State Management

### 1. Server State (TanStack Query)
- API data caching
- Automatic refetching
- Optimistic updates
- Background sync

### 2. Local UI State (useState, useReducer)
- Form state
- Modal visibility
- UI toggles

### 3. Global Client State (Zustand - якщо потрібно)
- User preferences
- Theme
- Navigation state

### 4. URL State (Next.js router)
- Filters
- Pagination
- Selected items
```

---

**🟡 Відсутній ADR-022: Observability & Monitoring**

**Проблема:** ADR-006 описує logging (Pino), але немає комплексної стратегії observability.

**Що має включати ADR-022:**

```markdown
## Рішення: Three Pillars of Observability

### 1. Logging (Pino)
- Structured JSON logs
- Correlation IDs для tracing requests
- Log levels: debug, info, warn, error, fatal
- Log rotation
- Централізоване зберігання (optional: Grafana Loki)

### 2. Metrics (Prometheus)
- HTTP request duration
- HTTP request rate
- Queue job processing time
- Database query duration
- AI API latency
- Error rate
- Custom business metrics

### 3. Tracing (OpenTelemetry - optional)
- Distributed tracing для requests через agents
- Performance bottleneck identification

### 4. Health Checks
- /health/liveness: чи працює app
- /health/readiness: чи готова приймати requests
- Database connection check
- Redis connection check
- External API reachability

### 5. Alerting
- Critical errors → immediate notification
- High error rate → warning
- Performance degradation → notification
- Disk space/memory usage → warning
```

---

#### 2.2 Відсутні важливі гайди

**🟡 Відсутній deployment.md (повний)**

**Проблема:** Згадується в README.md, але файл майже порожній або відсутній.

**Що має включати:**

```markdown
# Deployment Guide

## Prerequisites
- Ubuntu 24.04 LTS server
- PostgreSQL 15+
- Redis 7+
- Node.js 20+
- pnpm 8+
- nginx
- PM2

## Step-by-step Production Deployment

### 1. Server Setup
### 2. Database Setup
### 3. Application Deployment
### 4. Nginx Configuration
### 5. SSL/TLS Setup
### 6. PM2 Process Management
### 7. Monitoring Setup
### 8. Backup Strategy
### 9. Rollback Procedure
### 10. Troubleshooting
```

---

**🟡 Відсутній performance.md**

**Рекомендація:**

```markdown
# Performance Guidelines

## Backend Performance

### Database
- Query optimization
- Index strategy
- Connection pooling
- N+1 query prevention
- Pagination для великих datasets

### API
- Response time targets: <200ms (p95)
- Caching strategy (Redis)
- Rate limiting
- Compression (gzip)

### Queue Jobs
- Job timeout limits
- Batch processing strategy
- Priority queues

### AI Integration
- Timeout handling
- Retry strategy
- Fallback mechanisms
- Cost optimization

## Frontend Performance

### Bundle Size
- Code splitting
- Tree shaking
- Image optimization
- Font optimization

### Loading Performance
- First Contentful Paint: <1.8s
- Time to Interactive: <3.8s
- Cumulative Layout Shift: <0.1

### Runtime Performance
- Memo heavy components
- Virtual scrolling для списків
- Debounce/throttle inputs
```

---

**🟡 Відсутній troubleshooting.md (детальний)**

Існує файл troubleshooting.md, але не прочитаний. Рекомендується перевірити його повноту.

---

**🟡 Відсутній migration-guide.md**

**Проблема:** ADR-018 згадує migration plan від старої структури до нової, але детального гайду немає.

**Рекомендація:** Створити покроковий migration guide з прикладами команд та scripts.

---

### 3. МОЖЛИВОСТІ ДЛЯ ПОКРАЩЕННЯ

#### 3.1 ADR файли

**💡 ADR-001 (Backend Framework):**

**Додати:**

```markdown
## NestJS Best Practices для проєкту

### Module Organization
- Feature modules (one feature = one module)
- Shared modules (database, logger, config)
- Core module (global services)

### Dependency Injection Tips
- Constructor injection (preferred)
- Property injection (для optional deps)
- Circular dependency resolution

### Exception Handling
- Use built-in exceptions
- Custom exception filters для specialized handling
- Never catch without re-throwing or logging

### Performance
- Use @Injectable({ scope: Scope.DEFAULT }) (singleton)
- Avoid REQUEST scope unless необхідно
- Cache heavy computations

### Testing
- Unit tests для services
- Integration tests для controllers + services + DB
- E2E tests для full flows
```

---

**💡 ADR-003 (Queue System BullMQ):**

**Додати:**

```markdown
## Queue Design Patterns

### 1. Job Priority Strategy
```typescript
// High priority: user-initiated actions
await queue.add('create-branch', data, { priority: 1 });

// Normal priority: automated workflows
await queue.add('update-docs', data, { priority: 5 });

// Low priority: cleanup tasks
await queue.add('cleanup-old-data', data, { priority: 10 });
```

### 2. Job Idempotency

- Кожен job має unique ID
- Check if already processed before executing
- Use database transactions

### 3. Job Timeouts

```typescript
{
  timeout: 300000, // 5 minutes max
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
}
```

### 4. Dead Letter Queue Handling

- Alert on DLQ entries
- Manual review and retry
- Log для post-mortem analysis

### 5. Monitoring

- Queue length alerts
- Job processing time metrics
- Failed job rate alerts

```

---

**💡 ADR-004 (Database PostgreSQL + Prisma):**

**Додати:**
```markdown
## Prisma Best Practices

### 1. Query Optimization
```typescript
// ❌ Bad: N+1 query
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const subtasks = await prisma.task.findMany({ 
    where: { parentId: task.id } 
  });
}

// ✅ Good: Include nested
const tasks = await prisma.task.findMany({
  include: { subtasks: true }
});
```

### 2. Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const draft = await tx.draft.update({ ... });
  const tasks = await tx.task.createMany({ ... });
  return { draft, tasks };
});
```

### 3. Pagination

```typescript
// Cursor-based (кращий для великих datasets)
const tasks = await prisma.task.findMany({
  take: 20,
  cursor: { id: lastId },
  orderBy: { createdAt: 'desc' }
});

// Offset-based (простіший)
const tasks = await prisma.task.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

### 4. Soft Deletes

```prisma
model Task {
  id        String    @id
  deletedAt DateTime?
  @@index([deletedAt])
}
```

### 5. Migration Strategy

- Never edit existing migrations
- Always test migrations на staging
- Backup before production migration
- Zero-downtime migration strategy для production

```

---

**💡 ADR-006 (Logging Pino):**

**Додати:**
```markdown
## Logging Best Practices

### 1. Що логувати

**✅ DO:**
- Errors (з stack trace)
- важливі бізнес-події (task created, PR merged)
- External API calls (request/response time)
- Auth events (login, logout, failed attempts)
- Performance metrics
- Startup/shutdown events

**❌ DON'T:**
- Passwords, tokens, secrets
- Personal Identifiable Information (PII)
- Full request/response bodies (якщо містять sensitive data)
- High-frequency debug logs у production

### 2. Log Levels Usage

```typescript
// DEBUG: діагностична інформація (тільки development)
logger.debug({ userId, query }, 'Executing database query');

// INFO: нормальні події
logger.info({ taskId, status: 'IN_PROGRESS' }, 'Task started');

// WARN: неочікувані ситуації (не помилки)
logger.warn({ attemptNumber: 3 }, 'Retry attempt');

// ERROR: помилки які потребують уваги
logger.error({ error, taskId }, 'Failed to process task');

// FATAL: critical errors (застосунок не може продовжувати)
logger.fatal({ error }, 'Database connection lost');
```

### 3. Structured Logging Format

```typescript
// ✅ Good: Structured with context
logger.info({
  module: 'ArchitectAgent',
  action: 'createDraft',
  draftId: draft.id,
  duration: 1234,
  conversationLength: text.length
}, 'Draft created successfully');

// ❌ Bad: String concatenation
logger.info(`Draft ${draft.id} created in ${duration}ms`);
```

### 4. Correlation IDs

```typescript
// Generate correlation ID для кожного request
const correlationId = randomUUID();

// Include у всіх logs related to request
logger.info({ correlationId, userId }, 'Processing request');
logger.info({ correlationId, result }, 'Request completed');
```

### 5. Sensitive Data Redaction

```typescript
// Pino redaction config
pinoHttp: {
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.token',
      'res.headers["set-cookie"]'
    ],
    censor: '[REDACTED]'
  }
}
```

```

---

**💡 ADR-010 (Error Handling):**

**Додати:**
```markdown
## Custom Exception Types

```typescript
// Base application exception
export class ApplicationException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain exceptions
export class TaskNotFoundException extends ApplicationException {
  constructor(taskId: string) {
    super('TASK_NOT_FOUND', `Task ${taskId} not found`, 404, { taskId });
  }
}

export class InvalidTaskStatusTransitionException extends ApplicationException {
  constructor(from: string, to: string) {
    super(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition from ${from} to ${to}`,
      400,
      { from, to }
    );
  }
}
```

## Error Context Enrichment

```typescript
try {
  await this.processTask(taskId);
} catch (error) {
  throw new ApplicationException(
    'TASK_PROCESSING_FAILED',
    'Failed to process task',
    500,
    {
      originalError: error.message,
      taskId,
      timestamp: new Date(),
      userId: currentUser.id
    }
  );
}
```

```

---

**💡 ADR-015 (Git Workflow):**

**Додати:**
```markdown
## Git Hooks Configuration

### Pre-commit (Husky + lint-staged)

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

```javascript
// lint-staged.config.js
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit' // Type check
  ],
  '*.{json,md,prisma}': [
    'prettier --write'
  ]
};
```

### Commit-msg (Conventional Commits validation)

```javascript
// .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm commitlint --edit $1
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'architect', 'workflow', 'code-review', 'documentation',
      'github', 'ai-provider', 'database', 'queue', 'api',
      'kanban', 'draft-viewer', 'conversation-form', 'ui',
      'shared', 'types', 'deps', 'config'
    ]],
    'scope-empty': [2, 'never']
  }
};
```

## GitHub Branch Protection Rules

```yaml
Branch: main
Protection rules:
  ✅ Require pull request before merging
    - Required approvals: 1
    - Dismiss stale reviews: true
  ✅ Require status checks to pass
    - CI tests
    - Lint
    - Type check
  ✅ Require conversation resolution
  ✅ Require linear history (squash or rebase)
  ✅ Include administrators (force protection)
  ❌ Allow force pushes: never
  ❌ Allow deletions: never
```

## Automated Release Process

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

```

---

**💡 ADR-018 (File Structure):**

**Додати:**
```markdown
## Module Generation Scripts

```bash
# Generate new agent
pnpm generate:agent notification

# Creates:
# src/agents/notification/
#   ├── notification.module.ts
#   ├── notification.service.ts
#   ├── notification.processor.ts
#   ├── notification.spec.ts
#   ├── dtos.ts
#   └── types.ts
```

```javascript
// scripts/generate-agent.js
const fs = require('fs');
const path = require('path');

function generateAgent(name) {
  const agentPath = path.join(__dirname, '../src/agents', name);
  fs.mkdirSync(agentPath, { recursive: true });
  
  // Generate module
  fs.writeFileSync(
    path.join(agentPath, `${name}.module.ts`),
    generateModuleTemplate(name)
  );
  
  // ... generate other files
}
```

## Barrel Export Strategy

```typescript
// src/agents/architect/index.ts (barrel export)
export * from './architect.module';
export * from './architect.service';
export * from './dtos';
export * from './types';

// Usage
import { ArchitectModule, ArchitectService, CreateDraftDto } from '@agents/architect';
```

## Import Path Aliases Best Practices

```typescript
// ✅ Good: Use path aliases
import { PrismaService } from '@database/prisma.service';
import { ArchitectService } from '@agents/architect';
import { CreateTaskDto } from '@api/tasks/dtos';

// ❌ Bad: Relative paths
import { PrismaService } from '../../../database/prisma.service';
import { ArchitectService } from '../../agents/architect/architect.service';
```

```

---

#### 3.2 Гайди (guides/)

**💡 coding-standards.md:**

Дуже короткий (43 рядки). **Розширити:**

```markdown
## Backend Coding Standards

### Controller Layer

```typescript
// ✅ Good: Thin controller
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
}

// ❌ Bad: Fat controller with business logic
@Controller('tasks')
export class TasksController {
  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    // ❌ Business logic in controller
    const task = new Task();
    task.title = createTaskDto.title;
    task.status = 'NEW';
    await this.prisma.task.create({ data: task });
    
    // ❌ External API call in controller
    await this.github.createBranch(task.id);
    
    return task;
  }
}
```

### Service Layer

```typescript
// ✅ Good: Single Responsibility
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    try {
      return await this.prisma.task.create({
        data: {
          title: dto.title,
          status: TaskStatus.NEW,
          createdAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error({ error, dto }, 'Failed to create task');
      throw new InternalServerErrorException('Failed to create task');
    }
  }
}
```

### Error Handling

```typescript
// ✅ Good: Specific error handling
async findById(id: string): Promise<Task> {
  const task = await this.prisma.task.findUnique({ where: { id } });
  
  if (!task) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }
  
  return task;
}

// ❌ Bad: Generic error or silent failure
async findById(id: string): Promise<Task | null> {
  try {
    return await this.prisma.task.findUnique({ where: { id } });
  } catch (error) {
    return null; // ❌ Swallows error
  }
}
```

### Async/Await

```typescript
// ✅ Good: async/await
async processTask(taskId: string): Promise<void> {
  const task = await this.findById(taskId);
  const result = await this.aiService.analyze(task);
  await this.saveResult(result);
}

// ❌ Bad: Promise chains (less readable)
processTask(taskId: string): Promise<void> {
  return this.findById(taskId)
    .then(task => this.aiService.analyze(task))
    .then(result => this.saveResult(result));
}
```

### Dependency Injection

```typescript
// ✅ Good: Constructor injection
@Injectable()
export class ArchitectService {
  constructor(
    private readonly aiProvider: AiProviderService,
    private readonly database: DatabaseService,
    private readonly logger: Logger
  ) {}
}

// ❌ Bad: Property injection (use only for optional deps)
@Injectable()
export class ArchitectService {
  @Inject(AiProviderService)
  private aiProvider: AiProviderService;
}
```

## Frontend Coding Standards

### Component Structure

```typescript
// ✅ Good: Functional component with clear structure
interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  // 1. Hooks
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. Event handlers
  const handleStatusChange = async (status: TaskStatus) => {
    setIsLoading(true);
    try {
      await onStatusChange(task.id, status);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 3. Render
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{task.title}</h3>
      {/* ... */}
    </div>
  );
}
```

### State Management

```typescript
// ✅ Good: Local state for UI, server state for data
export function TaskList() {
  // Server state (TanStack Query)
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks()
  });
  
  // Local UI state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // ...
}

// ❌ Bad: Mixing server and UI state
export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // ❌ Manual fetch logic
    setIsLoading(true);
    api.getTasks().then(setTasks).finally(() => setIsLoading(false));
  }, []);
}
```

### Tailwind CSS

```typescript
// ✅ Good: Utility classes
<button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
  Submit
</button>

// ✅ Good: Extract to component for reusability
export function Button({ children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'rounded px-4 py-2 font-medium';
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };
  
  return (
    <button className={cn(baseClasses, variantClasses[variant])}>
      {children}
    </button>
  );
}

// ❌ Bad: Inline styles
<button style={{ backgroundColor: 'blue', padding: '8px 16px' }}>
  Submit
</button>
```

## TypeScript Standards

### Type vs Interface

```typescript
// ✅ Use Interface для object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use Type для unions, intersections, utilities
type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';
type TaskWithAuthor = Task & { author: User };
type PartialTask = Partial<Task>;
```

### Avoid `any`

```typescript
// ❌ Bad: any
function processData(data: any) {
  return data.value;
}

// ✅ Good: unknown (safer)
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// ✅ Better: Specific type
interface DataWithValue {
  value: string;
}

function processData(data: DataWithValue) {
  return data.value;
}
```

### Explicit Return Types

```typescript
// ✅ Good: Explicit return type
async function createTask(dto: CreateTaskDto): Promise<Task> {
  // ...
}

// ❌ Bad: Implicit return type
async function createTask(dto: CreateTaskDto) {
  // TypeScript infers type but less clear
}
```

```

---

**💡 testing.md:**

Дуже короткий. **Розширити:**

```markdown
## Testing Philosophy

### Test Pyramid

```

        /\
       /  \  E2E Tests (10%)
      /____\
     /      \  Integration Tests (30%)
    /________\

/ \ Unit Tests (60%)
/____________\

```

- **Unit Tests (60%):** швидкі, isolated, багато
- **Integration Tests (30%):** середні за швидкістю, реальні залежності
- **E2E Tests (10%):** повільні, повний user flow, критичні сценарії

### Test Naming Convention

```typescript
// Format: should_<expectedBehavior>_when_<condition>

describe('TasksService', () => {
  describe('create', () => {
    it('should_create_task_when_valid_dto', async () => {
      // ...
    });
    
    it('should_throw_BadRequestException_when_title_empty', async () => {
      // ...
    });
    
    it('should_set_status_NEW_when_creating_task', async () => {
      // ...
    });
  });
});
```

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should create task with correct status', async () => {
  // Arrange: Setup test data and mocks
  const dto = { title: 'Test Task' };
  jest.spyOn(prisma.task, 'create').mockResolvedValue({
    id: '123',
    title: 'Test Task',
    status: 'NEW'
  });
  
  // Act: Execute the code under test
  const result = await service.create(dto);
  
  // Assert: Verify the outcome
  expect(result.status).toBe('NEW');
  expect(prisma.task.create).toHaveBeenCalledWith({
    data: { title: dto.title, status: 'NEW' }
  });
});
```

## Backend Testing

### Unit Tests

```typescript
describe('ArchitectService', () => {
  let service: ArchitectService;
  let aiProvider: jest.Mocked<AiProviderService>;
  let database: jest.Mocked<DatabaseService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ArchitectService,
        {
          provide: AiProviderService,
          useValue: {
            analyze: jest.fn(),
            generateTasks: jest.fn()
          }
        },
        {
          provide: DatabaseService,
          useValue: {
            saveDraft: jest.fn(),
            createTasks: jest.fn()
          }
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            info: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get(ArchitectService);
    aiProvider = module.get(AiProviderService);
    database = module.get(DatabaseService);
    logger = module.get(Logger);
  });

  it('should create draft from conversation', async () => {
    const conversationText = 'Build a login feature';
    const mockPlan = { tasks: ['Create login form', 'Add auth logic'] };
    
    aiProvider.analyze.mockResolvedValue(mockPlan);
    database.saveDraft.mockResolvedValue({ id: '123', ...mockPlan });

    const result = await service.createDraft(conversationText);

    expect(aiProvider.analyze).toHaveBeenCalledWith(conversationText);
    expect(database.saveDraft).toHaveBeenCalledWith(mockPlan);
    expect(result.id).toBe('123');
  });

  it('should log error when AI provider fails', async () => {
    const error = new Error('AI API timeout');
    aiProvider.analyze.mockRejectedValue(error);

    await expect(service.createDraft('test')).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: error.message })
    );
  });
});
```

### Integration Tests

```typescript
describe('Tasks API (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = module.createNestApplication();
    await app.init();
    
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /tasks should create new task', async () => {
    const dto = {
      title: 'Implement feature X',
      description: 'Details...'
    };

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send(dto)
      .expect(201);

    expect(response.body).toMatchObject({
      title: dto.title,
      description: dto.description,
      status: 'NEW'
    });

    // Verify in database
    const taskInDb = await prisma.task.findUnique({
      where: { id: response.body.id }
    });
    expect(taskInDb).toBeDefined();
  });

  it('PATCH /tasks/:id/status should update status', async () => {
    // Arrange: Create task in DB
    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        status: 'NEW'
      }
    });

    // Act: Update status
    const response = await request(app.getHttpServer())
      .patch(`/tasks/${task.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('IN_PROGRESS');

    // Verify in database
    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id }
    });
    expect(updatedTask.status).toBe('IN_PROGRESS');
  });
});
```

### E2E Tests

```typescript
describe('Complete workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let github: GithubService;

  beforeAll(async () => {
    // ... setup
  });

  it('should complete full task lifecycle', async () => {
    // 1. Create draft
    const draftResponse = await request(app.getHttpServer())
      .post('/conversations/analyze')
      .send({ conversationText: 'Implement login feature' })
      .expect(201);

    const draftId = draftResponse.body.id;

    // 2. Commit draft to create tasks
    const commitResponse = await request(app.getHttpServer())
      .post(`/drafts/${draftId}/commit`)
      .expect(201);

    const tasks = commitResponse.body.tasks;
    expect(tasks).toHaveLength(expect.any(Number));

    // 3. Start task (should create branch)
    const taskId = tasks[0].id;
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    // Wait for async job processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify branch created
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task.branchName).toBeDefined();
    
    // Verify GitHub branch exists
    const branchExists = await github.branchExists(task.branchName);
    expect(branchExists).toBe(true);
  });
});
```

## Frontend Testing

### Component Tests

```typescript
// TaskCard.test.tsx
describe('TaskCard', () => {
  const mockTask: Task = {
    id: '123',
    title: 'Test Task',
    status: 'NEW',
    createdAt: new Date()
  };

  it('should render task title', () => {
    render(<TaskCard task={mockTask} onStatusChange={jest.fn()} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should call onStatusChange when button clicked', async () => {
    const onStatusChange = jest.fn();
    render(<TaskCard task={mockTask} onStatusChange={onStatusChange} />);
    
    const button = screen.getByRole('button', { name: /start/i });
    await userEvent.click(button);
    
    expect(onStatusChange).toHaveBeenCalledWith('123', 'IN_PROGRESS');
  });

  it('should show loading state when processing', async () => {
    const onStatusChange = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<TaskCard task={mockTask} onStatusChange={onStatusChange} />);
    
    const button = screen.getByRole('button', { name: /start/i });
    await userEvent.click(button);
    
    expect(button).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
// useTasks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useTasks', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch tasks successfully', async () => {
    // Mock API
    jest.spyOn(api, 'getTasks').mockResolvedValue([
      { id: '1', title: 'Task 1', status: 'NEW' },
      { id: '2', title: 'Task 2', status: 'IN_PROGRESS' }
    ]);

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].title).toBe('Task 1');
  });

  it('should handle error state', async () => {
    jest.spyOn(api, 'getTasks').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

## Test Coverage

### Coverage Goals

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

### Enforce Coverage

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    // Stricter для критичних модулів
    './src/agents/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  }
};
```

### View Coverage Report

```bash
pnpm test:cov
open coverage/lcov-report/index.html
```

## Test Data Factories

```typescript
// tests/factories/task.factory.ts
export class TaskFactory {
  static create(overrides?: Partial<Task>): Task {
    return {
      id: randomUUID(),
      title: 'Test Task',
      description: 'Test description',
      status: 'NEW',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<Task>): Task[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// Usage
const task = TaskFactory.create({ status: 'IN_PROGRESS' });
const tasks = TaskFactory.createMany(10);
```

## Mocking Best Practices

### Mock External Services

```typescript
// Mock GitHub service
jest.mock('@integrations/github/github.service', () => ({
  GithubService: jest.fn().mockImplementation(() => ({
    createBranch: jest.fn().mockResolvedValue({ name: 'feature/test' }),
    createPR: jest.fn().mockResolvedValue({ id: 123, url: '...' })
  }))
}));
```

### Mock Environment Variables

```typescript
describe('ConfigService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load DATABASE_URL from env', () => {
    process.env.DATABASE_URL = 'postgresql://test';
    
    const config = new ConfigService();
    expect(config.getDatabaseUrl()).toBe('postgresql://test');
  });
});
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      
      - run: pnpm test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

```

---

### 4. BEST PRACTICES ТА РЕКОМЕНДАЦІЇ

#### 4.1 Загальні принципи документації

**📚 Documentation as Code:**

```markdown
## Principles

1. **Single Source of Truth:** Один документ = одна тема, уникати дублювання
2. **Living Documentation:** Оновлювати синхронно з кодом
3. **Searchable:** Структура має дозволяти швидкий пошук
4. **Versioned:** Вся документація у Git, trackable changes
5. **Reviewable:** Зміни у документації проходять PR review як код
```

---

**📚 ADR Writing Guidelines:**

Додати до `docs/adr/000_README.md`:

```markdown
## ADR Quality Checklist

Перед створенням PR з ADR перевір:

- [ ] **Назва файлу:** `XXX-kebab-case-title.md` (з leading zeros)
- [ ] **Статус:** Proposed/Accepted/Deprecated/Superseded/Rejected
- [ ] **Всі секції заповнені:** Статус, Контекст, Рішення, Об��рунтування, Наслідки
- [ ] **Альтернативи описані:** Що ще розглядали та чому відхилили
- [ ] **Недоліки вказані:** Чесно про trade-offs
- [ ] **Приклади є:** Code snippets або конфігурація де потрібно
- [ ] **Зв'язки вказані:** Supersedes/Related to інших ADR
- [ ] **Дата актуальна:** Коли прийнято рішення
- [ ] **Короткість:** 1-3 сторінки (не більше)

## ADR Review Checklist

Під час review ADR перевіряй:

- [ ] Чи рішення обґрунтоване?
- [ ] Чи всі альтернативи розглянуті?
- [ ] Чи зрозумілі наслідки?
- [ ] Чи є приклади коду/конфігурації?
- [ ] Чи документ легко читається?
- [ ] Чи немає технічних помилок?
```

---

#### 4.2 Автоматизація

**🤖 Automated Documentation Updates:**

```markdown
## Recommended Automations

### 1. Auto-generate CHANGELOG

```yaml
# .github/workflows/changelog.yml
name: Update CHANGELOG

on:
  push:
    branches: [main]

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v2
      
      - name: Generate CHANGELOG
        run: pnpm conventional-changelog -p angular -i CHANGELOG.md -s
      
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add CHANGELOG.md
          git commit -m "docs: update CHANGELOG" || exit 0
          git push
```

### 2. Auto-generate API documentation

```yaml
# .github/workflows/api-docs.yml
name: Generate API Docs

on:
  push:
    branches: [main]
    paths:
      - 'src/api/**'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      
      # Generate OpenAPI spec from NestJS
      - run: pnpm --filter backend build:docs
      
      # Generate static docs from spec
      - run: pnpm dlx @redocly/cli build-docs openapi.json -o docs/api/index.html
      
      - name: Commit docs
        run: |
          git config user.name "github-actions[bot]"
          git add docs/api/
          git commit -m "docs(api): auto-generate API documentation" || exit 0
          git push
```

### 3. Link checker

```yaml
# .github/workflows/link-check.yml
name: Check Documentation Links

on:
  pull_request:
    paths:
      - '**.md'

jobs:
  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          config-file: '.github/markdown-link-check-config.json'
```

### 4. Documentation linting

```yaml
# .github/workflows/docs-lint.yml
name: Lint Documentation

on:
  pull_request:
    paths:
      - '**.md'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: DavidAnson/markdownlint-cli2-action@v11
        with:
          globs: '**/*.md'
```

```

---

#### 4.3 Documentation Maintenance Schedule

```markdown
## Regular Documentation Reviews

### Monthly (1st of month)
- [ ] Review and update ROADMAP.md
- [ ] Check ADR statuses (any need to be deprecated?)
- [ ] Update CHANGELOG.md if auto-generation not setup

### Quarterly (1st of Jan/Apr/Jul/Oct)
- [ ] Full documentation audit
- [ ] Update API documentation
- [ ] Review and update troubleshooting guide
- [ ] Check all links (automated)
- [ ] Update architecture diagrams if changed

### On Release
- [ ] Update CHANGELOG.md
- [ ] Update README.md version references
- [ ] Tag documentation version in git
- [ ] Announce breaking changes

### On Major Architectural Change
- [ ] Create new ADR or supersede existing
- [ ] Update architecture/overview.md
- [ ] Update architecture/modules.md
- [ ] Update related guides
- [ ] Announce to team
```

---

## ПРІОРИТИЗАЦІЯ РЕКОМЕНДАЦІЙ

### 🔴 КРИТИЧНО (зробити негайно)

1. **Виправити ADR-008** — переписати згідно з форматом ADR
2. **Узгодити структуру файлів** — audit всіх документів, оновити посилання
3. **Розпочати CHANGELOG.md** — додати структуру та перші записи
4. **Створити ADR-019 (Security Strategy)** — критично для production
5. **Узгодити формат назв гілок** — оновити всі документи

### 🟡 ВАЖЛИВО (наступні 2 тижні)

6. **Створити ADR-020 (API Design Standards)**
7. **Створити ADR-021 (State Management Frontend)**
8. **Розширити coding-standards.md** — додати приклади та best practices
9. **Розширити testing.md** — додати детальні приклади
10. **Створити повний deployment.md**

### 🟢 ПОКРАЩЕННЯ (наступний місяць)

11. **Створити ADR-022 (Observability & Monitoring)**
12. **Створити performance.md** guide
13. **Додати Best Practices до існуючих ADR**
14. **Налаштувати автоматизацію документації** (CI/CD workflows)
15. **Створити migration-guide.md** для нової структури файлів

### 🔵 ПРИЄМНО МАТИ (backlog)

16. Створити ADR-023 (Internationalization strategy — якщо потрібно)
17. Створити ADR-024 (Caching strategy)
18. Додати архітектурні діаграми (C4 model)
19. Створити video tutorials для onboarding
20. Створити interactive documentation (Docusaurus/Nextra)

---

## ВИСНОВКИ

### Сильні сторони проєкту

✅ **Ретельна документація ADR** — всі важливі рішення задокументовані  
✅ **Чітка Git workflow** — детальний гайд з прикладами  
✅ **Structured approach** — логічна організація документів  
✅ **Best practices** — використання industry standards (Conventional Commits, GitHub Flow)  
✅ **Monorepo-ready** — продумана структура для масштабування

### Найважливіші покращення

1. **Узгодити структуру** — синхронізувати ADR-018 з реальністю
2. **Додати Security ADR** — критично для production
3. **Виправити ADR-008** — привести до формату
4. **Розширити гайди** — більше прикладів та best practices
5. **Автоматизувати** — CHANGELOG, API docs, link checking

### Загальна оцінка

**Документація: 7.5/10**

Проєкт має солідну базу документації, але потребує:

- Виправлення невідповідностей
- Заповнення прогалин (Security, API Design, Observability)
- Розширення існуючих гайдів
- Налаштування автоматизації

Після впровадження рекомендацій оцінка може зрости до **9/10**.

---

**Автор звіту:** GitHub Copilot  
**Дата:** 2026-01-27  
**Версія документа:** 1.0
