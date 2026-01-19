# ADR-010: Стратегія обробки помилок

## Статус

Прийнято

## Контекст

Проєкт має множину точок, де можуть виникнути помилки:

- API requests
- Queue job processing
- External API calls (GitHub, AI Provider)
- Database operations

Потрібна єдина стратегія для:

- Обробки помилок
- Логування помилок
- Повідомлення користувача
- Retry logic
- Моніторинг

## Рішення

Використовуємо **багаторівневу стратегію обробки помилок**.

## Стратегія по рівнях

### 1. API Layer (NestJS)

```typescript
// Глобальний exception filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly logger: Logger) {
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;
        } else if (exception instanceof PrismaClientKnownRequestError) {
            status = HttpStatus.BAD_REQUEST;
            message = this.parsePrismaError(exception);
        }

        this.logger.error({
            message,
            stack: exception instanceof Error ? exception.stack : undefined,
            path: request.url,
            method: request.method,
        });

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}

// app.module.ts
{
    provide: APP_FILTER,
        useClass
:
    AllExceptionsFilter,
}
```

### 2. Queue Jobs (BullMQ)

```typescript

@Processor('workflow-events')
export class WorkflowProcessor {
    private readonly logger = new Logger(WorkflowProcessor.name);

    @Process('task-started')
    async handleTaskStarted(job: Job) {
        try {
            // Process job
        } catch (error) {
            this.logger.error({
                message: 'Failed to process task-started event',
                jobId: job.id,
                taskId: job.data.taskId,
                error: error.message,
                stack: error.stack,
            });

            // Re-throw для автоматичного retry через BullMQ
            throw error;
        }
    }

    @OnQueueFailed()
    async handleFailed(job: Job, error: Error) {
        // Job пішов у DLQ після всіх retry
        await this.database.updateTask(job.data.taskId, {
            status: 'ERROR',
            errorMessage: error.message,
        });

        // Опціонально:  надіслати нотифікацію
        await this.notifications.sendError({
            message: `Task ${job.data.taskId} failed after all retries`,
            error: error.message,
        });
    }
}
```

### 3. External API Calls

```typescript
// github.service.ts
export class GithubService {
    private readonly logger = new Logger(GithubService.name);

    async createPR(data: CreatePRDto) {
        try {
            const response = await this.octokit.rest.pulls.create({
                owner: data.owner,
                repo: data.repo,
                title: data.title,
                head: data.head,
                base: data.base,
            });

            return response.data;
        } catch (error) {
            if (error.status === 404) {
                throw new NotFoundException(`Repository ${data.owner}/${data.repo} not found`);
            }

            if (error.status === 422) {
                throw new BadRequestException(`Invalid PR data: ${error.message}`);
            }

            if (error.status >= 500) {
                this.logger.error({
                    message: 'GitHub API server error',
                    status: error.status,
                    error: error.message,
                });
                throw new ServiceUnavailableException('GitHub API is temporarily unavailable');
            }

            // Rate limiting
            if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
                const resetTime = error.response.headers['x-ratelimit-reset'];
                throw new TooManyRequestsException(
                    `GitHub rate limit exceeded.  Resets at ${new Date(resetTime * 1000)}`
                );
            }

            throw error;
        }
    }
}
```

### 4. Database Operations

```typescript
// Prisma error handling
export class PrismaService extends PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    // Wrapper для обробки Prisma помилок
    async handlePrismaError<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                // P2002: Unique constraint violation
                if (error.code === 'P2002') {
                    throw new ConflictException('Resource already exists');
                }

                // P2025: Record not found
                if (error.code === 'P2025') {
                    throw new NotFoundException('Resource not found');
                }
            }

            throw error;
        }
    }
}
```

### 5. Frontend Error Handling

```typescript
// lib/api.ts
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public path?: string
    ) {
        super(message);
    }
}

export async function apiRequest<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json();
            throw new ApiError(
                response.status,
                error.message || 'Request failed',
                url
            );
        }

        return response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Network error
        throw new ApiError(0, 'Network error.  Please check your connection.', url);
    }
}

// Component
function TaskBoard() {
    const [error, setError] = useState<string | null>(null);

    const handleStartTask = async (taskId: string) => {
        try {
            setError(null);
            await api.updateTaskStatus(taskId, 'IN_PROGRESS');
        } catch (error) {
            if (error instanceof ApiError) {
                setError(error.message);
            } else {
                setError('An unexpected error occurred');
            }
        }
    };

    return (
        <>
            {error && <ErrorAlert message = {error}
    />}
    {/* ...  */
    }
    </>
)
    ;
}
```

## Retry Strategy

### BullMQ Jobs

```typescript
// Default retry config
{
    attempts: 3,
        backoff
:
    {
        type: 'exponential',
            delay
    :
        2000, // 2s, 4s, 8s
    }
,
}

// Для external API (більше retries)
{
    attempts: 5,
        backoff
:
    {
        type: 'exponential',
            delay
    :
        5000, // 5s, 10s, 20s, 40s, 80s
    }
,
}
```

### External API Calls

```typescript
// Використовуємо axios-retry або custom implementation
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry на network errors та 5xx
    return axiosRetry.isNetwork
