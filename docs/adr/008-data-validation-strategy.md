# ADR-008: Стратегія валідації даних

## Статус

Прийнято

## Контекст

Проєкт має кілька точок входу даних:

- API requests від Dashboard
- Події із черги (jobs)
- Відповіді від зовнішніх API (GitHub, AI Provider)
- User input (бесіди, зауваження)

Потрібна єдина стратегія валідації для:

- Запобігання некоректних даних у БД
- Чітких помилок для користувача
- Type safety на runtime

## Рішення

Використовуємо **багаторівневу стратегію валідації**:

1. **Backend API:** `class-validator` через NestJS DTOs
2. **Frontend forms:** `zod` через `react-hook-form`
3. **Shared types:** TypeScript interfaces у monorepo
4. **Queue jobs:** `zod` schemas для event payloads
5. **External API responses:** Runtime validation через `zod`

## Обґрунтування

### Backend API:  class-validator

```typescript
// create-draft.dto.ts
import {IsString, IsNotEmpty, IsArray, IsOptional} from 'class-validator';

export class CreateDraftDto {
    @IsString()
    @IsNotEmpty()
    conversationText: string;

    @IsOptional()
    @IsArray()
    @IsString({each: true})
    artifacts?: string[];
}

// Controller автоматично валідує
@Post()
async
createDraft(@Body()
dto: CreateDraftDto
)
{
    // dto вже валідне
}
```

**Переваги:**

- ✅ Декларативно
- ✅ Автоматичні помилки (400 Bad Request)
- ✅ Інтеграція з NestJS

### Frontend forms:  Zod

```typescript
// schemas/draft.schema.ts
import {z} from 'zod';

export const createDraftSchema = z.object({
    conversationText: z.string().min(1, 'Conversation text is required'),
    artifacts: z.array(z.string()).optional(),
});

export type CreateDraftInput = z.infer<typeof createDraftSchema>;

// Component
const form = useForm<CreateDraftInput>({
    resolver: zodResolver(createDraftSchema),
});
```

**Переваги:**

- ✅ Type inference (TypeScript types з схеми)
- ✅ Клієнтська валідація
- ✅ Чіткі помилки для користувача

### Queue events: Zod

```typescript
// events/task-started.event.ts
import {z} from 'zod';

export const TaskStartedEventSchema = z.object({
    taskId: z.string().cuid(),
    userId: z.string().optional(),
    timestamp: z.date(),
});

export type TaskStartedEvent = z.infer<typeof TaskStartedEventSchema>;

// У processor
@Process('task-started')
async
handleTaskStarted(job
:
Job
)
{
    const event = TaskStartedEventSchema.parse(job.data); // Throws if invalid
    // event is type-safe
}
```

### External API: Zod

```typescript
// GitHub PR response validation
const GitHubPRSchema = z.object({
    id: z.number(),
    number: z.number(),
    state: z.enum(['open', 'closed']),
    html_url: z.string().url(),
    head: z.object({
        ref: z.string(),
    }),
});

// При отриманні відповіді
const response = await fetch(`https://api.github.com/repos/. ../pulls/${id}`);
const data = await response.json();
const pr = GitHubPRSchema.parse(data); // Захист від змін API
```

## Наслідки

### Позитивні:

- Валідація на всіх рівнях
- Типобезпечність та рантайм-безпечність
- Чіткі помилки для зневадження
- Захист від некоректних даних

### Негативні:

- Дублювання схем (class-validator на backend, zod на frontend)
- Трохи більше коду

### Можливе покращення:

У майбутньому можна використати **monorepo** зі shared schemas:

```typescript
// packages/shared/src/schemas/draft.schema.ts
export const createDraftSchema = z.object({...});

// Backend:  конвертуємо Zod → class-validator (або міграція на Zod)
// Frontend: використовуємо Zod напряму
```

## Примітки

- Ніколи не довіряємо зовнішнім даним (валідуємо все)
- Логуємо validation errors для моніторингу
- Використовуємо descriptive error messages
