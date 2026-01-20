### Project Guidelines

This document provides essential information for developers and AI agents working on the **agent-flow-v2** project.

#### 1. Project Context

This is an AI-Powered Development Workflow Assistant that automates software development workflows using AI agents.

#### 2. Git Workflow

**IMPORTANT: Always follow Conventional Commits**

##### Commit Format

```
<type>(<scope>): <description>
```

##### Examples

```
feat(architect): add draft creation service
fix(kanban): resolve drag and drop on mobile  
docs(readme): update installation instructions
test(workflow): add unit tests for branch creation
```

##### Branch Names

```
feature/descriptive-name
fix/bug-description
docs/documentation-update
```

#### 3. Code Generation Guidelines

##### Always Include

- TypeScript types (no `any`)
- Error handling (try/catch)
- Input validation (DTOs)
- JSDoc for public methods
- Tests for new functionality

##### NestJS Services

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

##### React Components

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

#### 4. Naming Conventions

- **Files**: kebab-case (example-service.ts)
- **Classes**: PascalCase (ExampleService)
- **Functions**: camelCase (createDraft)
- **Constants**: UPPER_SNAKE_CASE (MAX_RETRIES)
- **Interfaces**: PascalCase (CreateDraftDto)
- **React Components**: PascalCase (KanbanBoard)

#### 5. File Paths

##### Backend Modules

```
apps/backend/src/modules/<module-name>/
  <module-name>.module.ts
  <module-name>.service.ts
  <module-name>.controller.ts
  dto/
  __tests__/
```

##### Frontend Components

```
apps/dashboard/components/
  ComponentName.tsx
  ComponentName.test.tsx
```

#### 6. Testing Information

The project uses NestJS testing utilities with Jest (for components/services) and native Node.js test runner where
applicable.

##### Unit Test Template (Jest)

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
