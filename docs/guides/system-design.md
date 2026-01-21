# System Design

This document describes the high-level design and architectural patterns used in **agent-flow-v2**.

## Architectural Patterns

### 1. Monorepo

We use a monorepo approach with `pnpm workspaces` to manage backend, frontend, and shared packages in a single
repository. This facilitates shared types and unified tooling.

### 2. Event-Driven Architecture (EDA)

Agents communicate asynchronously via a message queue (BullMQ). This decouples the API Gateway from long-running AI
tasks and GitHub operations, improving system resilience and scalability.

### 3. Agentic Pattern

Instead of a single "God AI", we use specialized agents (Architect, Workflow, Code Review, Documentation). Each agent
has a narrow scope, its own prompt templates, and specific triggers.

## Key Components

### API Gateway (NestJS)

- Validates incoming requests from the Dashboard.
- Manages the state of "Draft Plans" before they become "Tasks".
- Publishes events to start agent workflows.

### Message Queue (BullMQ/Redis)

- Handles background jobs.
- Provides retry mechanisms and job monitoring.

### Database (PostgreSQL/Prisma)

- Stores persistent state: conversations, task hierarchies, agent logs, and PR metadata.

## Data Flow

1. **User Input**: raw text -> API -> **Architect Agent**.
2. **Drafting**: AI -> API -> User feedback -> API -> AI.
3. **Execution**: User commit -> API -> Database (Tasks created) -> **Workflow Agent** (Branch created).
4. **Code Review**: Developer/AI push -> GitHub Webhook/Event -> **Code Review Agent**.
5. **Finalization**: Merge -> **Workflow Agent** (Cleanup) -> **Documentation Agent**.
