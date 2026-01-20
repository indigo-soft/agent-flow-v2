### Project Guidelines

This document provides essential information for developers and AI agents working on the **agent-flow-v2** project.

#### 1. Project Context

This is an AI-Powered Development Workflow Assistant that automates software development workflows using AI agents (
Architect, Workflow, Code Review, Documentation).

**Tech Stack:**

- **Backend**: NestJS (Fastify), Prisma (PostgreSQL), BullMQ (Redis), Pino (Logging).
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons.
- **Monorepo**: Managed with `pnpm` workspaces.

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

#### 6. Testing

- **Unit Tests**: `.spec.ts` (Backend) or `.test.tsx` (Frontend).
- **Mocks**: Use `jest.mocked` for typed dependencies.

#### 7. Code Quality Tools

The project uses:

- **Husky** & **lint-staged**: Pre-commit checks.
- **commitlint**: Conventional commit validation.
- **ESLint** & **Prettier**: Linting and formatting (format on save recommended).

#### 8. Documentation & References

Reference these for any architectural changes:

- **Architecture Overview**: `docs/architecture/overview.md`
- **ADR Index**: `docs/adr/000_README.md`
- **Git Workflow Guide**: `docs/guides/git-workflow.md`
- **Naming Conventions**: `docs/guides/naming-conventions.md`
