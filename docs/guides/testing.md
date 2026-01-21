# Testing Guide

This guide outlines the testing strategy and practices for **agent-flow-v2**.

## Testing Frameworks

- **Backend**: Jest with `supertest` for API testing.
- **Frontend**: Jest and React Testing Library.

## Test Types

### 1. Unit Tests

- **Backend**: Focus on services, logic, and utility functions.
- **Frontend**: Focus on individual components and hooks.
- **Location**: Adjacent to the source file, naming format: `*.spec.ts` or `*.test.tsx`.

### 2. Integration Tests

- Testing interaction between NestJS modules and the database (using a test database).
- Testing agent interactions through BullMQ mocks.

### 3. E2E Tests

- Testing full user flows from Dashboard to API.
- Tools: Playwright or Cypress (planned).

## Running Tests

```bash
# Run all tests
pnpm test

# Run backend tests
pnpm --filter backend test

# Run dashboard tests
pnpm --filter dashboard test
```

## Best Practices

- **Mocking**: Use `jest.mocked` for typed dependencies.
- **Coverage**: Aim for high coverage in core logic and agent services.
- **Clean Slate**: Ensure tests are independent and don't rely on global state.
- **Data**: Use Prisma factories or seed scripts for test data.

## Continuous Integration

Tests are automatically run on every Pull Request via GitHub Actions.
