# Testing Guide

> **See also:
** [Coding Standards](./coding-standards.md) | [Architecture Guide](./architecture.md) | [ADR-005 — Testing Framework](../adr/005-testing-framework-jest.md)

## Table of Contents

- [Test Configuration](#test-configuration)
- [Running Tests](#running-tests)
- [Unit Test Patterns](#unit-test-patterns)
- [Mocking Patterns](#mocking-patterns)
- [Coverage](#coverage)
- [Test Data / Fixtures](#test-data--fixtures)
- [E2E Tests](#e2e-tests)

---

## Test Configuration

Unit tests are configured in [`jest.config.js`](../../jest.config.js) at the project root.
Key settings:

- **Preset:** `ts-jest` (TypeScript support)
- **Test match:** `src/**/*.spec.ts` and `tests/**/*.spec.ts`
- **Path aliases:** `@modules/*` and `@components/*` are resolved via `moduleNameMapper`
- **Coverage threshold:** 70% for branches, functions, lines, statements

---
## Running Tests
```bash
# Run all unit tests
pnpm test
# Run with coverage report
pnpm test -- --coverage
# Run in watch mode (development)
pnpm test -- --watch
# Run a specific test file
pnpm test -- src/components/database/database.service.spec.ts
# Run tests matching a pattern
pnpm test -- --testNamePattern="should create draft"
```

---

## Unit Test Patterns

Unit tests live **co-located** with source files:
```
src/modules/architect-agent/
├── architect-agent.service.ts
└── architect-agent.service.spec.ts  ← co-located
```

### NestJS Service Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ArchitectAgentService } from './architect-agent.service';
import { PrismaService } from '@components/database';
describe('ArchitectAgentService', () => {
  let service: ArchitectAgentService;
  let prisma: jest.Mocked<PrismaService>;
  const mockDraft = {
    id: 'uuid-1234',
    title: 'Test draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectAgentService,
        {
          provide: PrismaService,
          useValue: {
            draft: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();
    service = module.get<ArchitectAgentService>(ArchitectAgentService);
    prisma = module.get(PrismaService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createDraft', () => {
    it('should create and return a draft', async () => {
      (prisma.draft.create as jest.Mock).mockResolvedValue(mockDraft);
      const result = await service.createDraft({ title: 'Test draft' });
      expect(result).toEqual(mockDraft);
      expect(prisma.draft.create).toHaveBeenCalledWith({
        data: { title: 'Test draft' },
      });
    });
    it('should throw InternalServerErrorException on database error', async () => {
      (prisma.draft.create as jest.Mock).mockRejectedValue(new Error('DB error'));
      await expect(service.createDraft({ title: 'Test' })).rejects.toThrow(
        'Could not create draft',
      );
    });
  });
  describe('findById', () => {
    it('should return draft when found', async () => {
      (prisma.draft.findUnique as jest.Mock).mockResolvedValue(mockDraft);
      const result = await service.findById('uuid-1234');
      expect(result).toEqual(mockDraft);
    });
    it('should throw NotFoundException when draft not found', async () => {
      (prisma.draft.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Mocking Patterns

### Mocking PrismaService

```typescript
// Minimal mock — only the methods you use
const prismaMock = {
  draft: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};
// In TestingModule
{
  provide: PrismaService,
  useValue: prismaMock,
}
```

### Mocking BullMQ Queue

```typescript
import { getQueueToken } from '@nestjs/bullmq';
import { ARCHITECT_QUEUE } from '@components/queue';
const queueMock = {
  add: jest.fn(),
  getJob: jest.fn(),
};
// In TestingModule
{
  provide: getQueueToken(ARCHITECT_QUEUE),
  useValue: queueMock,
}
```

### Mocking External Services (GitHub API, AI Provider)

```typescript
// Create a typed mock factory
function createGithubClientMock(): jest.Mocked<GithubClient> {
  return {
    createBranch: jest.fn(),
    createPullRequest: jest.fn(),
    listPullRequests: jest.fn(),
  } as jest.Mocked<GithubClient>;
}
// In test
const githubMock = createGithubClientMock();
githubMock.createBranch.mockResolvedValue({ name: 'feature/0001-test' });
```

### Mocking Logger (suppress output in tests)

```typescript
import { Logger } from '@nestjs/common';
// Silence logger output in tests
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
```

---

## Coverage

Coverage is collected from `src/**/*.ts` (excluding spec files, module files, and barrel exports).

```bash
# Generate coverage report
pnpm test -- --coverage
# View HTML report in browser
open coverage/index.html
```

**Coverage thresholds** (configured in `jest.config.js`):
| Metric | Threshold |
|------------|-----------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |
> ⚠️ Coverage thresholds will fail the CI if not met. Aim for 80%+ in new services.
---

## Test Data / Fixtures

Shared test data and factory functions live in `tests/fixtures/`:

```typescript
// tests/fixtures/draft.fixture.ts
import { Draft } from '@prisma/client';
export function createDraftFixture(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'fixture-uuid-0001',
    title: 'Fixture Draft',
    description: null,
    status: 'DRAFT',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}
```

---

## E2E Tests

E2E tests live in `tests/e2e/` and test the full HTTP request/response cycle against a running server.
> ⚠️ The E2E test framework has not been selected yet (Supertest vs Playwright API testing). See the ADR backlog.
> When implemented, E2E tests will:

- Require a test PostgreSQL database and Redis instance
- Run separately from unit tests via `jest.config.e2e.js`
- Be excluded from the standard `pnpm test` command
  For now, ensure all business logic is covered by unit tests in `src/**/*.spec.ts`.
