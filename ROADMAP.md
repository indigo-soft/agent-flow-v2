# Project Roadmap

This document outlines the planned development path for **agent-flow-v2**.

## Phase 1: Foundation (Current)

- [x] Project structure setup (single-package, not a multi-package monorepo)
- [x] Architecture documentation
- [x] Tech stack selection (ADRs)
- [ ] Basic CI/CD setup (GitHub Actions workflows pending — see INF-02)
- [x] Backend & Frontend skeletons

## Phase 2: Core Functionality

- [ ] **Architect Agent**:
    - [ ] Conversation analysis engine
    - [ ] Plan draft generation
    - [ ] Task hierarchy creation (Epic -> Task -> Subtask)
- [ ] **Database & Queue**:
    - [ ] Prisma schema for conversations, tasks, and agents
    - [ ] BullMQ integration for background processing
- [ ] **API Gateway**:
    - [ ] Authentication & Authorization
    - [ ] Task management endpoints

## Phase 3: Agentic Workflows

- [ ] **GitHub Integration**:
    - [ ] Branch management
    - [ ] Pull Request automation
- [ ] **Workflow Agent**:
    - [ ] Lifecycle management for tasks
    - [ ] Integration between agents
- [ ] **Code Review Agent**:
    - [ ] Automated AI-powered code reviews
    - [ ] GitHub PR commenting integration

## Phase 4: Refinement & Documentation

- [ ] **Documentation Agent**:
    - [ ] Auto-updating docs based on code changes
- [ ] **Dashboard Enhancements**:
    - [ ] Full Kanban board
    - [ ] Real-time task status updates (WebSockets)
- [ ] **AI Provider Abstraction**:
    - [ ] Support for multiple providers (OpenAI, Anthropic, local models)

## Phase 5: Production Readiness

- [ ] Performance optimization
- [ ] Comprehensive testing (E2E)
- [ ] Deployment guides & scripts
- [ ] Public release / Beta testing
