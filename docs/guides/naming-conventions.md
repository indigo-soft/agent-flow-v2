# Naming Conventions

Цей документ описує всі naming conventions у проєкті.

## Git

### Branches

**Формат:**

```
<type>/<description>
```

**Types:**

- `feature/` — нова функціональність
- `fix/` — виправлення бага
- `docs/` — документація
- `refactor/` — рефакторинг
- `test/` — тести
- `chore/` — maintenance
- `perf/` — performance

**Правила:**

- Lowercase
- Kebab-case (слова через `-`)
- Англійська мова
- Описово (3–5 слів)

**Приклади:**

```
feature/architect-agent-implementation
fix/kanban-drag-drop-mobile
docs/api-documentation
chore/update-dependencies
```

### Commits

**Формат:**

```
<type>(<scope>): <description>
```

Детальніше:  [Git Workflow Guide](git-workflow.md#commit-messages)

## Код

### Files та Folders

**Backend (NestJS):**

```
# Modules
architect-agent/
  architect-agent.module.ts
  architect-agent.service.ts
  architect-agent.controller.ts
  dto/
    create-draft.dto.ts
  entities/
    draft.entity.ts
  __tests__/
    architect-agent.service.spec.ts

# Services
github. service.ts
ai-provider. service.ts

# Guards, Interceptors, Pipes
auth.guard.ts
logging.interceptor.ts
validation.pipe.ts
```

**Frontend (Next.js):**

```
# Pages (App Router)
app/
  page.tsx              # Home
  layout.tsx            # Layout
  tasks/
    page.tsx            # /tasks
    [id]/
      page.tsx          # /tasks/:id

# Components
components/
  KanbanBoard. tsx       # PascalCase
  TaskCard.tsx
  ui/
    Button.tsx

# Utilities
lib/
  api. ts                # camelCase
  utils. ts
```

### TypeScript

**Interfaces:**

```typescript
// PascalCase, prefix I опціональний (не використовуємо)
interface Task {
    id: string;
    title: string;
}

interface CreateTaskDto {
    title: string;
}
```

**Types:**

```typescript
// PascalCase
type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

type ApiResponse<T> = {
    data: T;
    error?: string;
};
```

**Classes:**

```typescript
// PascalCase
class ArchitectAgentService {
}

class TaskRepository {
}
```

**Functions та методи:**

```typescript
// camelCase
function createDraft() {
}

async function fetchTasks() {
}

class Service {
    async handleTaskStarted() {
    }
}
```

**Constants:**

```typescript
// UPPER_SNAKE_CASE для глобальних
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// camelCase для локальних
const maxRetries = 3;
const apiUrl = config.apiUrl;
```

**Enums:**

```typescript
// PascalCase для enum name, UPPER_SNAKE_CASE для values
enum TaskStatus {
    NEW = 'NEW',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

// Або PascalCase для values (залежно від use case)
enum TaskType {
    Epic = 'Epic',
    Task = 'Task',
    Subtask = 'Subtask',
}
```

### Variables

```typescript
// camelCase
const userName = 'John';
let taskCount = 0;

// Boolean:  prefix з is/has/should
const isActive = true;
const hasPermission = false;
const shouldRetry = true;

// Arrays:  plural
const tasks = [];
const users = [];

// Objects: singular
const task = {};
const user = {};
```

### React Components

```typescript
// PascalCase для компонентів
function TaskCard() {
}

const KanbanBoard = () => {
};

// camelCase для props interfaces (або PascalCase)
interface TaskCardProps {
    task: Task;
    onDelete: () => void;
}

// Handlers:  prefix handle
const handleClick = () => {
};
const handleSubmit = (e: FormEvent) => {
};

// State:  descriptive
const [tasks, setTasks] = useState([]);
const [isLoading, setIsLoading] = useState(false);
```

## Database (Prisma)

### Models

```prisma
// PascalCase, singular
model Task {
  id        String @id @default(cuid())
  title     String
  userId    String
  user      User   @relation(fields:  [userId], references: [id])
  createdAt DateTime @default(now())
}

model User {
  id    String @id
  tasks Task[]
}
```

### Fields

```prisma
// camelCase
model Task {
  createdAt DateTime
  updatedAt DateTime
  isActive  Boolean
}
```

## Environment Variables

```bash
# UPPER_SNAKE_CASE
DATABASE_URL="postgresql://..."
GITHUB_TOKEN="ghp_..."
AI_PROVIDER_API_KEY="sk-..."

# Prefix за категорією
DB_HOST="localhost"
DB_PORT="5432"

GITHUB_API_URL="https://api.github.com"
GITHUB_TOKEN="..."

REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## API Endpoints

### REST

```
# Lowercase, kebab-case, plural resources
GET    /tasks
GET    /tasks/:id
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id

# Nested resources
GET    /tasks/: id/comments
POST   /tasks/:id/comments

# Actions (якщо потрібно)
POST   /tasks/:id/archive
POST   /tasks/:id/duplicate
```

### Query Parameters

```
# camelCase
GET /tasks?status=active&sortBy=createdAt&order=desc
GET /users?page=1&perPage=20&search=john
```

## Events (Queue)

### Event Names

```typescript
// kebab-case
'task-started'
'task-completed'
'code-review-requested'
'pr-merged'
'documentation-updated'
```

### Event Payloads

```typescript
// PascalCase для types, camelCase для fields
interface TaskStartedEvent {
    taskId: string;
    userId: string;
    timestamp: Date;
}
```

## Tests

```typescript
// Файли:  . spec.ts або .test.ts
architect - agent.service.spec.ts
kanban - board.test.tsx

// Describe blocks:  опис того що тестується
describe('ArchitectAgentService', () => {
    describe('createDraft', () => {
        it('should create draft from conversation text', () => {
        });
        it('should throw error when API fails', () => {
        });
    });
});

// React Testing Library
describe('KanbanBoard', () => {
    it('renders task cards', () => {
    });
    it('handles drag and drop', () => {
    });
});
```

## Додаткові правила

### Абревіатури

```typescript
// ✅ Добре
const userId = '123';
const apiUrl = 'https://...';
const htmlContent = '<div>... </div>';

// ❌ Погано
const userID = '123';   // ID → Id
const aPIURL = '...';   // API → Api, URL → Url
const HTMLContent = '...'; // HTML → Html
```

### Acronyms у PascalCase

```typescript
// ✅ Добре
class ApiService {
}

class HttpClient {
}

class XmlParser {
}

// ❌ Погано
class APIService {
}

class HTTPClient {
}

class XMLParser {
}
```

### Magic Numbers

```typescript
// ❌ Погано
if (status === 200) {
}
setTimeout(() => {
}, 3000);

// ✅ Добре
const HTTP_STATUS_OK = 200;
if (status === HTTP_STATUS_OK) {
}

const RETRY_DELAY_MS = 3000;
setTimeout(() => {
}, RETRY_DELAY_MS);
```

## Інструменти для enforce

- **ESLint** — перевіряє naming через rules
- **Prettier** — форматує код
- **TypeScript** — type safety
- **Husky** — git hooks для перевірки

Конфігурації:  [ADR-012](../adr/012-code-linting-eslint.md)
