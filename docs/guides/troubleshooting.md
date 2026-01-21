# Troubleshooting Guide

This guide helps resolve common issues encountered during development or deployment.

## Common Issues

### 1. Database Connection Failures

- **Symptom**: `PrismaClientInitializationError: Can't reach database server`.
- **Solution**:
  - Ensure Docker is running.
  - Check `DATABASE_URL` in `.env`.
  - Verify PostgreSQL container is healthy: `docker ps`.

### 2. Redis/Queue Errors

- **Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:6379`.
- **Solution**:
  - Ensure Redis is running.
  - Check `REDIS_URL` in `.env`.

### 3. Agent Execution Hangs

- **Symptom**: BullMQ job remains in "active" or "waiting" state for too long.
- **Solution**:
  - Check logs for the specific agent module.
  - Verify AI Provider API limits (Rate limits).
  - Ensure `GITHUB_TOKEN` has sufficient permissions.

### 4. Build Errors (Monorepo)

- **Symptom**: `Module not found` or workspace dependency issues.
- **Solution**:
  - Run `pnpm install` at the root.
  - Ensure shared packages are built first if they are not using `ts-node` or similar.

## Logging

We use **Pino** for logging.

- **Local**: Logs are pretty-printed to the console.
- **Production**: Logs are output in JSON format for easy ingestion by log aggregators (ELK, Datadog).

To increase log verbosity:
Set `LOG_LEVEL=debug` in your `.env` file.

## Getting Help

If your issue is not listed here:

1. Check existing GitHub Issues.
2. Ask in the project communication channel (Slack/Discord).
3. Open a new issue with detailed steps to reproduce.
