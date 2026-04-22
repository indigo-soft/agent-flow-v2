# ADR Index

Повний список Architecture Decision Records.

→ [README.md](README.md) — документація, lifecycle, правила  
→ [air/README.md](air/README.md) — Architecture Issue Records

---

## Backend

| #                                        | Назва                          | Статус   | Дата       |
|------------------------------------------|--------------------------------|----------|------------|
| [001](001-backend-framework-nestjs.md)   | Backend Framework (NestJS)     | Accepted | 2024-01-20 |
| [002](002-nestjs-fastify-adapter.md)     | Fastify Adapter для NestJS     | Accepted | 2024-01-20 |
| [003](003-queue-system-bullmq.md)        | Queue System (BullMQ)          | Accepted | 2024-01-20 |
| [004](004-database-postgresql-prisma.md) | Database (PostgreSQL + Prisma) | Accepted | 2024-01-20 |
| [005](005-testing-framework-jest.md)     | Testing Framework (Jest)       | Accepted | 2024-01-20 |
| [006](006-logging-pino.md)               | Logging (Pino)                 | Accepted | 2024-01-20 |

## Frontend

| #                                             | Назва                                | Статус   | Дата       |
|-----------------------------------------------|--------------------------------------|----------|------------|
| [007](007-frontend-framework-nextjs-react.md) | Frontend Framework (Next.js + React) | Accepted | 2024-01-20 |

## Cross-cutting

| #                                                         | Назва                                       | Статус     | Дата       |
|-----------------------------------------------------------|---------------------------------------------|------------|------------|
| [008](008-data-validation-strategy.md)                    | Data Validation Strategy                    | Accepted   | 2024-01-20 |
| [009](archive/009-monorepo-structure.md)                  | Monorepo Structure                          | Superseded | 2024-01-20 |
| [010](010-error-handling-strategy.md)                     | Error Handling Strategy                     | Accepted   | 2024-01-20 |
| [011](011-code-formatting-prettier.md)                    | Code Formatting (Prettier)                  | Accepted   | 2024-01-20 |
| [012](012-code-linting-eslint.md)                         | Code Linting (ESLint)                       | Accepted   | 2024-01-20 |
| [013](archive/013-git-hooks-husky-lint-staged.md)         | Git Hooks (Husky + lint-staged)             | Superseded | 2024-01-20 |
| [014](014-tools-summary.md)                               | Tools Summary                               | Accepted   | 2024-01-20 |
| [015](015-git-workflow-branching-strategy.md)             | Git Workflow and Branching Strategy         | Accepted   | 2024-01-20 |
| [018](archive/018-file-structure-flat-modular.md)         | Flat Modular File Structure                 | Superseded | 2024-01-20 |
| [019](019-security-strategy.md)                           | Security Strategy                           | Accepted   | 2026-01-27 |
| [020](020-state-management-strategy.md)                   | State Management Strategy                   | Accepted   | 2026-01-27 |
| [021](021-observability-strategy.md)                      | Observability Strategy                      | Accepted   | 2026-01-27 |
| [022](022-api-design-strategy.md)                         | API Design Strategy                         | Accepted   | 2026-01-27 |
| [023](023-git-hooks-lefthook.md)                          | Git Hooks (Lefthook)                        | Accepted   | 2026-02-11 |
| [024](024-flat-modular-architecture-with-shared-layer.md) | Flat Modular Architecture with Shared Layer | Accepted   | 2026-02-19 |
| [025](025-changelog-release-it.md)                        | Changelog Automation (release-it)           | Accepted   | 2026-03-22 |

## Tooling & Infrastructure

| #                                                     | Назва                                                   | Статус   | Дата       |
|-------------------------------------------------------|---------------------------------------------------------|----------|------------|
| [016](016-package-manager-pnpm.md)                    | Package Manager (pnpm)                                  | Accepted | 2024-01-20 |
| [017](017-no-docker-native-development-production.md) | Нативна розробка та deployment без Docker               | Accepted | 2024-01-20 |
| [026](026-dependency-management.md)                   | Automated Dependency Management (Renovate + Dependabot) | Accepted | 2026-03-24 |

## AI / LLM

> ADR-028 частково конфліктує з ADR-017 — деталі у [AIR-001](air/done-air-001-langfuse-clickhouse-vs-adr-017.md).

| #                                        | Назва                                    | Статус   | Дата       |
|------------------------------------------|------------------------------------------|----------|------------|
| [027](027-ai-sdk-vercel.md)              | AI SDK (Vercel AI SDK)                   | Accepted | 2026-04-18 |
| [028](028-llm-observability-langfuse.md) | LLM Observability (Langfuse self-hosted) | Accepted | 2026-04-18 |
| [029](029-prompt-testing-promptfoo.md)   | Prompt Testing (Promptfoo)               | Accepted | 2026-04-18 |
| [030](030-prompt-caching-strategy.md)    | Prompt Caching Strategy                  | Accepted | 2026-04-18 |

---

## Архів (Superseded ADR)

Файли у `archive/` — рішення, які були замінені іншими.

| #                                                                | Назва                           | Замінено на |
|------------------------------------------------------------------|---------------------------------|-------------|
| [009](archive/009-monorepo-structure.md)                         | Monorepo Structure              | ADR-024     |
| [013](archive/013-git-hooks-husky-lint-staged.md)                | Git Hooks (Husky + lint-staged) | ADR-023     |
| [018](archive/018-file-structure-flat-modular.md)                | Flat Modular File Structure     | ADR-024     |
