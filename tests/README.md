# Tests

This directory contains end-to-end (E2E) tests, test fixtures, and test helper utilities.

## Structure

```
tests/
├── e2e/          # End-to-end / integration tests (API-level)
├── fixtures/     # Shared test data / seed data
└── helpers/      # Shared test utility functions and factories
```

## Unit Tests

Unit tests live **co-located** with the source files inside `src/`:

```
src/
└── components/
    └── database/
        ├── database.service.ts
        └── database.service.spec.ts  ← unit test
```

Run unit tests:

```bash
pnpm test
# or with coverage:
pnpm test -- --coverage
```

## E2E Tests

End-to-end tests are placed in `tests/e2e/` and test the application from the outside (HTTP requests to the running
API).
> ⚠️ E2E test framework has not been selected yet. See the ADR backlog.

## Fixtures

Shared test data objects, factories, and seed utilities used across multiple test suites.

## Helpers

Reusable test setup functions, custom matchers, and utility wrappers (e.g., mock factories for PrismaService, BullMQ).

## Configuration

Unit test config: [`jest.config.js`](../jest.config.js) at project root.
For full testing guidelines, see [`docs/guides/testing.md`](../docs/guides/testing.md).
