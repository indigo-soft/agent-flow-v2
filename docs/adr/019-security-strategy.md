# ADR-019: Security Strategy

## Статус

Accepted

## Контекст

Проєкт обробляє **високочутливі дані**:

- 🔐 **GitHub токени** — доступ до приватних репозиторіїв
- 🔐 **AI Provider API ключі** — OpenAI, Anthropic (можуть бути дорогими)
- 🔐 **Вихідний код** — приватний код компанії/користувача
- 🔐 **Плани розробки** — конфіденційна бізнес-логіка
- 🔐 **Коментарі до PR** — можуть містити конфіденційну інформацію
- 🔐 **Database credentials** — доступ до PostgreSQL, Redis

Вимоги:

- **Zero third-party access** — всі дані тільки на наших серверах (див. ADR-017)
- **Self-hosted** — без зовнішніх managed сервісів
- **Encryption at rest** — конфіденційні дані зашифровані
- **Encryption in transit** — всі з'єднання через HTTPS/TLS
- **Access control** — тільки авторизовані користувачі
- **Audit logging** — можливість відстежити всі операції

Threats:

- 🔴 **Data leaks** — витік токенів, API ключів
- 🔴 **Unauthorized access** — доступ до чужих даних
- 🔴 **Man-in-the-middle** — перехоплення трафіку
- 🔴 **SQL injection** — атака через API
- 🔴 **XSS/CSRF** — атаки на frontend
- 🔴 **Secrets in logs** — випадкове логування токенів
- 🔴 **Secrets in git** — коміт .env файлів

## Рішення

Використовуємо **багаторівневу стратегію безпеки** (Defense in Depth):

1. **Infrastructure Security** — self-hosted, firewall, SSH keys
2. **Transport Security** — HTTPS/TLS для всіх з'єднань
3. **Authentication & Authorization** — JWT tokens, role-based access
4. **Data Encryption** — at rest та in transit
5. **Secrets Management** — environment variables, not in code
6. **Input Validation** — всі дані валідуються
7. **Security Headers** — CORS, CSP, HSTS
8. **Audit Logging** — всі критичні операції логуються
9. **Dependency Security** — регулярні оновлення, audit

## Обґрунтування

### 1. Infrastructure Security (Self-Hosted)

**Рішення:** Всі сервіси на власних серверах (див. ADR-017)

**Імплементація:**

```bash
# Firewall (UFW)
sudo ufw allow 22/tcp      # SSH (тільки з whitelist IP)
sudo ufw allow 80/tcp      # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw deny 5432/tcp     # PostgreSQL (тільки localhost)
sudo ufw deny 6379/tcp     # Redis (тільки localhost)
sudo ufw deny 3001/tcp     # Backend (через Nginx proxy)
sudo ufw enable

# SSH Keys Only (no passwords)
# /etc/ssh/sshd_config:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

**Переваги:**

- ✅ Повний контроль над інфраструктурою
- ✅ Zero third-party access
- ✅ Compliance з GDPR, SOC2 (якщо потрібно)

---

### 2. Transport Security (HTTPS/TLS)

**Рішення:** Всі з'єднання тільки через HTTPS

**Імплементація:**

#### A. Production (Let's Encrypt SSL)

```nginx
# /etc/nginx/sites-available/ai-workflow

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

    # ... rest of config
}
```

#### B. Internal connections (Backend ↔ Database)

```typescript
// src/database/prisma/schema.prisma
datasource
db
{
    provider = "postgresql"
    url = env("DATABASE_URL")
    // Example: postgresql://user:pass@localhost:5432/db?sslmode=require
}
```

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=require"
REDIS_TLS="true"
```

**Переваги:**

- ✅ Захист від MITM атак
- ✅ A+ rating на SSL Labs
- ✅ HSTS preload eligible

---

### 3. Authentication & Authorization

**Рішення:** JWT tokens для автентифікації, RBAC для авторизації

**Імплементація:**

#### A. JWT Authentication

```typescript
// src/core/auth/auth.module.ts
import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {AuthService} from './auth.service';
import {JwtStrategy} from './jwt.strategy';
import {AuthController} from './auth.controller';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET, // From .env, NOT hardcoded
            signOptions: {
                expiresIn: '1h',           // Short-lived tokens
                algorithm: 'HS256',
            },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {
}
```

```typescript
// src/core/auth/jwt.strategy.ts
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: any) {
        // Validate user still exists, not blacklisted, etc.
        return {
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        };
    }
}
```

```typescript
// src/core/guards/jwt-auth.guard.ts
import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
}
```

**Usage:**

```typescript
// src/api/tasks/tasks.controller.ts
import {Controller, Get, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from '@core/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)  // 🔒 Protected
export class TasksController {
    @Get()
    findAll() {
        // Only authenticated users can access
    }
}
```

#### B. Role-Based Access Control (RBAC)

```typescript
// src/core/guards/roles.guard.ts
import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {
    }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!requiredRoles) {
            return true; // No roles required
        }

        const {user} = context.switchToHttp().getRequest();
        return requiredRoles.some((role) => user.roles?.includes(role));
    }
}
```

```typescript
// src/core/decorators/roles.decorator.ts
import {SetMetadata} from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Usage:**

```typescript

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    @Post('users')
    @Roles('admin')  // 🔒 Only admins
    createUser() {
        // ...
    }
}
```

**Переваги:**

- ✅ Stateless authentication (JWT)
- ✅ Fine-grained access control (RBAC)
- ✅ Short-lived tokens (1h, потім refresh)

---

### 4. Data Encryption

#### A. Encryption at Rest (Database)

**Sensitive fields encryption:**

```typescript
// src/shared/utils/encryption.util.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
```

**Usage:**

```typescript
// src/integrations/github/github.service.ts
import {encrypt, decrypt} from '@shared/utils/encryption.util';

@Injectable()
export class GithubService {
    async saveToken(userId: string, token: string) {
        const encryptedToken = encrypt(token);

        await this.prisma.userToken.create({
            data: {
                userId,
                provider: 'github',
                token: encryptedToken, // Stored encrypted
            },
        });
    }

    async getToken(userId: string): Promise<string> {
        const record = await this.prisma.userToken.findFirst({
            where: {userId, provider: 'github'},
        });

        if (!record) throw new NotFoundException();

        return decrypt(record.token); // Decrypted when used
    }
}
```

**Що шифрувати:**

- ✅ GitHub tokens
- ✅ AI Provider API keys
- ✅ Refresh tokens
- ✅ Sensitive user data (якщо є)

**Що НЕ шифрувати:**

- ❌ IDs, timestamps (потрібні для queries)
- ❌ Public data (назви task, статуси)
- ❌ Hashed passwords (вже захищені bcrypt)

#### B. Encryption in Transit

Всі з'єднання через HTTPS/TLS (див. вище).

**Переваги:**

- ✅ Захист даних у БД (якщо хтось отримає дамп)
- ✅ Compliance з data protection regulations

---

### 5. Secrets Management

**Рішення:** Environment variables, НІКОЛИ не в коді

#### A. Environment Variables

```bash
# .env.production (НА СЕРВЕРІ, НЕ В GIT!)
NODE_ENV="production"

# Database
DATABASE_URL="postgresql://user:STRONG_PASSWORD@localhost:5432/ai_workflow"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="STRONG_PASSWORD"

# JWT
JWT_SECRET="generate-random-64-char-string-here"
JWT_REFRESH_SECRET="another-random-64-char-string"

# Encryption
ENCRYPTION_KEY="64-character-hex-string-for-aes-256"

# GitHub
GITHUB_TOKEN="ghp_XXXXXXXXXXXXXX"
GITHUB_WEBHOOK_SECRET="random-string"

# AI Provider
OPENAI_API_KEY="sk-XXXXXXXXXXXXXX"
ANTHROPIC_API_KEY="sk-ant-XXXXXXXXXXXXXX"

# Security
CORS_ORIGIN="https://yourdomain.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"  # 15 minutes
```

**Генерація secrets:**

```bash
# JWT Secret (64 chars)
openssl rand -hex 32

# Encryption Key (32 bytes = 64 hex chars)
openssl rand -hex 32

# Generic random string
openssl rand -base64 32
```

#### B. Validation

```typescript
// src/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

    // Database
    DATABASE_URL: Joi.string().required(),

    // Redis
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().required(),

    // JWT
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),

    // Encryption
    ENCRYPTION_KEY: Joi.string().length(64).required(), // 32 bytes hex

    // GitHub
    GITHUB_TOKEN: Joi.string().required(),
    GITHUB_WEBHOOK_SECRET: Joi.string().optional(),

    // AI Provider
    OPENAI_API_KEY: Joi.string().required(),
    ANTHROPIC_API_KEY: Joi.string().optional(),

    // Security
    CORS_ORIGIN: Joi.string().uri().required(),
    RATE_LIMIT_MAX: Joi.number().default(100),
    RATE_LIMIT_WINDOW: Joi.number().default(900000),
});
```

```typescript
// src/app.module.ts
import {ConfigModule} from '@nestjs/config';
import {envValidationSchema} from './config/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.production', '.env.development', '.env'],
            validationSchema: envValidationSchema,
            validationOptions: {
                abortEarly: false, // Show all errors
            },
        }),
        // ...
    ],
})
export class AppModule {
}
```

#### C. .gitignore

```gitignore
# Environment files (IMPORTANT!)
.env
.env.local
.env.development
.env.production
.env.test

# Never commit:
*.pem
*.key
*.crt
*.p12
secrets/
```

#### D. Git Hooks (prevent commits)

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for secrets in staged files
if git diff --cached --name-only | xargs grep -E "(API_KEY|SECRET|PASSWORD|TOKEN)" 2>/dev/null; then
  echo "⚠️  WARNING: Possible secrets found in staged files!"
  echo "Please remove secrets before committing."
  echo "Use environment variables instead."
  exit 1
fi

# Continue with lint-staged
pnpm lint-staged
```

**Переваги:**

- ✅ Secrets не потрапляють у git
- ✅ Різні secrets для різних environments
- ✅ Validation при старті застосунку

---

### 6. Input Validation & Sanitization

**Рішення:** Валідація всіх вхідних даних

```typescript
// src/api/tasks/dtos.ts
import {IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, MinLength} from 'class-validator';
import {Transform} from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(200)
    @Transform(({value}) => sanitizeHtml(value, {allowedTags: []})) // Strip HTML
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @Transform(({value}) => sanitizeHtml(value, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
        allowedAttributes: {a: ['href']},
    }))
    description?: string;

    @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**Prisma (parameterized queries) — захист від SQL Injection:**

```typescript
// ✅ SAFE (Prisma auto-escapes)
await prisma.task.findMany({
    where: {
        title: {contains: userInput}, // Automatically escaped
    },
});

// ❌ UNSAFE (raw SQL, but Prisma supports safe params)
await prisma.$queryRaw`
  SELECT * FROM tasks WHERE title LIKE ${`%${userInput}%`}
`; // Prisma automatically parameterizes
```

**Переваги:**

- ✅ Захист від SQL Injection (Prisma)
- ✅ Захист від XSS (sanitization)
- ✅ Data integrity (validation)

---

### 7. Security Headers

```typescript
// src/main.ts
import helmet from 'helmet';
import {NestFactory} from '@nestjs/core';
import {FastifyAdapter} from '@nestjs/platform-fastify';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, new FastifyAdapter());

    // Helmet (security headers)
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    }));

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN, // https://yourdomain.com
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Rate limiting
    app.use(
            rateLimit({
                windowMs: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 min
                max: process.env.RATE_LIMIT_MAX || 100, // 100 requests
                message: 'Too many requests, please try again later.',
            }),
    );

    await app.listen(3001, '0.0.0.0');
}
```

**Security Headers (автоматично через Helmet):**

- `X-Frame-Options: DENY` — захист від clickjacking
- `X-Content-Type-Options: nosniff` — захист від MIME sniffing
- `Strict-Transport-Security` — HSTS
- `Content-Security-Policy` — CSP
- `X-XSS-Protection: 1; mode=block` — XSS захист

**Переваги:**

- ✅ A+ rating на Security Headers
- ✅ Захист від CSRF, XSS, Clickjacking
- ✅ Rate limiting (захист від brute-force)

---

### 8. Audit Logging

**Рішення:** Логування всіх критичних операцій

```typescript
// src/core/interceptors/audit-log.interceptor.ts
import {Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger} from '@nestjs/common';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {PrismaService} from '@database/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    private readonly logger = new Logger('AuditLog');

    constructor(private readonly prisma: PrismaService) {
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const {method, url, user} = request;

        // Only log critical operations
        const criticalOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!criticalOperations.includes(method)) {
            return next.handle();
        }

        const startTime = Date.now();

        return next.handle().pipe(
                tap(async (response) => {
                    const duration = Date.now() - startTime;

                    // Log to database
                    await this.prisma.auditLog.create({
                        data: {
                            userId: user?.userId || 'anonymous',
                            action: `${method} ${url}`,
                            resource: this.extractResource(url),
                            ipAddress: request.ip,
                            userAgent: request.headers['user-agent'],
                            statusCode: 200,
                            duration,
                            timestamp: new Date(),
                        },
                    }).catch(err => {
                        this.logger.error('Failed to create audit log', err);
                    });

                    // Also log to Pino
                    this.logger.log({
                        type: 'audit',
                        userId: user?.userId,
                        action: `${method} ${url}`,
                        duration,
                    });
                }),
        );
    }

    private extractResource(url: string): string {
        // Extract resource from URL (e.g., /api/tasks/123 → tasks)
        const match = url.match(/\/api\/([^\/]+)/);
        return match ? match[1] : 'unknown';
    }
}
```

**Prisma Schema:**

```prisma
model AuditLog {
    id         String   @id @default(cuid())
    userId     String   
    action     String   
    resource   String   
    ipAddress  String?  
    userAgent  String?  
    statusCode Int      
    duration   Int      // milliseconds
    timestamp  DateTime @default(now())

    @@index([userId])
    @@index([resource])
    @@index([timestamp])
}
```

**Usage:**

```typescript
// src/app.module.ts
import {APP_INTERCEPTOR} from '@nestjs/core';
import {AuditLogInterceptor} from '@core/interceptors/audit-log.interceptor';

@Module({
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditLogInterceptor,
        },
    ],
})
export class AppModule {
}
```

**Переваги:**

- ✅ Audit trail для compliance
- ✅ Можливість розслідувати інциденти
- ✅ Виявлення підозрілої активності

---

### 9. Dependency Security

**Рішення:** Регулярні оновлення та security audits

#### A. npm audit

```bash
# Перевірка вразливостей
pnpm audit

# Автоматичне виправлення
pnpm audit --fix

# Детальний звіт
pnpm audit --json > audit-report.json
```

#### B. Dependabot (GitHub)

```yaml
# .github/dependabot.yml
version: 2
updates:
    -   package-ecosystem: "npm"
        directory: "/"
        schedule:
            interval: "weekly"
        open-pull-requests-limit: 10
        labels:
            - "dependencies"
            - "security"
```

#### C. CI/CD Security Check

```yaml
# .github/workflows/security.yml
name: Security

on: [ push, pull_request ]

jobs:
    audit:
        runs-on: ubuntu-latest
        steps:
            -   uses: actions/checkout@v4
            -   uses: pnpm/action-setup@v2
            -   uses: actions/setup-node@v4
                with:
                    node-version: '20'
                    cache: 'pnpm'

            -   name: Install dependencies
                run: pnpm install --frozen-lockfile

            -   name: Run audit
                run: pnpm audit --audit-level=high

            -   name: Check for secrets
                uses: trufflesecurity/trufflehog@main
                with:
                    path: ./
                    base: ${{ github.event.repository.default_branch }}
                    head: HEAD
```

**Переваги:**

- ✅ Автоматичне виявлення вразливостей
- ✅ Automatic updates через Dependabot
- ✅ CI/CD fails якщо є критичні вразливості

---

## Наслідки

### Позитивні:

- ✅ **Повний контроль** — всі дані на власних серверах
- ✅ **Zero third-party access** — ніхто не має доступу до даних
- ✅ **Defense in Depth** — багато рівнів захисту
- ✅ **Compliance ready** — готовність до GDPR, SOC2
- ✅ **Audit trail** — можливість розслідувати інциденти
- ✅ **Encryption** — дані захищені at rest та in transit

### Негативні:

- ⚠️ **Більше відповідальності** — ми відповідаємо за security
- ⚠️ **Потребує налаштування** — багато security конфігурацій
- ⚠️ **Performance overhead** — encryption додає latency (мінімальний)

### Нейтральні:

- ℹ️ Потребує регулярного оновлення dependencies
- ℹ️ Потребує моніторингу audit logs

## Security Checklist

### Development

- [ ] Secrets у `.env`, не в коді
- [ ] `.env` у `.gitignore`
- [ ] Pre-commit hook перевіряє secrets
- [ ] Input validation на всіх endpoints
- [ ] Sensitive data шифрується (encrypt())

### Deployment

- [ ] HTTPS/TLS налаштовано (Let's Encrypt)
- [ ] Firewall налаштовано (UFW)
- [ ] SSH тільки з ключами (no passwords)
- [ ] PostgreSQL тільки localhost
- [ ] Redis тільки localhost
- [ ] Strong passwords/secrets (64 chars)
- [ ] JWT_SECRET змінений з дефолтного
- [ ] ENCRYPTION_KEY згенерований

### Production

- [ ] Security headers (Helmet)
- [ ] CORS налаштовано правильно
- [ ] Rate limiting увімкнено
- [ ] Audit logging працює
- [ ] Backups налаштовані та зашифровані
- [ ] SSL certificate auto-renewal
- [ ] Fail2Ban налаштовано

### Monitoring

- [ ] Security audit щотижня (`pnpm audit`)
- [ ] Dependabot alerts увімкнено
- [ ] Audit logs переглядаються щомісяця
- [ ] Failed login attempts моніторяться

## Security Incident Response Plan

### 1. Виявлення інциденту

**Індикатори:**

- Suspicious audit log entries
- Failed authentication spikes
- Unusual API usage patterns
- Security audit alerts

### 2. Ізоляція

```bash
# Негайні дії:
# 1. Заблокувати підозрілі IP
sudo ufw deny from <suspicious-ip>

# 2. Змінити всі secrets
# Regenerate JWT_SECRET, ENCRYPTION_KEY
# Rotate all API keys

# 3. Invalidate всі JWT tokens (якщо потрібно)
# Додати в blacklist або змінити JWT_SECRET
```

### 3. Розслідування

```bash
# Перевірити audit logs
psql -d ai_workflow_prod -c "
  SELECT * FROM audit_logs 
  WHERE timestamp > NOW() - INTERVAL '24 hours'
  ORDER BY timestamp DESC;
"

# Перевірити system logs
sudo journalctl -u nginx -u pm2 --since "1 hour ago"

# Перевірити failed SSH attempts
sudo grep "Failed password" /var/log/auth.log
```

### 4. Recovery

- Restore з backup якщо потрібно
- Patch vulnerabilities
- Deploy fixes
- Notify affected users (якщо є)

### 5. Post-Mortem

- Документувати інцидент
- Визначити root cause
- Оновити security measures
- Update this ADR якщо потрібно

## Зв'язки

- Related to: [ADR-017: No Docker (Self-Hosted)](017-no-docker-native-development-production.md) — інфраструктура
- Related to: [ADR-004: Database (PostgreSQL + Prisma)](004-database-postgresql-prisma.md) — data security
- Related to: [ADR-006: Logging (Pino)](006-logging-pino.md) — audit logging

## Примітки

### Для MVP

Мінімальний security stack:

1. ✅ HTTPS/TLS (Let's Encrypt)
2. ✅ Environment variables для secrets
3. ✅ JWT authentication
4. ✅ Input validation (class-validator)
5. ✅ Firewall (UFW)
6. ✅ Security headers (Helmet)

Можна додати пізніше:

- ⏰ Encryption at rest (якщо дані стануть дуже чутливими)
- ⏰ Audit logging (якщо потрібен compliance)
- ⏰ RBAC (якщо з'являться різні ролі)

### Коли переглянути

- [ ] Якщо проєкт стане public/open-source
- [ ] Якщо з'являться платні користувачі
- [ ] Якщо потрібен compliance (GDPR, SOC2)
- [ ] Якщо виявлено security incident

## Автори

- @indigo-soft

## Дата

2024-01-20

## Теги

`security` `authentication` `encryption` `https` `jwt` `audit` `compliance` `self-hosted`
