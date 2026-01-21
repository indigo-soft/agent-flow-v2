# Coding Standards

This document defines the coding standards and best practices for **agent-flow-v2**.

## General Principles

- **KISS**: Keep It Simple, Stupid.
- **DRY**: Don't Repeat Yourself.
- **SOLID**: Follow SOLID principles where applicable.

## TypeScript

- **Strict Mode**: Must be enabled.
- **No `any`**: Use `unknown` or specific types/interfaces.
- **Explicit Returns**: Always define function return types.

## Backend (NestJS)

- **Controllers**: Keep thin; move logic to Services.
- **DTOs**: Use for all incoming data validation with `class-validator`.
- **Dependency Injection**: Use constructor-based DI.
- **Async/Await**: Preferred over Promises/Observables for readability.
- **Error Handling**: Use built-in `HttpException` or custom filters.

## Frontend (Next.js/React)

- **Functional Components**: Use hooks (`useState`, `useEffect`, `useMemo`).
- **Tailwind CSS**: Use utility classes for styling.
- **Props**: Use TypeScript interfaces for all component props.
- **State Management**: Use React Context or specialized libraries (Zustand/TanStack Query) if needed.

## Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Methods**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

## Documentation

- **JSDoc**: Required for public methods and complex logic.
- **Comments**: Explain *why*, not *what* (the code should explain *what*).
