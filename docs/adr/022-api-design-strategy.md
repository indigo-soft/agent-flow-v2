# ADR-022: API Design Strategy

## Статус

Accepted

## Контекст

Проєкт потребує REST API для:

- Frontend dashboard (Next.js)
- Потенційних mobile apps
- Third-party integrations
- CLI tools

Вимоги:

- **Type-safe** — TypeScript на backend та frontend
- **Developer-friendly** — зрозумілі endpoints, помилки, документація
- **Consistent** — єдиний стиль для всіх endpoints
- **Versioned** — можливість змін без breaking існуючих clients
- **Scalable** — легко додавати нові endpoints

## Рішення

Використовуємо **REST API** з наступними принципами:

1. **Versioned URLs** — `/v1/` prefix з самого початку
2. **Action-based endpoints** — `/create`, `/delete` замість HTTP methods як primary API
3. **JSON everywhere** — request та response
4. **CUID identifiers** — sortable, URL-safe IDs
5. **Structured errors** — детальна інформація про помилки
6. **Hybrid authentication** — Sessions (web) + JWT (API clients)
7. **Comprehensive docs** — OpenAPI/Swagger + Markdown

## Обґрунтування

### Чому Action-based замість pure REST?

**Pure REST:**

```
POST   /v1/tasks
DELETE /v1/tasks/:id
```

**Action-based:**

```
POST /v1/tasks/create
POST /v1/tasks/:id/delete
```

**Переваги action-based:**

- ✅ Більш явний intent (зрозуміліше що робить endpoint)
- ✅ Легше логувати (`action: "tasks.create"`)
- ✅ Consistency — всі операції через POST
- ✅ Безпечніше — випадковий GET не може видалити
- ✅ Гнучкіше для custom actions (`/archive`, `/duplicate`)

**Недоліки:**

- ⚠️ Не standard REST
- ⚠️ Не використовуємо повністю HTTP methods semantic

**Рішення:** Action-based для кращої clarity та flexibility.

---

## API Structure

### 1. URL Format

```
https://api.example.com/v1/{resource}/{action}
https://api.example.com/v1/{resource}/{id}/{action}
```

**Examples:**

```
POST   /v1/tasks/create
POST   /v1/tasks/list              # With filters in body
GET    /v1/tasks/:id               # Get single (GET OK for read-only)
POST   /v1/tasks/:id/update
POST   /v1/tasks/:id/delete
POST   /v1/tasks/:id/archive       # Custom action

POST   /v1/drafts/create
POST   /v1/drafts/list
GET    /v1/drafts/:id
POST   /v1/drafts/:id/update

POST   /v1/agents/architect/trigger
GET    /v1/agents/status
```

### 2. HTTP Methods

```
GET  → Read single resource (idempotent)
POST → All mutations (create, update, delete, custom actions)
```

**Чому POST для всього:**

- Явний intent через URL action
- Не залежимо від HTTP method semantic
- Body можна використовувати для будь-якої операції
- Немає confusion PUT vs PATCH

### 3. Status Codes

```
200 OK              → Successful operation
201 Created         → Resource created (optional, можна просто 200)
204 No Content      → Successful delete (no response body)
400 Bad Request     → Client error (generic)
401 Unauthorized    → Not authenticated
403 Forbidden       → Not authorized (no permission)
404 Not Found       → Resource not found
422 Unprocessable   → Validation error
429 Too Many Req    → Rate limit exceeded
500 Internal Error  → Server error
503 Service Unavail → Maintenance mode
```

**DELETE response:**

```http
POST /v1/tasks/:id/delete

HTTP/1.1 204 No Content
```

---

## Request/Response Format

### 1. Identifiers (CUID)

```typescript
import { createId } from '@paralleldrive/cuid2';

const taskId = createId(); // "clh3x9k2v0000qz08abc"
```

**Format:**

- Prefix: `task_clh3x9k2v...`, `draft_clh3x9k2v...`
- Sortable (timestamp embedded)
- URL-safe
- Shorter than UUID

### 2. Request Body

```json
POST /v1/tasks/create
Content-Type: application/json

{
  "title": "Implement authentication",
  "description": "Add JWT auth to API",
  "priority": "HIGH"
}
```

**Naming:**

- camelCase для fields
- Enum values у UPPER_CASE

### 3. Response Body (Success)

**Single resource:**

```json
{
  "data": {
    "id": "task_clh3x9k2v0000qz08abc",
    "title": "Implement authentication",
    "description": "Add JWT auth to API",
    "priority": "HIGH",
    "status": "NEW",
    "createdAt": "2024-01-27",
    "updatedAt": "2024-01-27"
  },
  "meta": {
    "timestamp": "2024-01-27T12:34:56.789Z"
  }
}
```

**List:**

```json
{
  "data": [
    { "id": "task_1", "title": "..." },
    { "id": "task_2", "title": "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "totalItems": 256,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  },
  "links": {
    "first": "/v1/tasks/list?page=1",
    "prev": null,
    "next": "/v1/tasks/list?page=2",
    "last": "/v1/tasks/list?page=6",
    "self": "/v1/tasks/list?page=1"
  }
}
```

### 4. Response Body (Error)

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters",
      "value": "ab"
    },
    {
      "field": "priority",
      "message": "Priority must be one of: LOW, MEDIUM, HIGH",
      "value": "URGENT"
    }
  ],
  "timestamp": "2024-01-27T12:34:56.789Z",
  "url": "https://api.example.com/v1/tasks/create",
  "method": "POST"
}
```

**Development only:**

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "errors": [],
  "stack": "Error: ...\n  at ...",  // Only in development!
  "timestamp": "2024-01-27T12:34:56.789Z",
  "url": "https://api.example.com/v1/tasks/create",
  "method": "POST"
}
```

### 5. Dates Format

**ISO 8601 Date (UTC):**

```
"2024-01-27"           # Date only
"2024-01-27T12:34:56Z" # Datetime (для timestamps)
```

**Завжди UTC, клієнт конвертує у local timezone.**

---

## Pagination

### Request

```json
POST /v1/tasks/list

{
  "page": 1,
  "limit": 50,
  "filters": { ... },
  "sort": { ... }
}
```

**Defaults:**

- `page`: 1
- `limit`: 50 (default), max: 100

### Response

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "totalItems": 256,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  },
  "links": {
    "first": "/v1/tasks/list?page=1",
    "prev": null,
    "next": "/v1/tasks/list?page=2",
    "last": "/v1/tasks/list?page=6",
    "self": "/v1/tasks/list?page=1"
  }
}
```

---

## Filtering

### Simple filters (OR logic через comma)

```json
{
  "filters": {
    "status": "NEW,IN_PROGRESS",      // status = NEW OR IN_PROGRESS
    "priority": "HIGH"                 // AND priority = HIGH
  }
}
```

### NOT operator

```json
{
  "filters": {
    "status": "!DONE"                  // status != DONE
  }
}
```

### Date ranges

```json
{
  "filters": {
    "createdAt": "2024-01-01:2024-12-31"  // Between
  }
}
```

**Date range formats:**

- `2024-01-01:2024-12-31` — між двома датами
- `:2024-12-31` — до дати (less than or equal)
- `2024-01-01:` — від дати (greater than or equal)

### Complex example

```json
POST /v1/tasks/list

{
  "page": 1,
  "limit": 50,
  "filters": {
    "status": "NEW,IN_PROGRESS",      // OR
    "priority": "HIGH",                // AND
    "assignee": "!user_123",           // NOT
    "createdAt": "2024-01-01:",        // From date
    "q": "authentication"              // Search
  },
  "sort": {
    "priority": "desc",
    "createdAt": "asc"
  }
}
```

---

## Sorting

```json
{
  "sort": {
    "priority": "desc",    // Primary sort
    "createdAt": "asc"     // Secondary sort
  }
}
```

**Sort order:**

- `asc` — ascending (default)
- `desc` — descending

---

## Authentication

### Hybrid Strategy

**Web Dashboard → Sessions (cookies):**

```
POST /v1/auth/login

Response:
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
X-CSRF-Token: random-token
```

**API Clients → JWT:**

```
POST /v1/auth/login

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

### Endpoints

```
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
POST /v1/auth/refresh
GET  /v1/auth/me
```

### Session Authentication (Web)

```http
POST /v1/tasks/create
Cookie: sessionId=abc123
X-CSRF-Token: random-token

{ "title": "New task" }
```

**CSRF Protection:**

- Token у header `X-CSRF-Token`
- Token у response після login
- Validate на кожен POST request

### JWT Authentication (API)

```http
POST /v1/tasks/create
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{ "title": "New task" }
```

**Token structure:**

```json
{
  "sub": "user_clh3x9k2v",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1706356800,
  "exp": 1706360400
}
```

---

## Rate Limiting

### Limits

- **Authenticated:** 100 requests / 15 minutes (per user)
- **Anonymous:** 20 requests / 15 minutes (per IP)

### Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1706356800
```

### Response (exceeded)

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "errors": [],
  "timestamp": "2024-01-27T12:34:56.789Z",
  "url": "https://api.example.com/v1/tasks/create",
  "method": "POST"
}
```

---

## CORS

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN, // https://dashboard.example.com
  credentials: true,                 // For cookies
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});
```

---

## Health Checks

### GET /health

```json
{
  "status": "ok",
  "timestamp": "2024-01-27T12:34:56.789Z"
}
```

### GET /health/live

```json
{
  "status": "ok",
  "timestamp": "2024-01-27T12:34:56.789Z",
  "uptime": 86400
}
```

### GET /health/ready

```json
{
  "status": "ok",
  "timestamp": "2024-01-27T12:34:56.789Z",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 5
    },
    "redis": {
      "status": "ok",
      "responseTime": 2
    },
    "queue": {
      "status": "ok",
      "jobs": {
        "waiting": 5,
        "active": 2,
        "failed": 0
      }
    }
  },
  "resources": {
    "memory": {
      "used": 512,
      "total": 1024,
      "percentage": 50
    },
    "disk": {
      "used": 10240,
      "total": 51200,
      "percentage": 20
    }
  }
}
```

### GET /version

```json
{
  "version": "1.0.0",
  "commit": "abc123def456",
  "buildDate": "2024-01-27T10:00:00Z",
  "environment": "production"
}
```

---

## Implementation

### 1. DTO Validation

```typescript
// src/api/tasks/dto/create-task.dto.ts
import { IsString, IsNotEmpty, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement authentication',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Add JWT authentication to API endpoints',
    required: false,
  })
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Task priority',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'HIGH',
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### 2. Controller

```typescript
// src/api/tasks/tasks.controller.ts
import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskDto } from './dto/task.dto';

@ApiTags('tasks')
@Controller('v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 200, description: 'Task created', type: TaskDto })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateTaskDto) {
    const task = await this.tasksService.create(dto);
    return {
      data: task,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task found', type: TaskDto })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string) {
    const task = await this.tasksService.findOne(id);
    return {
      data: task,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('list')
  @ApiOperation({ summary: 'List tasks with filters' })
  @ApiResponse({ status: 200, description: 'Tasks found' })
  async list(@Body() dto: ListTasksDto) {
    const { data, total } = await this.tasksService.list(dto);
    
    return {
      data,
      meta: {
        page: dto.page || 1,
        limit: dto.limit || 50,
        totalItems: total,
        totalPages: Math.ceil(total / (dto.limit || 50)),
        hasNext: (dto.page || 1) < Math.ceil(total / (dto.limit || 50)),
        hasPrev: (dto.page || 1) > 1,
      },
      links: this.buildLinks(dto, total),
    };
  }

  @Post(':id/delete')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 204, description: 'Task deleted' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async delete(@Param('id') id: string) {
    await this.tasksService.delete(id);
  }

  private buildLinks(dto: any, total: number) {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const totalPages = Math.ceil(total / limit);
    const base = '/v1/tasks/list';

    return {
      first: `${base}?page=1`,
      prev: page > 1 ? `${base}?page=${page - 1}` : null,
      next: page < totalPages ? `${base}?page=${page + 1}` : null,
      last: `${base}?page=${totalPages}`,
      self: `${base}?page=${page}`,
    };
  }
}
```

### 3. Global Exception Filter

```typescript
// src/core/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Extract validation errors
    let errors = [];
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const msg = exceptionResponse['message'];
        if (Array.isArray(msg)) {
          errors = msg.map((m) => ({ field: 'unknown', message: m }));
        }
      }
    }

    const errorResponse = {
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      url: `${request.protocol}://${request.get('host')}${request.originalUrl}`,
      method: request.method,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json(errorResponse);
  }
}
```

### 4. Swagger Setup

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  // Exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('AI Workflow Assistant API')
    .setDescription('REST API for AI-powered development workflow automation')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('sessionId')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
  console.log(`API running on http://localhost:3001`);
  console.log(`Swagger docs: http://localhost:3001/api/docs`);
}

bootstrap();
```

---

## Versioning Strategy

### Breaking Changes

Створювати `/v2` коли:

- ✅ Renaming fields
- ✅ Changing data types
- ✅ Removing endpoints
- ✅ Changing response structure
- ✅ Changing authentication mechanism

**Backward compatible (не потребує v2):**

- ❌ Adding new fields
- ❌ Adding new endpoints
- ❌ Adding new optional parameters

### Deprecation Policy

1. Announce deprecation (додати header `X-API-Deprecated: true`)
2. Support old version 6 місяців мінімум
3. Remove після warning period

```http
HTTP/1.1 200 OK
X-API-Deprecated: true
X-API-Deprecation-Info: This endpoint will be removed on 2024-12-31. Use /v2/tasks instead.
```

---

## Documentation Structure

```
docs/api/
��── README.md                    # API Overview
├── authentication.md            # Auth guide
├── pagination.md                # Pagination guide
├── filtering.md                 # Filtering guide
├── errors.md                    # Error codes
│
├── endpoints/
│   ├── tasks/
│   │   ├── create.md           # POST /v1/tasks/create
│   │   ├── list.md             # POST /v1/tasks/list
│   │   ├── get.md              # GET /v1/tasks/:id
│   │   ├── update.md           # POST /v1/tasks/:id/update
│   │   └── delete.md           # POST /v1/tasks/:id/delete
│   ├── drafts/
│   │   └── ...
│   └── agents/
│       └── ...
│
├── events/                      # WebSocket events
│   ├── task-events.md          # task:created, task:updated, task:deleted
│   ├── draft-events.md         # draft:created, draft:updated
│   └── agent-events.md         # agent:started, agent:completed
│
└── examples/
    ├── create-task.sh          # curl example
    ├── list-tasks.sh           # curl example
    └── authentication.sh       # curl example
```

---

## Наслідки

### Позитивні:

- ✅ **Action-based clarity** — явний intent кожного endpoint
- ✅ **Type-safe** — TypeScript DTO на backend та frontend
- ✅ **Versioned** — можливість breaking changes без проблем
- ✅ **Hybrid auth** — зручно для web та API clients
- ✅ **Comprehensive docs** — Swagger + Markdown
- ✅ **Consistent errors** — єдиний формат помилок

### Негативні:

- ⚠️ **Не pure REST** — не використовуємо всі HTTP methods
- ⚠️ **Більше endpoints** — `/create`, `/update`, `/delete` замість одного URL

### Нейтральні:

- ℹ️ CSRF protection додає complexity (але тільки для sessions)
- ℹ️ Hybrid auth потребує підтримки двох механізмів

---

## Best Practices

### 1. Завжди wrap response

```json
{ "data": {...}, "meta": {...} }
```

### 2. Завжди включати errors array

```json
{ "errors": [] }  // Навіть якщо пустий
```

### 3. ISO 8601 для дат

```json
{ "createdAt": "2024-01-27" }
```

### 4. CUID для IDs

```typescript
import { createId } from '@paralleldrive/cuid2';
const id = `task_${createId()}`;
```

### 5. HTTP 422 для validation

```
400 → Generic client error
422 → Validation failed
```

### 6. Детальні Swagger descriptions

```typescript
@ApiProperty({
  description: 'Task title',
  example: 'Implement feature X',
  minLength: 3,
  maxLength: 200,
})
```

---

## Зв'язки

- Related to: [ADR-001: Backend Framework (NestJS)](001-backend-framework-nestjs.md)
- Related to: [ADR-007: Frontend Framework (Next.js)](007-frontend-framework-nextjs-react.md)
- Related to: [ADR-019: Security Strategy](019-security-strategy.md) — authentication
- Related to: [ADR-020: State Management](020-state-management-strategy.md) — API integration

## Автори

- @indigo-soft

## Дата

2024-01-27

## Теги

`api-design` `rest` `action-based` `versioning` `swagger` `openapi` `authentication` `validation`
