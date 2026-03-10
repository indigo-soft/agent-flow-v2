# ADR-021: Observability Strategy

## Статус

Accepted

## Контекст

Проєкт потребує observability для:

- Діагностики проблем у production
- Моніторингу performance
- Швидкого реагування на інциденти
- Розуміння поведінки системи

Вимоги:

- **Self-hosted** — без third-party сервісів
- **Простота** — мінімум інфраструктури для MVP
- **Ефективність** — не перевантажувати систему
- **Actionable** — alerts тільки на важливі події

## Рішення

Використовуємо **двокомпонентну систему**:

1. **Structured Logging** (Pino) — події та помилки
2. **Log-based Metrics** — парсинг логів для метрик
3. **Slack Alerts** — повідомлення про критичні події

**Без:**

- ❌ Prometheus (overkill для MVP)
- ❌ Tracing (OpenTelemetry додати пізніше)
- ❌ Email alerts (тільки Slack)

## Обґрунтування

### Чому logs + parsing замість Prometheus?

**Переваги:**

- ✅ Простіше — один механізм замість двох
- ✅ Менше інфраструктури — не треба Prometheus server
- ✅ Unified — метрики витягуються з тих самих логів що й debug
- ✅ Self-sufficient — все в одному місці

**Недоліки:**

- ⚠️ Менш ефективний парсинг (але для MVP достатньо)
- ⚠️ Обмежені можливості querying (але базові metrics достатньо)

**Рішення:** Для MVP logs + parsing оптимальний. При масштабуванні (>10k requests/day) переглянути на Prometheus.

---

## Logging Strategy

### 1. Що саме логувати

```typescript
// HTTP Requests
{ 
  level: "info",
  msg: "HTTP request",
  method: "POST",
  path: "/tasks",
  statusCode: 201,
  duration: 45,
  userId: "user-123"
}

// Errors
{
  level: "error",
  msg: "Database query failed",
  error: "Connection timeout",
  stack: "...",
  query: "SELECT * FROM tasks",
  userId: "user-123"
}

// Database Queries (slow only)
{
  level: "warn",
  msg: "Slow database query",
  query: "SELECT...",
  duration: 1523,
  threshold: 1000
}

// Queue Jobs
{
  level: "info",
  msg: "Queue job completed",
  queue: "architect-events",
  jobId: "job-456",
  duration: 2345,
  status: "completed"
}

// Agent Operations
{
  level: "info",
  msg: "Draft created",
  agentType: "architect",
  draftId: "draft-789",
  userId: "user-123",
  duration: 15234
}
```

### 2. Log Levels

```typescript
error → Критичні помилки (500 errors, failed jobs, DB connection lost)
warn  → Попередження (slow queries, rate limits, high memory)
info  → Важливі події (requests, tasks created, jobs completed)
debug → Тільки development (детальна діагностика)
```

**Production:** `info` та вище (info, warn, error)  
**Development:** `debug` та вище (всі)

### 3. Log Files Structure

```
logs/
├── app.json.log           # Structured JSON (для parsing)
├── app.pretty.log         # Human-readable (для читання)
├── error.json.log         # Тільки errors + warnings (JSON)
├── error.pretty.log       # Тільки errors + warnings (pretty)
│
├── app.json.log.2024-01-20     # Rotated
├── app.pretty.log.2024-01-20
└── ...
```

### 4. Dual Format Implementation

```typescript
// src/logger/logger.service.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  
  // Production: masking sensitive data
  ...(isProduction && {
    redact: {
      paths: [
        'password',
        'token',
        'apiKey',
        'authorization',
        'cookie',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: (value) => {
        if (typeof value === 'string' && value.length > 6) {
          return value.slice(0, 3) + '***' + value.slice(-3);
        }
        return '***';
      },
    },
  }),

  transport: {
    targets: [
      // JSON logs
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: 'logs/app.json.log',
          mkdir: true,
        },
      },
      // Pretty logs
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          destination: 'logs/app.pretty.log',
          mkdir: true,
          colorize: false,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
      // Errors JSON
      {
        target: 'pino/file',
        level: 'warn',
        options: {
          destination: 'logs/error.json.log',
          mkdir: true,
        },
      },
      // Errors Pretty
      {
        target: 'pino-pretty',
        level: 'warn',
        options: {
          destination: 'logs/error.pretty.log',
          mkdir: true,
          colorize: false,
        },
      },
    ],
  },
});
```

### 5. NestJS Integration

```typescript
// src/core/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '@/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          logger.info({
            msg: 'HTTP request',
            method,
            path: url,
            statusCode: response.statusCode,
            duration: Date.now() - startTime,
            userId: user?.userId,
          });
        },
        error: (error) => {
          logger.error({
            msg: 'HTTP request failed',
            method,
            path: url,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime,
            userId: user?.userId,
          });
        },
      }),
    );
  }
}
```

### 6. Prisma Logging

```typescript
// src/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log slow queries
    this.$on('query' as any, (e: any) => {
      if (e.duration > 1000) {
        logger.warn({
          msg: 'Slow database query',
          query: e.query,
          duration: e.duration,
          threshold: 1000,
        });
      }
    });

    this.$on('error' as any, (e: any) => {
      logger.error({
        msg: 'Database error',
        error: e.message,
      });
    });
  }
}
```

### 7. Log Rotation

```typescript
// ecosystem.config.js (PM2)
module.exports = {
  apps: [{
    name: 'backend',
    script: 'dist/main.js',
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
```

**Cleanup Script:**

```bash
#!/bin/bash
# scripts/observability/cleanup-logs.sh

LOG_DIR="logs"
RETENTION_DAYS=30

echo "[$(date)] Starting log cleanup (retention: ${RETENTION_DAYS} days)"

# Delete old logs
find ${LOG_DIR} -name "*.log.*" -mtime +${RETENTION_DAYS} -type f -delete

# Count remaining logs
REMAINING=$(find ${LOG_DIR} -name "*.log.*" -type f | wc -l)
echo "[$(date)] Cleanup completed. Remaining rotated logs: ${REMAINING}"
```

**Cron:**

```cron
0 2 * * * /home/deploy/ai-workflow-assistant/scripts/observability/cleanup-logs.sh >> /home/deploy/logs/cleanup.log 2>&1
```

---

## Metrics Strategy

### 1. Log-Based Metrics

Замість окремої системи метрик (Prometheus) — парсимо structured logs.

**Metrics Script:**

```javascript
#!/usr/bin/env node
// scripts/observability/parse-metrics.js

const fs = require('fs');
const readline = require('readline');

const WINDOW_MINUTES = 15;
const LOG_FILE = 'logs/app.json.log';

class MetricsCollector {
  constructor() {
    this.metrics = {
      http: { total: 0, by_status: {}, by_path: {}, durations: [] },
      queue: { total: 0, completed: 0, failed: 0, durations: [] },
      db: { slow_queries: 0, errors: 0 },
      memory: { current: 0, samples: [] },
      errors: [],
    };
    this.windowStart = Date.now() - WINDOW_MINUTES * 60 * 1000;
  }

  parseLine(line) {
    try {
      const log = JSON.parse(line);
      const timestamp = new Date(log.time).getTime();
      
      if (timestamp < this.windowStart) return;

      // HTTP metrics
      if (log.msg === 'HTTP request') {
        this.metrics.http.total++;
        this.metrics.http.by_status[log.statusCode] = 
          (this.metrics.http.by_status[log.statusCode] || 0) + 1;
        this.metrics.http.by_path[log.path] = 
          (this.metrics.http.by_path[log.path] || 0) + 1;
        this.metrics.http.durations.push(log.duration);
      }

      // Queue metrics
      if (log.msg?.includes('Queue job')) {
        this.metrics.queue.total++;
        if (log.status === 'completed') this.metrics.queue.completed++;
        if (log.status === 'failed') this.metrics.queue.failed++;
        if (log.duration) this.metrics.queue.durations.push(log.duration);
      }

      // DB metrics
      if (log.msg === 'Slow database query') {
        this.metrics.db.slow_queries++;
      }
      if (log.msg === 'Database error') {
        this.metrics.db.errors++;
      }

      // Memory
      if (log.memoryUsage) {
        this.metrics.memory.samples.push(log.memoryUsage);
      }

      // Errors
      if (log.level === 'error') {
        this.metrics.errors.push({
          time: log.time,
          msg: log.msg,
          error: log.error,
        });
      }
    } catch (err) {
      // Skip invalid JSON
    }
  }

  async collect() {
    const stream = fs.createReadStream(LOG_FILE);
    const rl = readline.createInterface({ input: stream });

    for await (const line of rl) {
      this.parseLine(line);
    }

    return this.calculate();
  }

  calculate() {
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const p95 = (arr) => {
      if (!arr.length) return 0;
      const sorted = arr.sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * 0.95)];
    };

    return {
      window_minutes: WINDOW_MINUTES,
      timestamp: new Date().toISOString(),
      http: {
        total: this.metrics.http.total,
        rps: (this.metrics.http.total / (WINDOW_MINUTES * 60)).toFixed(2),
        by_status: this.metrics.http.by_status,
        avg_duration_ms: avg(this.metrics.http.durations).toFixed(0),
        p95_duration_ms: p95(this.metrics.http.durations).toFixed(0),
      },
      queue: {
        total: this.metrics.queue.total,
        completed: this.metrics.queue.completed,
        failed: this.metrics.queue.failed,
        success_rate: this.metrics.queue.total 
          ? ((this.metrics.queue.completed / this.metrics.queue.total) * 100).toFixed(1)
          : 100,
        avg_duration_ms: avg(this.metrics.queue.durations).toFixed(0),
      },
      database: {
        slow_queries: this.metrics.db.slow_queries,
        errors: this.metrics.db.errors,
      },
      memory: {
        avg_mb: (avg(this.metrics.memory.samples) / 1024 / 1024).toFixed(0),
        current_mb: this.metrics.memory.samples.length
          ? (this.metrics.memory.samples[this.metrics.memory.samples.length - 1] / 1024 / 1024).toFixed(0)
          : 0,
      },
      errors: {
        total: this.metrics.errors.length,
        recent: this.metrics.errors.slice(-5),
      },
    };
  }
}

async function main() {
  const collector = new MetricsCollector();
  const metrics = await collector.collect();
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch(console.error);
```

**Usage:**

```bash
# Manual run
node scripts/observability/parse-metrics.js

# Output:
{
  "window_minutes": 15,
  "http": {
    "total": 1523,
    "rps": "1.69",
    "by_status": { "200": 1489, "400": 12, "500": 2 },
    "avg_duration_ms": "45",
    "p95_duration_ms": "189"
  },
  "queue": {
    "total": 34,
    "completed": 32,
    "failed": 2,
    "success_rate": "94.1"
  }
}
```

**Endpoint (опціонально):**

```typescript
// components/api/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    const { stdout } = await execAsync('node scripts/observability/parse-metrics.js');
    return JSON.parse(stdout);
  }
}
```

---

## Alerts Strategy

### 1. Alert Rules

**Critical (🔴 Slack):**

- `level="error"` з keywords: "Database", "Redis", "Fatal", "Crash"
- HTTP 500 errors > 2 за 1 годину
- Queue job failed > 2 за 1 годину
- Memory usage > 85%

**Warning (🟡 Slack):**

- HTTP 429 (rate limit)
- Slow DB query (> 1 second)
- Queue jobs waiting > 50
- Memory usage > 80%

### 2. Alert Script

```javascript
#!/usr/bin/env node
// scripts/observability/check-alerts.js

const fs = require('fs');
const readline = require('readline');
const axios = require('axios');

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const ERROR_LOG = 'logs/error.json.log';
const WINDOW_MINUTES = 15;
const LAST_CHECK_FILE = '/tmp/last-alert-check';

class AlertChecker {
  constructor() {
    this.alerts = [];
    this.windowStart = this.getLastCheckTime();
  }

  getLastCheckTime() {
    try {
      const lastCheck = fs.readFileSync(LAST_CHECK_FILE, 'utf8');
      return new Date(lastCheck).getTime();
    } catch {
      return Date.now() - WINDOW_MINUTES * 60 * 1000;
    }
  }

  saveCheckTime() {
    fs.writeFileSync(LAST_CHECK_FILE, new Date().toISOString());
  }

  async checkLogs() {
    const stream = fs.createReadStream(ERROR_LOG);
    const rl = readline.createInterface({ input: stream });

    const errors = { critical: [], warnings: [] };

    for await (const line of rl) {
      try {
        const log = JSON.parse(line);
        const timestamp = new Date(log.time).getTime();
        
        if (timestamp < this.windowStart) continue;

        // Critical: Keywords in error
        if (log.level === 'error') {
          const keywords = ['Database', 'Redis', 'Fatal', 'Crash'];
          if (keywords.some(k => log.msg?.includes(k) || log.error?.includes(k))) {
            errors.critical.push(log);
          }
        }

        // Warning: Slow query
        if (log.msg === 'Slow database query' && log.duration > 1000) {
          errors.warnings.push(log);
        }

        // Warning: Rate limit
        if (log.statusCode === 429) {
          errors.warnings.push(log);
        }
      } catch {}
    }

    return errors;
  }

  async checkMetrics() {
    // Run metrics script
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync('node scripts/observability/parse-metrics.js');
      const metrics = JSON.parse(stdout);

      const alerts = [];

      // HTTP 500 errors
      if (metrics.http.by_status[500] > 2) {
        alerts.push({
          severity: 'critical',
          msg: `High 500 error rate: ${metrics.http.by_status[500]} in ${metrics.window_minutes}min`,
        });
      }

      // Queue failures
      if (metrics.queue.failed > 2) {
        alerts.push({
          severity: 'critical',
          msg: `Queue failures: ${metrics.queue.failed} in ${metrics.window_minutes}min`,
        });
      }

      // Memory usage (if tracked)
      if (metrics.memory.current_mb > 850) {
        alerts.push({
          severity: 'critical',
          msg: `High memory usage: ${metrics.memory.current_mb}MB (>85%)`,
        });
      } else if (metrics.memory.current_mb > 800) {
        alerts.push({
          severity: 'warning',
          msg: `Memory usage: ${metrics.memory.current_mb}MB (>80%)`,
        });
      }

      return alerts;
    } catch (err) {
      return [];
    }
  }

  async sendSlackAlert(severity, message) {
    if (!SLACK_WEBHOOK) {
      console.log(`[${severity}] ${message}`);
      return;
    }

    const emoji = severity === 'critical' ? '🔴' : '🟡';
    const color = severity === 'critical' ? '#ff0000' : '#ffaa00';

    await axios.post(SLACK_WEBHOOK, {
      attachments: [{
        color,
        title: `${emoji} ${severity.toUpperCase()} Alert`,
        text: message,
        footer: 'AI Workflow Assistant',
        ts: Math.floor(Date.now() / 1000),
      }],
    });
  }

  async run() {
    console.log(`[${new Date().toISOString()}] Checking alerts...`);

    // Check logs
    const logAlerts = await this.checkLogs();
    
    // Check metrics
    const metricAlerts = await this.checkMetrics();

    // Send critical alerts
    for (const log of logAlerts.critical) {
      await this.sendSlackAlert('critical', 
        `Error: ${log.msg}\n${log.error || ''}`
      );
    }

    // Send warnings (aggregated)
    if (logAlerts.warnings.length > 0) {
      await this.sendSlackAlert('warning',
        `${logAlerts.warnings.length} warnings detected:\n` +
        logAlerts.warnings.slice(0, 3).map(l => `• ${l.msg}`).join('\n')
      );
    }

    // Send metric alerts
    for (const alert of metricAlerts) {
      await this.sendSlackAlert(alert.severity, alert.msg);
    }

    this.saveCheckTime();
    console.log(`[${new Date().toISOString()}] Check completed`);
  }
}

new AlertChecker().run().catch(console.error);
```

### 3. Cron Setup

```cron
# Check alerts every 15 minutes
*/15 * * * * cd /home/deploy/ai-workflow-assistant && node scripts/observability/check-alerts.js >> logs/alerts.log 2>&1
```

### 4. Slack Webhook Setup

```bash
# .env.production
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Slack setup:**

1. Go to https://api.slack.com/apps
2. Create New App → "From scratch"
3. Add "Incoming Webhooks" feature
4. Activate webhooks
5. "Add New Webhook to Workspace"
6. Select channel (#alerts)
7. Copy Webhook URL

---

## Production Setup

### 1. Directory Structure

```
ai-workflow-assistant/
├── logs/
│   ├── app.json.log
│   ├── app.pretty.log
│   ├── error.json.log
│   ├── error.pretty.log
│   ├── alerts.log
│   └── cleanup.log
├── scripts/
│   └── observability/
│       ├── parse-metrics.js
│       ├── check-alerts.js
│       ├── cleanup-logs.sh
│       └── generate-report.sh
└── src/
    └── logger/
        └── logger.service.ts
```

### 2. Installation

```bash
# Install dependencies
pnpm add pino pino-pretty

# Create logs directory
mkdir -p logs

# Make scripts executable
chmod +x scripts/observability/*.sh

# Setup cron jobs
crontab -e

# Add:
# Cleanup logs (daily 2 AM)
0 2 * * * /home/deploy/ai-workflow-assistant/scripts/observability/cleanup-logs.sh >> logs/cleanup.log 2>&1

# Check alerts (every 15 min)
*/15 * * * * cd /home/deploy/ai-workflow-assistant && node scripts/observability/check-alerts.js >> logs/alerts.log 2>&1
```

### 3. Environment Variables

```bash
# .env.production
NODE_ENV="production"
LOG_LEVEL="info"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

---

## Daily Summary Report (Bonus)

```bash
#!/bin/bash
# scripts/observability/generate-report.sh

DATE=$(date +%Y-%m-%d)
REPORT_FILE="logs/report-${DATE}.txt"

echo "=== Daily Report: ${DATE} ===" > ${REPORT_FILE}
echo "" >> ${REPORT_FILE}

# Metrics
echo "## Metrics" >> ${REPORT_FILE}
node scripts/observability/parse-metrics.js >> ${REPORT_FILE}
echo "" >> ${REPORT_FILE}

# Error count
echo "## Errors" >> ${REPORT_FILE}
ERROR_COUNT=$(grep -c '"level":"error"' logs/error.json.log 2>/dev/null || echo 0)
WARN_COUNT=$(grep -c '"level":"warn"' logs/error.json.log 2>/dev/null || echo 0)
echo "Errors: ${ERROR_COUNT}" >> ${REPORT_FILE}
echo "Warnings: ${WARN_COUNT}" >> ${REPORT_FILE}
echo "" >> ${REPORT_FILE}

# Top errors
echo "## Top Errors" >> ${REPORT_FILE}
grep '"level":"error"' logs/error.json.log 2>/dev/null | \
  jq -r '.msg' | sort | uniq -c | sort -rn | head -5 >> ${REPORT_FILE}

echo "Report generated: ${REPORT_FILE}"
```

**Cron:**

```cron
0 1 * * * /home/deploy/ai-workflow-assistant/scripts/observability/generate-report.sh
```

---

## Наслідки

### Позитивні:

- ✅ **Простота** — один механізм (logs)
- ✅ **Self-hosted** — повний контроль
- ✅ **Unified** — метрики з тих самих логів
- ✅ **Actionable** — alerts тільки на важливі події
- ✅ **Lightweight** — мінімальний overhead

### Негативні:

- ⚠️ **Scaling limitations** — parsing може стати повільним при >100k logs/day
- ⚠️ **Limited querying** — немає PromQL-like мови
- ⚠️ **No historical trends** — тільки recent window

### Коли переглянути:

- [ ] Якщо logs > 100k/day (додати Prometheus)
- [ ] Якщо потрібен advanced querying (Loki/Elasticsearch)
- [ ] Якщо потрібен distributed tracing (OpenTelemetry)

---

## Monitoring Checklist

**Daily:**

- [ ] Перевірити Slack alerts
- [ ] Переглянути `error.pretty.log`

**Weekly:**

- [ ] Запустити `parse-metrics.js` та проаналізувати trends
- [ ] Перевірити disk usage (`du -sh logs/`)

**Monthly:**

- [ ] Review alert rules (false positives?)
- [ ] Optimize slow queries (якщо є warnings)
- [ ] Update retention policy якщо потрібно

---

## Зв'язки

- Related to: [ADR-006: Logging (Pino)](006-logging-pino.md) — базовий logging
- Related to: [ADR-019: Security Strategy](019-security-strategy.md) — не логувати secrets

## Автори

- @indigo-soft

## Дата

2024-01-27

## Теги

`observability` `logging` `metrics` `alerts` `pino` `slack` `monitoring` `self-hosted`
