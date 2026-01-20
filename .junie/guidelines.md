### Project Guidelines

This document provides essential information for developers and AI agents working on the **agent-flow-v2** project.

#### 1. Project Context

This is an AI-Powered Development Workflow Assistant that automates software development workflows using AI agents.

#### 2. Git Workflow

**IMPORTANT: Always follow Conventional Commits and GitHub Flow.**

##### Branch Names

Format: `<type>/<issue-number>-<short-description>` (e.g., `feature/123-architect-agent`)

##### Commit Format

Format: `<type>(<scope>): <description>`

**Scopes:**

- **Backend**: `architect`, `workflow`, `code-review`, `documentation`, `github`, `ai-provider`, `database`, `queue`,
  `api`, `common`.
- **Frontend**: `kanban`, `draft-viewer`, `conversation-form`, `ui`, `lib`.
- **Shared**: `shared`, `types`, `deps`, `config`.

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`.

#### 3. Code Generation Guidelines

##### Always Include

- TypeScript types (strictly no `any`).
- Error handling (try/catch) with appropriate logging.
- Input validation (DTOs using `class-validator`).
- JSDoc for public methods and complex logic.
- Tests (Jest) for new functionality.

##### NestJS (Fastify)

Use `@fastify/static` or similar if needed, as we use the Fastify adapter.

```typescript
@Injectable()
export class ExampleService {
    private readonly logger = new Logger(ExampleService.name);

    constructor(
            private readonly prisma: PrismaService,
    ) {
    }

    async exampleMethod(dto: ExampleDto): Promise<Result> {
        try {
            // Implementation
        } catch (error) {
            this.logger.error({
                message: 'Error in exampleMethod',
                error: error.message,
                dto
            });
            throw new InternalServerErrorException('Detailed error message');
        }
    }
}
```

##### React (Next.js)

Use Functional Components and Hooks. Tailwind CSS for styling.

```typescript
interface ComponentProps {
    prop: string;
}

export function Component({prop}: ComponentProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleAction = async () => {
        // Handler logic
    };

    return (
            <div className = "flex flex-col gap-4" >
                    {/* JSX with Tailwind */}
                    < /div>
    );
}
```

#### 4. Naming Conventions

- **Files**: kebab-case (`example-service.ts`, `kanban-board.tsx`).
- **Classes**: PascalCase (`ArchitectService`).
- **Functions/Methods**: camelCase (`createDraft`).
- **Constants**: UPPER_SNAKE_CASE for globals, camelCase for local.
- **Interfaces/Types**: PascalCase (`CreateTaskDto`, `TaskStatus`).
- **React Components**: PascalCase (`TaskCard`).
- **Events**: kebab-case (`task-started`).

#### 5. File Paths

- **Backend**: `apps/backend/src/modules/<module-name>/`
- **Frontend**: `apps/dashboard/components/` (UI components in `ui/` subdirectory)
- **Shared**: `packages/shared/src/`

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

#### 7. Common Patterns

##### Error Handling

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

##### API Validation

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

##### Event Publishing

```typescript
await this.queue.add('event-name', {
    taskId: task.id,
    timestamp: new Date(),
});
```

#### 8. Documentation & References

When suggesting new features or architectural changes, reference:

- **ADRs**: `docs/adr/`
- **Guides**: `docs/guides/`
- **Architecture**: `docs/architecture/ARCHITECTURE.md`
- **Git Workflow**: `docs/guides/git-workflow.md`
- **Naming Conventions**: `docs/guides/naming-conventions.md`
- **Contributing**: `CONTRIBUTING.md`
