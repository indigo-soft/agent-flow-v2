# Deployment Guide

This document provides instructions for deploying **agent-flow-v2**.

## Containerization

The project is designed to run in Docker containers.

### Docker Compose (Local/Staging)

A `docker-compose.yaml` (planned) will orchestrate:

- `backend`: NestJS API.
- `dashboard`: Next.js Frontend.
- `postgres`: Database.
- `redis`: Queue and Cache.

## Environment Variables

Ensure the following variables are set in production:

### Shared

- `NODE_ENV`: `production`

### Backend

- `DATABASE_URL`: Connection string for PostgreSQL.
- `REDIS_URL`: Connection string for Redis.
- `GITHUB_TOKEN`: Personal Access Token for agents.
- `AI_PROVIDER_API_KEY`: API key for OpenAI/Anthropic.
- `PORT`: Default `3000`.

### Dashboard

- `NEXT_PUBLIC_API_URL`: URL of the Backend API.

## Deployment Steps

### 1. Build

```bash
pnpm build
```

### 2. Database Migrations

```bash
pnpm --filter backend prisma migrate deploy
```

### 3. Start

```bash
pnpm start
```

## CI/CD Pipeline

We use GitHub Actions for:

1. **Linting & Testing**: On every PR.
2. **Building Docker Images**: On merge to `main`.
3. **Deployment**: Automatic deployment to target environment (e.g., K8s, AWS ECS, or VPS).
