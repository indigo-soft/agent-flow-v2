# ADR-007: Використання Next.js з React для frontend

## Статус

Прийнято

## Контекст

Проєкт потребує Dashboard для взаємодії користувача з системою:

- Форма для введення бесід/інформації
- Перегляд та редагування чернеток планів
- Kanban дошка з завданнями
- Управління завданнями (кнопки для зміни статусів)

Вимоги:

- Швидка розробка UI
- Компонентний підхід
- Type safety
- Server-side rendering (опціонально)
- Простота deployment

Розглянуті альтернативи:

- **React + Next.js**
- **Vue + Nuxt.js**
- **Svelte + SvelteKit**
- **Vanilla JavaScript**

## Рішення

Використовуємо **Next.js 14** з **React 18** для Dashboard.

## Обґрунтування

### Переваги Next. js + React:

1. **Найбільша екосистема**
    - Найбільше UI бібліотек (shadcn/ui, Ant Design, MUI)
    - Найбільше готових компонентів
    - Компоненти для drag-and-drop Kanban (`@hello-pangea/dnd`)
    - Форми:  `react-hook-form` + `zod`

2. **Next.js App Router**
    - File-based routing
    - Server components для performance
    - Built-in API routes (можна використати для проксі)
    - Loading states та error boundaries з коробки

3. **Developer Experience**
    - Fast refresh
    - TypeScript підтримка з коробки
    - ESLint конфігурація
    - Автоматична оптимізація (code splitting, image optimization)

4. **Спільнота та підтримка**
    - Найбільша спільнота
    - Найбільше туторіалів та прикладів
    - Легко знайти рішення проблем
    - Активний розвиток (Vercel backing)

5. **Готовність до production**
    - SEO optimization (якщо знадобиться)
    - Performance оптимізації
    - Deployment на Vercel (один клік)

6. **Type Safety**
    - TypeScript з коробки
    - Можна шарити типи з backend (monorepo)

### Чому не інші варіанти:

**Vue + Nuxt:**

- ❌ Менша екосистема UI компонентів
- ❌ Менше матеріалів та прикладів
- ✅ Простіший синтаксис (але React теж не складний)
- ✅ Composition API схожий на React hooks

**Svelte + SvelteKit:**

- ❌ Найменша екосистема
- ❌ Найменше готових компонентів
- ❌ Важче знайти рішення проблем
- ✅ Найпростіший синтаксис
- ✅ Кращий runtime performance (але для Dashboard не критично)

**Vanilla JavaScript:**

- ❌ Багато boilerplate для state management
- ❌ Немає готових компонентів
- ❌ Важко підтримувати
- ❌ Треба винаходити велосипеди

## Наслідки

### Позитивні:

- Швидка розробка завдяки готовим компонентам
- Величезна спільнота для допомоги
- Type-safe communication з backend
- Готовність до масштабування

### Негативні:

- React має крутішу криву навчання ніж Svelte
- Next.js додає complexity (але дає багато можливостей)

### Нейтральні:

- Команда повинна розуміти React hooks та Next.js App Router

## Технологічний стек frontend

```yaml
Framework: Next.js 14 (App Router)
Library: React 18
Language: TypeScript
Styling: Tailwind CSS
UI Components: shadcn/ui
Forms: react-hook-form + zod
API Client: fetch API + React Query (TanStack Query)
Drag-and-drop: @hello-pangea/dnd
State Management: React hooks + Zustand (якщо знадобиться)
```

## Структура проєкту

```
dashboard/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (new conversation form)
│   ├── tasks/
│   │   └── page.tsx            # Kanban board
│   └── api/                    # API routes (proxy)
│       └── [... proxy]/route.ts
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── ConversationForm.tsx
│   ├── DraftViewer.tsx
│   └── KanbanBoard.tsx
├── lib/
│   ├── api.ts                  # API client
│   └── utils.ts
└── types/
    └── index.ts                # Shared types
```

## UI Components

### shadcn/ui

Обираємо **shadcn/ui** замість готових бібліотек (Ant Design, MUI):

**Переваги:**

- ✅ Компоненти копіюються у проєкт (повний контроль)
- ✅ Tailwind CSS (гнучкість)
- ✅ Сучасний дизайн
- ✅ TypeScript з коробки
- ✅ Accessibility з коробки

**Недоліки:**

- ⚠️ Менше готових компонентів ніж у Ant Design
- ⚠️ Треба самому налаштовувати деякі речі

### Kanban board

Використовуємо **@hello-pangea/dnd** (fork `react-beautiful-dnd`):

- ✅ Найпопулярніша бібліотека для drag-and-drop
- ✅ Accessibility підтримка
- ✅ Touch підтримка (мобільні)
- ✅ Чудова документація

## API Communication

```typescript
// lib/api.ts
export const api = {
  async createDraft(conversationText: string) {
    const res = await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify({ conversationText }),
    });
    return res.json();
  },
  
  async getTasks() {
    const res = await fetch('/api/tasks');
    return res.json();
  },
  
  async updateTaskStatus(taskId: string, status: string) {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify({ status }),
    });
    return res.json();
  },
};
```

## Deployment

- **Development:** `npm run dev` (localhost:3000)
- **Production:** Vercel (рекомендовано) або Docker + Node.js

## Примітки

- Використовуємо Next.js 14.x (App Router, не Pages Router)
- Використовуємо React 18 (з Server Components)
- Tailwind CSS для стиліз
  
