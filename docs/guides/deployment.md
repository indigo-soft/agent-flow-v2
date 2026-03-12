# Deployment Guide

> **See also:
** [ADR-017 — No Docker, Native Development & Production](../adr/017-no-docker-native-development-production.md)
> This guide describes how to deploy **agent-flow-v2** natively on Ubuntu 24.04 (no Docker, no containers).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [PM2 Process Management](#pm2-process-management)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [SSL / TLS with Certbot](#ssl--tls-with-certbot)
- [Health Checks](#health-checks)
- [Rollback Procedure](#rollback-procedure)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Prerequisites

Install the following on your Ubuntu 24.04 server before deploying:

### Node.js 24 (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 24
nvm use 24
nvm alias default 24
node -v  # should print v24.x.x
```

### pnpm 10

```bash
npm install -g pnpm@10
pnpm -v  # should print 10.x.x
```

### PM2

```bash
npm install -g pm2
pm2 -v
```

### PostgreSQL 16

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create database and user:

```bash
sudo -u postgres psql << SQL
CREATE USER agentflow WITH PASSWORD 'your_strong_password';
CREATE DATABASE agentflow_db OWNER agentflow;
GRANT ALL PRIVILEGES ON DATABASE agentflow_db TO agentflow;
SQL
```

### Redis 7

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping  # should return PONG
```

### Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---
## Environment Variables

Create a `.env` file at the project root. **Never commit `.env` to version control.**

```env
# Application
NODE_ENV=production
PORT=3000
# Database
DATABASE_URL=postgresql://agentflow:your_strong_password@localhost:5432/agentflow_db
# Redis
REDIS_URL=redis://localhost:6379
# AI Provider
AI_PROVIDER_API_KEY=sk-...
# GitHub Integration
GITHUB_TOKEN=ghp_...
# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
# Security
JWT_SECRET=your_random_jwt_secret_min_32_chars
```

> 📋 See `.env.example` for a full template with all available variables.
---

## Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:your-org/agent-flow-v2.git /var/www/agent-flow-v2
cd /var/www/agent-flow-v2
pnpm install --frozen-lockfile
```

Run the one-time project setup (configures git commit template, lefthook):

```bash
pnpm setup
```

---

## Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
pnpm prisma:generate
# Apply all pending migrations (production)
pnpm prisma:migrate:deploy
```

> ⚠️ Use `pnpm prisma:migrate` (dev migration) **only in development**, never in production.
---

## Build
```bash
pnpm build
```

This produces:

- `dist/` — compiled NestJS backend
- `src/components/dashboard/.next/` — compiled Next.js frontend

---

## PM2 Process Management

### Ecosystem Configuration

Create `ecosystem.config.js` at project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'agent-flow-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/pm2/backend-error.log',
      out_file: 'logs/pm2/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'agent-flow-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start src/components/dashboard -p 3001',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: 'logs/pm2/dashboard-error.log',
      out_file: 'logs/pm2/dashboard-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
```

### Starting / Managing Processes
```bash
# Start all apps in production mode
pm2 start ecosystem.config.js --env production
# Save PM2 process list (survives server reboots)
pm2 save
# Enable PM2 to start on system boot
pm2 startup
# (follow the printed command to finalize systemd integration)
# Status
pm2 status
# Logs
pm2 logs
pm2 logs agent-flow-backend
pm2 logs agent-flow-dashboard
# Restart
pm2 restart agent-flow-backend
pm2 restart all
# Stop
pm2 stop all
# Delete from PM2
pm2 delete all
```

---

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/agent-flow`:

```nginx
upstream backend {
    server 127.0.0.1:3000;
}
upstream dashboard {
    server 127.0.0.1:3001;
}
server {
    listen 80;
    server_name your-domain.com;
    # Redirect HTTP → HTTPS (uncomment after Certbot setup)
    # return 301 https://$host$request_uri\;
    # API (NestJS backend)
    location /api/ {
        proxy_pass http://backend/\;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    # Frontend (Next.js dashboard)
    location / {
        proxy_pass http://dashboard\;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/agent-flow /etc/nginx/sites-enabled/
sudo nginx -t           # test configuration
sudo systemctl reload nginx
```

---

## SSL / TLS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
# Certbot automatically updates the nginx config and adds HTTPS
# Auto-renewal is set up via systemd timer:
sudo systemctl status certbot.timer
```

---

## Health Checks

```bash
# Backend API health
curl http://localhost:3000/health
# Nginx
curl -I http://your-domain.com/api/health
# PM2 status
pm2 status
# PostgreSQL
pg_isready -h localhost -U agentflow
# Redis
redis-cli ping
```

---

## Rollback Procedure

1. **Identify the previous release tag:**
   ```bash
   git tag --sort=-version:refname | head -5
   ```
2. **Checkout previous tag:**
   ```bash
   git checkout v0.x.x
   pnpm install --frozen-lockfile
   pnpm build
   ```
3. **Roll back database migrations (if needed):**
   ```bash
   # Check current migration status
   npx prisma migrate status
   # Revert (Prisma does not have automatic rollback — restore from backup)
   ```
4. **Restore database from backup:**
   ```bash
   pg_restore -h localhost -U agentflow -d agentflow_db backup.dump
   ```
5. **Restart PM2:**
   ```bash
   pm2 restart all
   ```

---

## Database Backups

Set up a daily backup cron job:

```bash
# Edit crontab
crontab -e
# Add: daily backup at 3am
0 3 * * * pg_dump -h localhost -U agentflow agentflow_db -F c -f /var/backups/agentflow/$(date +\%Y-\%m-\%d).dump
```

---
## CI/CD Pipeline

Automated quality gates run on every PR and push to `main` via GitHub Actions (`.github/workflows/ci.yml`):

1. **Lint** — ESLint
2. **Format Check** — Prettier
3. **Type Check** — `tsc --noEmit`
4. **Tests** — Jest
   See [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) for the full workflow definition.
   For release automation, see [`docs/guides/release-flow.md`](./release-flow.md).
