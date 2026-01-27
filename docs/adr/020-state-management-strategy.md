# ADR-020: State Management Strategy

## Статус

Accepted

## Контекст

Проєкт має два місця де потрібен state management:

**Backend (NestJS):**

- Cache для дорогих операцій (AI API, GitHub API)
- Transient state для агентів та queue jobs
- Real-time data для WebSocket connections

**Frontend (Next.js + React):**

- Server state — дані з API (tasks, drafts)
- Client state — UI state (модальні вікна, форми)
- Real-time updates — WebSocket events

Вимоги:

- **Простота** — мінімум boilerplate
- **Type safety** — TypeScript first
- **Performance** — ефективний cache, мінімум re-renders
- **Real-time ready** — підтримка live updates
- **SSR compatible** — Next.js App Router
- **Active maintenance** — не deprecated пакети

## Рішення

### Backend

- **@nestjs/cache-manager** + Redis store для distributed cache
- **Redis Pub/Sub** для real-time events

### Frontend

- **TanStack Query** (React Query v5) — server state
- **Zustand** — client/UI state
- **URL searchParams** — sharable state (filters, pagination)

## Обґрунтування

---

## Backend State Management

### 1. NestJS Cache Manager + Redis

**Чому @nestjs/cache-manager:**

- ✅ Офіційний NestJS package
- ✅ Store-agnostic (Redis, Memory, інші)
- ✅ Built-in decorators та DI
- ✅ TTL support
- ✅ Active maintenance

**Setup:**

```bash
pnpm add @nestjs/cache-manager cache-manager
pnpm add cache-manager-ioredis-yet
```

**Configuration:**

```typescript
// src/cache/cache.module.ts
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          ttl: 60 * 1000, // 1 min default
        }),
      }),
    }),
  ],
})
export class CacheModule {}
```

**Basic Usage:**

```typescript
@Injectable()
export class GithubService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getRepository(owner: string, repo: string) {
    const key = `github:repo:${owner}/${repo}`;
    
    let data = await this.cache.get(key);
    if (!data) {
      data = await this.octokit.repos.get({ owner, repo });
      await this.cache.set(key, data, 5 * 60 * 1000); // 5 min
    }
    return data;
  }
}
```

**Decorator для автоматичного кешування:**

```typescript
// src/core/decorators/cacheable.decorator.ts
export function Cacheable(prefix: string, ttl = 60000) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const cache = this.cache || this.cacheManager;
      const cacheKey = `${prefix}:${JSON.stringify(args)}`;
      
      let result = await cache.get(cacheKey);
      if (result) return result;
      
      result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, ttl);
      return result;
    };
  };
}

// Usage
@Injectable()
export class TasksService {
  @Cacheable('tasks:all', 30000)
  async findAll(filter: TaskFilterDto) {
    return this.prisma.task.findMany({ where: filter });
  }
}
```

**Cache Strategy:**

- **GitHub API** — 5 хвилин (rate limits)
- **AI Provider** — 1 година (дорогі запити, не змінюються)
- **Tasks/Drafts** — 30 секунд (часто змінюються)

### 2. Redis Pub/Sub для Real-Time

```typescript
// src/events/event-emitter.service.ts
@Injectable()
export class EventEmitterService {
  private publisher: Redis;
  private subscriber: Redis;

  async onModuleInit() {
    this.publisher = new Redis({ /* config */ });
    this.subscriber = new Redis({ /* config */ });
  }

  async publish(channel: string, data: any) {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  subscribe(channel: string, callback: (data: any) => void) {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) callback(JSON.parse(msg));
    });
  }
}

// Usage в processor
@Processor('architect-events')
export class ArchitectProcessor {
  constructor(private events: EventEmitterService) {}

  @Process('draft-created')
  async handleDraft(job: Job) {
    const draft = await this.createDraft(job.data);
    await this.events.publish('draft:created', { draftId: draft.id });
    return draft;
  }
}
```

---

## Frontend State Management

### 1. TanStack Query для Server State

**Чому TanStack Query v5:**

- ✅ Automatic caching та background refetching
- ✅ Request deduplication
- ✅ Optimistic updates
- ✅ SSR/Next.js App Router support
- ✅ Powerful DevTools
- ✅ TypeScript first

**Setup:**

```bash
cd src/dashboard
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

```typescript
// app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

**API Client:**

```typescript
// lib/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Custom Hooks:**

```typescript
// lib/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys
const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filter: TaskFilter) => [...taskKeys.lists(), filter] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

// GET /tasks
export function useTasks(filter: TaskFilter = {}) {
  return useQuery({
    queryKey: taskKeys.list(filter),
    queryFn: () => api.get('/tasks', { params: filter }).then(r => r.data),
  });
}

// GET /tasks/:id
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => api.get(`/tasks/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

// POST /tasks
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskDto) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// PATCH /tasks/:id with optimistic update
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      api.patch(`/tasks/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      const previous = queryClient.getQueryData(taskKeys.detail(id));
      queryClient.setQueryData(taskKeys.detail(id), (old: any) => ({ ...old, ...data }));
      return { previous };
    },
    onError: (_, { id }, context) => {
      queryClient.setQueryData(taskKeys.detail(id), context?.previous);
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}
```

**Component Usage:**

```typescript
'use client';
import { useTasks, useCreateTask } from '@/lib/hooks/useTasks';

export function TaskList() {
  const { data: tasks, isLoading } = useTasks({ status: 'IN_PROGRESS' });
  const createTask = useCreateTask();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      {tasks?.map(task => <TaskCard key={task.id} task={task} />)}
      <button onClick={() => createTask.mutate({ title: 'New task' })}>
        Add Task
      </button>
    </>
  );
}
```

### 2. Zustand для Client State

**Чому Zustand:**

- ✅ Мінімальний boilerplate
- ✅ TypeScript support
- ✅ No Context Hell
- ✅ Performance (no unnecessary re-renders)
- ✅ DevTools support

**Setup:**

```bash
pnpm add zustand
```

**Store:**

```typescript
// lib/store/ui-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UiState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        isSidebarOpen: true,
        toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
        
        theme: 'light',
        setTheme: (theme) => set({ theme }),
        
        isModalOpen: false,
        openModal: () => set({ isModalOpen: true }),
        closeModal: () => set({ isModalOpen: false }),
      }),
      { name: 'ui-store', partialize: (s) => ({ theme: s.theme }) }
    )
  )
);
```

**Usage:**

```typescript
'use client';
import { useUiStore } from '@/lib/store/ui-store';

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  return <aside className={isSidebarOpen ? 'block' : 'hidden'}>...</aside>;
}
```

### 3. URL State для Sharable State

```typescript
// app/tasks/page.tsx
export default function TasksPage({ searchParams }: { searchParams: { status?: string } }) {
  return <TaskList status={searchParams.status} />;
}

// components/TaskList.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function TaskList({ status }: { status?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  
  const setStatus = (value: string) => {
    const p = new URLSearchParams(params);
    p.set('status', value);
    router.push(`/tasks?${p.toString()}`);
  };

  return <select value={status} onChange={(e) => setStatus(e.target.value)}>...</select>;
}
```

### 4. Real-Time Updates (WebSocket)

```typescript
// lib/hooks/useRealTime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { taskKeys } from './useTasks';

export function useRealTimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!);

    socket.on('task:created', () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    });

    socket.on('task:updated', (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    });

    return () => socket.disconnect();
  }, [queryClient]);
}
```

---

## State Architecture

```
Backend:
  Redis Cache → NestJS Services → Queue (BullMQ) → Agents
                     ↓
                  Pub/Sub
                     ↓
Frontend:
  TanStack Query (Server State) + Zustand (UI State) + URL (Sharable State)
                     ↓
              React Components
```

---

## Best Practices

### Backend

1. **Cache expensive operations** — AI, GitHub API
2. **Use TTL** — не зберігайте forever
3. **Invalidate on mutations** — коли дані змінюються
4. **Monitor hit rate** — оптимізуйте stale time

### Frontend

1. **TanStack Query для API** — не useState
2. **Zustand для UI** — модальні вікна, sidebar
3. **URL для filters** — sharable state
4. **Optimistic updates** — кращий UX
5. **Centralize query keys** — уникайте дублювання

---

## Query Key Convention

```typescript
// Centralized keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filter: TaskFilter) => [...taskKeys.lists(), filter] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

// Invalidate всі lists:
queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

// Invalidate конкретний detail:
queryClient.invalidateQueries({ queryKey: taskKeys.detail('123') });
```

---

## Наслідки

### Позитивні:

- ✅ Type-safe state management
- ✅ Automatic caching (TanStack Query)
- ✅ Real-time ready (Pub/Sub)
- ✅ SSR compatible
- ✅ Minimal boilerplate
- ✅ Excellent DX (DevTools)

### Негативні:

- ⚠️ Потребує розуміння TanStack Query concepts
- ⚠️ Redis dependency (але вже є для BullMQ)

### Нейтральні:

- ℹ️ Для простого UI state можна useState
- ℹ️ URL state не для transient state

---

## Для MVP

**Мінімальний stack:**

1. Redis cache (вже є для BullMQ)
2. TanStack Query
3. useState для UI (Zustand додати пізніше)

**Додати пізніше:**

- WebSocket real-time
- Optimistic updates
- Infinite scroll

---

## Зв'язки

- Related to: [ADR-003: Queue System (BullMQ)](003-queue-system-bullmq.md) — Redis
- Related to: [ADR-007: Frontend Framework (Next.js)](007-frontend-framework-nextjs-react.md) — React state

## Автори

- @indigo-soft

## Дата

2024-01-20

## Теги

`state-management` `tanstack-query` `zustand` `redis` `cache` `nestjs` `nextjs` `performance`
