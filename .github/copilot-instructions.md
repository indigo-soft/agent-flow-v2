# GitHub Copilot Instructions

## Project Context

This is an AI-Powered Development Workflow Assistant that automates software development workflows using AI agents (
Architect, Workflow, Code Review, Documentation).

**Tech Stack:**

- **Backend**: NestJS (Fastify adapter), Prisma (PostgreSQL), BullMQ (Redis), Pino (Logging).
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons.
- **Monorepo**: `pnpm` workspaces.

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

- TypeScript types (strictly no `any`).
- Error handling (try/catch) with logging.
- Input validation (DTOs with `class-validator`).
- JSDoc for public methods.
- Tests (Jest) for new functionality.

### NestJS (Fastify)
```typescript
@Injectable()
export class ExampleService {
    private readonly logger = new Logger(ExampleService.name);

    constructor(private readonly prisma: PrismaService) {
    }

    async exampleMethod(dto: ExampleDto): Promise<Result> {
        try {
            // Implementation
        } catch (error) {
            this.logger.error({message: 'Error description', error: error.message, context: {dto}});
            throw new InternalServerErrorException('User-friendly message');
        }
    }
}
```

### React (Next.js)
```typescript
export function Component({prop}: ComponentProps) {
    const [state, setState] = useState<Type>(initialValue);
    // Use Tailwind CSS for styling
    return (
            <div className = "flex flex-col p-4 bg-white rounded-lg shadow" >
                    {/* JSX */}
                    < /div>
    );
}
```

## Naming Conventions

- **Files**: kebab-case (`example-service.ts`)
- **Classes**: PascalCase (`ExampleService`)
- **Functions**: camelCase (`createDraft`)
- **Constants**: UPPER_SNAKE_CASE (globals)
- **Interfaces**: PascalCase (`CreateDraftDto`)
- **React Components**: PascalCase (`KanbanBoard`)

## File Paths

- **Backend**: `apps/backend/src/modules/<module-name>/`
- **Frontend**: `apps/dashboard/components/` (UI in `ui/`)
- **Shared**: `packages/shared/src/`

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
