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

Format: `<type>/<issue-number>-<short-description>` (e.g., `feature/0123-architect-agent`)

**Rules:**

- Issue number is **REQUIRED** (minimum 4 digits with leading zeros if needed)
- All changes must be linked to an issue
- Examples: `feature/0001-initial-setup`, `fix/0042-bug-fix`, `feature/1234-new-feature`

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
            <div className="flex flex-col gap-4">
                {/* JSX with Tailwind */}
            </div>
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

**Architecture:** Flat Modular Architecture with Shared
Layer ([ADR-024](../docs/adr/024-flat-modular-architecture-with-shared-layer.md))

```
src/
├── modules/         # Domain modules (business logic)
│   ├── architect-agent/
│   ├── workflow-agent/
│   ├── code-review-agent/
│   └── documentation-agent/
│
└── components/      # Shared components (technical infrastructure)
    ├── api/                # API Gateway
    ├── database/           # Database service (Prisma)
    ├── queue/              # Event Queue (BullMQ)
    ├── logger/             # Logging (Pino)
    ├── config/             # Configuration
    ├── ai-provider/        # AI Provider integration
    ├── github/             # GitHub integration
    └── dashboard/          # Frontend (Next.js)
```

**TypeScript Paths:**

- `@modules/*` — domain modules (`src/modules/*`)
- `@components/*` — shared components (`src/components/*`)

**Key Rules:**

- 🔒 Domain modules (`modules/`) are independent of each other
- 📬 Interaction only through Event Queue (rarely via HTTP)
- ⚙️ Domain modules use only shared components
- ❌ Shared components CANNOT depend on domain modules (except `components/api/`)

#### 6. Testing

- **Unit Tests**: `.spec.ts` (Backend) or `.test.tsx` (Frontend).
- **Mocks**: Use `jest.mocked` for typed dependencies.

#### 7. Code Quality Tools

The project uses:

- **Lefthook**: Git hooks (pre-commit, commit-msg, pre-push).
- **lint-staged**: Run linters only on staged files.
- **commitlint**: Conventional commit message validation (scope is **REQUIRED**).
- **ESLint** & **Prettier**: Linting and formatting (format on save recommended).

#### 8. Documentation & References

Reference these for any architectural changes:

- **Architecture Guide**: `docs/guides/architecture.md`
- **Architecture Overview**: `docs/architecture/overview.md`
- **ADR Index**: `docs/adr/INDEX.md`
- **Git Workflow Guide**: `docs/guides/git-workflow.md`
- **Naming Conventions**: `docs/guides/naming-conventions.md`
