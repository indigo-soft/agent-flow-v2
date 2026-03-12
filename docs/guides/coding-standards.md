# Coding Standards

This document defines the coding standards and patterns for **agent-flow-v2**.
> **See also:
** [Architecture Guide](./architecture.md) | [Naming Conventions](./naming-conventions.md) | [Testing Guide](./testing.md)

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Patterns](#typescript-patterns)
- [NestJS Patterns](#nestjs-patterns)
- [React / Next.js Patterns](#react--nextjs-patterns)
- [Logging Conventions](#logging-conventions)
- [Error Handling](#error-handling)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---
## General Principles

1. **Strict TypeScript** — no `any`. Use `unknown` + type guards when the type is genuinely unknown.
2. **Single Responsibility** — each class / function does one thing.
3. **Explicit over implicit** — readable code beats clever code.
4. **JSDoc on all public methods** — especially services and utilities.
5. **Tests are mandatory** — every service method must have a corresponding unit test.

---

## TypeScript Patterns

### No `any` — use `unknown` with guards

```typescript
// ❌ Bad
function parseJson(input: any): any {
    return JSON.parse(input);
}

// ✅ Good
function parseJson(input: string): unknown {
    return JSON.parse(input);
}

function isTaskDto(value: unknown): value is CreateTaskDto {
    return typeof value === 'object' && value !== null && 'title' in value;
}
```

### Utility Types

```typescript
// Pick only what you need
type TaskSummary = Pick<Task, 'id' | 'title' | 'status'>;
// Make all fields optional for partial updates
type UpdateTaskDto = Partial<CreateTaskDto>;
// Read-only data transfer objects
const config: Readonly<AppConfig> = loadConfig();
```

### Generic Patterns

```typescript
// Generic result wrapper (no exceptions in return types)
type Result<T, E = Error> =
        | { success: true; data: T }
        | { success: false; error: E };

// Usage
async function findTask(id: string): Promise<Result<Task>> {
    // ...
}
```

### Import Ordering

Imports are automatically sorted by `eslint-plugin-simple-import-sort`. Order enforced:

1. Node.js built-ins (`node:fs`, `node:path`)
2. External packages (`@nestjs/*`, `react`, etc.)
3. Internal aliases (`@modules/*`, `@components/*`)
4. Relative imports (`./`, `../`)

---

## NestJS Patterns

### Module Structure

Every domain module (`src/modules/`) and shared component (`src/components/`) follows flat-modular structure:

```
src/modules/architect-agent/
├── architect-agent.module.ts      # NestJS module definition
├── architect-agent.controller.ts  # HTTP controller (if needed)
├── architect-agent.service.ts     # Business logic
├── architect-agent.service.spec.ts
├── dto/
│   ├── create-draft.dto.ts
│   └── update-draft.dto.ts
└── index.ts                       # Public exports
```

### Service Template

```typescript
import {Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '@components/database';
import {CreateDraftDto} from './dto/create-draft.dto';
import {Draft} from '@prisma/client';

@Injectable()
export class ArchitectAgentService {
    private readonly logger = new Logger(ArchitectAgentService.name);

    constructor(private readonly prisma: PrismaService) {
    }

    /**
     * Creates a new draft from the conversation analysis.
     */
    async createDraft(dto: CreateDraftDto): Promise<Draft> {
        try {
            return await this.prisma.draft.create({data: dto});
        } catch (error) {
            this.logger.error({
                message: 'Failed to create draft',
                error: error instanceof Error ? error.message : String(error),
                context: {dto},
            });
            throw new InternalServerErrorException('Could not create draft');
        }
    }

    /**
     * Returns a draft by ID, or throws NotFoundException.
     */
    async findById(id: string): Promise<Draft> {
        const draft = await this.prisma.draft.findUnique({where: {id}});
        if (!draft) {
            throw new NotFoundException(`Draft ${id} not found`);
        }
        return draft;
    }
}
```

### DTO Validation

```typescript
import {IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum} from 'class-validator';
import {TaskStatus} from '@prisma/client';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;
    @IsString()
    @IsOptional()
    description?: string;
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus = TaskStatus.TODO;
}
```

### Controller Template

```typescript
import {Body, Controller, Get, Param, Post, ParseUUIDPipe} from '@nestjs/common';
import {ArchitectAgentService} from './architect-agent.service';
import {CreateDraftDto} from './dto/create-draft.dto';

@Controller('drafts')
export class ArchitectAgentController {
    constructor(private readonly service: ArchitectAgentService) {
    }

    @Post()
    create(@Body() dto: CreateDraftDto) {
        return this.service.createDraft(dto);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.findById(id);
    }
}
```

### Guards, Pipes, Interceptors

| Concern            | Tool                         | Where to declare      |
|--------------------|------------------------------|-----------------------|
| Authentication     | `AuthGuard` (custom)         | Controller / globally |
| Input validation   | `ValidationPipe` (global)    | `main.ts` globally    |
| Response transform | `ClassSerializerInterceptor` | Controller            |
| Logging requests   | Custom `LoggingInterceptor`  | Globally              |
| Exception mapping  | `AllExceptionsFilter`        | Globally              |

---

## React / Next.js Patterns

### Component Template

```typescript
// Props interface always first
interface TaskCardProps {
    task: TaskSummary;
    onStatusChange: (id: string, status: TaskStatus) => void;
}

// Named export (no default exports in components)
export function TaskCard({task, onStatusChange}: TaskCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    return (
            <div className = "flex flex-col p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow" >
            <h3 className = "text-sm font-medium text-gray-900 truncate" > {task.title} < /h3>
                    < span
    className = "mt-1 text-xs text-gray-500" > {task.status} < /span>
            < /div>
)
    ;
}
```

### Custom Hooks

```typescript
// Always prefix with 'use', return typed object (not array) for multiple values
export function useTask(taskId: string) {
    const query = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => api.tasks.findById(taskId),
        enabled: Boolean(taskId),
    });
    return {
        task: query.data,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}
```

### TanStack Query (Server State)

```typescript
// Queries — read data
const {data: tasks} = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.tasks.list(filters),
    staleTime: 30_000, // 30 seconds
});
// Mutations — write data
const mutation = useMutation({
    mutationFn: (dto: CreateTaskDto) => api.tasks.create(dto),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['tasks']}),
});
```

---

## Logging Conventions

Use **structured logging** (Pino). Every log entry should be a plain object:

```typescript
// ❌ Bad — unstructured, hard to search in log aggregators
this.logger.error('Failed to process task ' + taskId + ': ' + error.message);
// ✅ Good — structured fields, easy to filter
this.logger.error({
    message: 'Failed to process task',
    taskId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
});
// Log levels
this.logger.log({message: 'Task created', taskId});       // INFO
this.logger.warn({message: 'Retrying request', attempt}); // WARN
this.logger.error({message: 'Critical failure', error});  // ERROR
this.logger.debug({message: 'Queue event received', payload}); // DEBUG (dev only)
```

---

## Error Handling

### Service Layer

Always use try/catch in services. Throw appropriate NestJS HTTP exceptions:

```typescript
// Map to user-friendly exceptions
catch
(error)
{
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            throw new ConflictException('Resource already exists');
        }
        if (error.code === 'P2025') {
            throw new NotFoundException('Resource not found');
        }
    }
    this.logger.error({message: 'Unexpected error', error: error.message});
    throw new InternalServerErrorException('Unexpected error occurred');
}
```

### Never Swallow Errors

```typescript
// ❌ Never do this
try {
    await riskyOperation();
} catch (_) {
    // silently ignored
}
// ✅ At minimum, log and rethrow
try {
    await riskyOperation();
} catch (error) {
    this.logger.warn({message: 'Operation failed, continuing', error});
    // Only swallow if explicitly intentional and documented
}
```

---

## Anti-Patterns to Avoid

| Anti-pattern                              | Why                                      | Instead                              |
|-------------------------------------------|------------------------------------------|--------------------------------------|
| `any` type                                | Defeats TypeScript's purpose             | Use `unknown` + type guards          |
| `console.log` in production code          | Unstructured, ignored by log aggregators | Use `this.logger.log()`              |
| Business logic in controllers             | Hard to test, violates SRP               | Move to services                     |
| Direct `prisma.*` calls outside services  | Leaks DB details into controllers        | Use service methods                  |
| Default exports in components             | Harder to rename, worse tree-shaking     | Use named exports                    |
| Mixing server/client state (Next.js)      | Causes hydration mismatches              | Use TanStack Query + Zustand clearly |
| Hardcoded secrets in code                 | Security risk                            | Always use `.env` variables          |
| Modules depending on other domain modules | Violates ADR-024 architecture rules      | Use queue events instead             |
