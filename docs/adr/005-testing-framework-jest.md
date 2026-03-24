# ADR-005: Використання Jest для тестування backend

## Статус

Прийнято

## Контекст

Проєкт потребує testing framework для:

- Unit тестів (сервіси, утиліти)
- Integration тестів (API endpoints, БД операції)
- E2E тестів (повні сценарії роботи агентів)

Вимоги:

- TypeScript підтримка
- Моки для залежностей
- Snapshot тестування
- Code coverage
- Інтеграція з CI/CD

Розглянуті альтернативи:

- **Jest** — найпопулярніший JavaScript testing framework
- **Vitest** — сучасна альтернатива для Vite ecosystem
- **Mocha + Chai** — класична комбінація

## Рішення

Використовуємо **Jest** для backend тестування.

## Обґрунтування

### Переваги Jest:

1. **Вбудована інтеграція з NestJS**
    - NestJS CLI генерує Jest конфігурацію
    - `@nestjs/testing` utilities для тестування модулів
   - Усі офіційні приклади використовують Jest

2. **All-in-one рішення**
    - Test runner
    - Assertion library
    - Mocking framework
    - Code coverage
    - Не треба інтегрувати окремі бібліотеки

3. **Snapshot тестування**
    - Корисно для API responses
    - Автоматичне виявлення breaking changes

4. **Mocking**
    - Прості та потужні моки
    - Auto-mocking модулів
    - Mock timers для тестування async коду

5. **Паралелізація**
    - Тести виконуються паралельно
    - Швидке виконання great test suites

6. **Watch mode**
    - Re-run тільки змінених тестів
    - Інтерактивний режим для розробки

7. **Ecosystem**
    - Величезна кількість плагінів
   - Інтеграція з усіма CI/CD системами
    - Багато матеріалів та прикладів

### Чому не інші варіанти:

**Vitest:**

- ❌ Менша інтеграція з NestJS (хоч можлива)
- ❌ Менше матеріалів для NestJS + Vitest
- ✅ Швидший (але для backend не критично)
- ✅ Краща інтеграція з Vite (але backend не використовує Vite)

**Mocha + Chai:**

- ❌ Треба налаштовувати багато окремих бібліотек
- ❌ Старіший підхід
- ❌ Гірша TypeScript підтримка
- ✅ Більше гнучкості (не потрібно)

## Наслідки

### Позитивні:

- Стандартний підхід для NestJS проєктів
- Усі приклади з документації працюють
- Легко знайти розв'язання проблем
- Готовність команди (Jest найпопулярніший)

### Негативні:

- Трохи повільніший за Vitest
- ESM підтримка не ідеальна (але для CommonJS працює відмінно)

### Нейтральні:

- Команда повинна писати тести у Jest стилі

## Типи тестів

### Unit тести

```typescript
// architect-agent.service.spec.ts
describe('ArchitectAgentService', () => {
  let service: ArchitectAgentService;
  let aiProvider: AiProviderService;
  let database: DatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ArchitectAgentService,
        {
          provide: AiProviderService,
          useValue: {
            analyze: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            saveDraft: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ArchitectAgentService);
    aiProvider = module.get(AiProviderService);
    database = module.get(DatabaseService);
  });

  it('should create draft from conversation', async () => {
    const mockPlan = { tasks: ['task1', 'task2'] };
    jest.spyOn(aiProvider, 'analyze').mockResolvedValue(mockPlan);
    
    const result = await service.createDraft('conversation text');
    
    expect(result).toMatchObject({ plan: mockPlan });
    expect(database.saveDraft).toHaveBeenCalledWith(mockPlan);
  });
});
```

### Integration тести

```typescript
// tasks.controller.spec.ts (integration)
describe('TasksController (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /tasks should return all tasks', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .expect(200);
      
    expect(response.body).toHaveLength(expect.any(Number));
  });
});
```

### E2E тести

```typescript
// workflow. e2e-spec.ts
describe('Complete workflow (E2E)', () => {
  it('should process task from start to completion', async () => {
    // 1. Create draft
    const draft = await createDraft('implement feature X');
    
    // 2. Convert to tasks
    const tasks = await convertToTasks(draft. id);
    
    // 3. Start task
    await startTask(tasks[0].id);
    
    // 4. Verify branch created
    expect(github.createBranch).toHaveBeenCalled();
  });
});
```

## Coverage цілі

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

## Примітки

- Використовуємо Jest 29.x
- Налаштовуємо `--maxWorkers=50%` для CI
- Використовуємо `jest.config.js` з NestJS preset
