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

---

## Node.js / pnpm Issues

### `pnpm` command not found

```bash
# Install pnpm globally
npm install -g pnpm@10
# Or via corepack (bundled with Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

### Wrong Node.js version

The project requires Node.js >= 24. Check with `node -v` and switch using nvm:

```bash
nvm install 24
nvm use 24
```

### `pnpm install` fails with frozen-lockfile error

```bash
# Regenerate the lockfile
pnpm install --no-frozen-lockfile
```

---

## PostgreSQL Issues

### `ECONNREFUSED` connecting to PostgreSQL

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# Start it if not running
sudo systemctl start postgresql
# Verify connection string in .env
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### `role "agentflow" does not exist`

```bash
sudo -u postgres psql -c "CREATE USER agentflow WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE agentflow_db OWNER agentflow;"
```

---

## Redis Issues

### `ECONNREFUSED` connecting to Redis

```bash
# Check if Redis is running
sudo systemctl status redis-server
# Start it
sudo systemctl start redis-server
# Test connection
redis-cli ping  # should return PONG
```

---

## Lefthook Issues

### Hooks not running

```bash
# Reinstall lefthook hooks
pnpm lefthook install
# or
pnpm setup
```

### Hook permission error

```bash
# Fix script permissions
chmod +x .lefthook/**/*
pnpm prepare:scripts
```

---

## TypeScript Path Alias Issues

### `Cannot find module '@modules/...'` or `'@components/...'`

Make sure `tsconfig.json` at the project root has the correct `paths`:

```json
{
    "compilerOptions": {
        "baseUrl": "./",
        "paths": {
            "@modules/*": [
                "src/modules/*"
            ],
            "@components/*": [
                "src/components/*"
            ]
        }
    }
}
```

And that `jest.config.js` has the matching `moduleNameMapper`:

```javascript
moduleNameMapper: {
    '^@modules/(.*)$'
:
    '<rootDir>/src/modules/$1',
            '^@components/(.*)$'
:
    '<rootDir>/src/components/$1',
}
```

---

## Git Issues

### Commit rejected — wrong format

All commits must follow `<type>(<scope>): <description>`. See [git-workflow.md](./git-workflow.md).

```bash
# Check commitlint config
cat commitlint.config.js
# Test a commit message manually
echo "feat(api): add health endpoint" | npx commitlint
```

### Branch name rejected

Branch names must follow `<type>/<issue-number(4+)>-<description>`. See [git-workflow.md](./git-workflow.md).

```bash
# Rename current branch
git branch -m feature/0042-my-feature
```
