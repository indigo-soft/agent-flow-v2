# System Requirements

This document specifies the requirements for running and developing **agent-flow-v2**.

## Development Environment

### Software

- **Node.js**: v20.x or higher (LTS recommended).
- **pnpm**: v8.x or higher.
- **Docker**: For running PostgreSQL and Redis locally.
- **Git**: For version control.

### Services

- **PostgreSQL**: v15 or higher.
- **Redis**: v7.x or higher (for BullMQ).
- **GitHub Account**: With Personal Access Token (PAT) for agent operations.
- **AI Provider API Key**: OpenAI, Anthropic, or compatible provider.

## Production Environment

### Backend

- **Containerization**: Docker & Docker Compose.
- **Database**: Managed PostgreSQL (e.g., AWS RDS, Supabase).
- **Cache/Queue**: Managed Redis (e.g., AWS ElastiCache, Upstash).

### Frontend

- **Hosting**: Vercel, Netlify, or self-hosted Docker container.

## Minimum Hardware

- **CPU**: 2 cores.
- **RAM**: 4GB minimum, 8GB recommended for development.
- **Disk**: 1GB for source code and basic database.
