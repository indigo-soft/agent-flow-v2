# GitHub Copilot Instructions

## Project Context

This is an AI-Powered Development Workflow Assistant that automates software development workflows using AI agents.

## Git Workflow

**IMPORTANT: Always follow Conventional Commits and GitHub Flow.**

### Branch Names

Format: `<type>/<issue-number>-<short-description>` (e.g., `feature/123-architect-agent`)

### Commit Format

Format: `<type>(<scope>): <description>`

**Scopes:**

- **Backend**: `architect`, `workflow`, `code-review`, `documentation`, `github`, `ai-provider`, `database`, `queue`,
  `api`, `common`.
- **Frontend**: `kanban`, `draft-viewer`, `conversation-form`, `ui`, `lib`.
- **Shared**: `shared`, `types`, `deps`, `config`.

## Code Generation Guidelines

### Always Include

- TypeScript types (no `any`)
- Error handling (try/catch)
- Input validation (DTOs)
- JSDoc for public methods
- Tests for new functionality

### NestJS Services

```typescript

@Injectable()
export class ExampleService {
    constructor(
            private readonly dependency: DependencyService,
    ) {
    }

    async exampleMethod(dto: ExampleDto): Promise<Result> {
        try {
            // Implementation
        } catch (error) {
            this.logger.error(`Error in exampleMethod: ${error.message}`);
            throw new InternalServerErrorException('.. .');
        }
    }
}
```

### React Components

```typescript
interface ComponentProps {
    prop: string;
}

export function Component({prop}: ComponentProps) {
    const [state, setState] = useState<Type>(initialValue);

    const handleAction = () => {
        // Handler logic
    };

    return (
            // JSX
    );
}
```

## Naming Conventions

- **Files**: kebab-case (example-service.ts)
- **Classes**: PascalCase (ExampleService)
- **Functions**: camelCase (createDraft)
- **Constants**: UPPER_SNAKE_CASE (MAX_RETRIES)
- **Interfaces**: PascalCase (CreateDraftDto)
- **React Components**: PascalCase (KanbanBoard)

## File Paths

### Backend Modules

```
apps/backend/src/modules/<module-name>/
  <module-name>.module.ts
  <module-name>.service.ts
  <module-name>.controller.ts
  dto/
  __tests__/
```

### Frontend Components

```
apps/dashboard/components/
  ComponentName.tsx
  ComponentName.test.tsx
```

## Testing

### Unit Test Template

```typescript
describe('ServiceName', () => {
    let service: ServiceName;
    let dependency: jest.Mocked<DependencyService>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ServiceName,
                {
                    provide: DependencyService,
                    useValue: {
                        method: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get(ServiceName);
        dependency = module.get(DependencyService);
    });

    describe('methodName', () => {
        it('should do something', async () => {
            // Arrange
            const input = {};
            dependency.method.mockResolvedValue({});

            // Act
            const result = await service.methodName(input);

            // Assert
            expect(result).toBeDefined();
            expect(dependency.method).toHaveBeenCalledWith(input);
        });
    });
});
```

## Documentation

When suggesting new features or architectural changes, reference:

- ADRs in `docs/adr/`
- Guides in `docs/guides/`
- Contributing guidelines in `CONTRIBUTING.md`

## Common Patterns

### Error Handling

```typescript
try {
    // Operation
} catch (error) {
    this.logger.error({
        message: 'Error description',
        error: error.message,
        context: {...},
    });
    throw new AppropriateException('User-friendly message');
}
```

### API Validation

```typescript
export class CreateDto {
    @IsString()
    @IsNotEmpty()
    field: string;

    @IsOptional()
    @IsArray()
    optionalField?: string[];
}
```

### Event Publishing

```typescript
await this.queue.add('event-name', {
    taskId: task.id,
    timestamp: new Date(),
});
```

## Reference Documentation

Full documentation:

- Git Workflow: `docs/guides/git-workflow.md`
- Naming Conventions: `docs/guides/naming-conventions.md`
- Contributing: `CONTRIBUTING.md`
- ADRs: `docs/adr/README.md`
