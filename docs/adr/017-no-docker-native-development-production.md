# ADR-017: Нативна розробка та deployment без Docker та зовнішніх сервісів

## Статус

Accepted

## Контекст

Проєкт потребує середовища для розробки та production deployment backend (NestJS) та frontend (Next.js).

Типові підходи:

- **Docker/Kubernetes** — контейнеризація для розробки та production
- **Зовнішні сервіси** — managed databases (Supabase, AWS RDS), managed Redis (Upstash)
- **Нативний deployment** — безпосередня установка на сервер
- **PaaS** — Vercel, Railway, Heroku

Вимоги:

- **Безпека даних** — конфіденційна інформація (плани, код, GitHub токени, AI промпти)
- **Повний контроль** — дані не повинні потрапляти до третіх сторін
- **Простота** — мінімальна складність для MVP
- **Поверхневе знання** технологій у команди
- **Self-hosted** — все на власних серверах

Обмеження:

- ❌ **Зовнішні managed сервіси ЗАБОРОНЕНІ** (Supabase, AWS RDS, Upstash, тощо)
- ❌ **Docker НЕБАЖАНИЙ** — додатковий прошарок складності
- ✅ **Self-hosted** — PostgreSQL, Redis, apps на власному сервері
- ✅ **Нативний deployment** — простота та прозорість

Розглянуті варіанти:

- **Full Docker** (розробка + production)
- **Hybrid Docker** (тільки інфраструктура)
- **Native все** (розробка + production)
- **Зовнішні сервіси** (managed DB, Redis)

## Рішення

Використовуємо **повністю нативний підхід** без Docker:

**Локальна розробка:**

- PostgreSQL — встановлений локально
- Redis — встановлений локально
- Backend — `pnpm dev` нативно
- Frontend — `pnpm dev` нативно

**Production:**

- PostgreSQL — встановлений на сервері (systemd service)
- Redis — встановлений на сервері (systemd service)
- Backend — PM2 process manager
- Frontend — PM2 або nginx static files
- Nginx — reverse proxy та SSL

**Ніяких:**

- ❌ Docker
- ❌ Kubernetes
- ❌ Зовнішніх managed сервісів
- ❌ Cloud databases
- ❌ PaaS платформ

## Обґрунтування

### Переваги нативного підходу:

#### 1. Безпека та приватність

**Проблема з зовнішніми сервісами:**

- 🔴 **Data leaks** — ваші дані на чужих серверах
- 🔴 **Access logs** — провайдер бачить всі запити
- 🔴 **Compliance** — GDPR, data residency issues
- 🔴 **Terms of Service** — провайдер може змінити умови
- 🔴 **Vendor lock-in** — важко мігрувати

**Ваш проєкт зберігає:**

- Плани розробки (конфіденційна бізнес-логіка)
- GitHub токени (доступ до приватних репо)
- AI промпти (можуть містити бізнес-логіку)
- Код з приватних репозиторіїв
- Коментарі до PR (можуть містити конфіденційну інформацію)

**Нативний підхід:**

- ✅ **Повний контроль** — дані тільки на ваших серверах
- ✅ **Zero third-party access** — ніхто крім вас не має доступу
- ✅ **Compliance** — ви контролюєте де зберігаються дані
- ✅ **No vendor lock-in** — ваші сервіси, ваші правила

#### 2. Простота (No Docker)

**Проблема з Docker:**

- Docker Desktop — додатковий софт для встановлення
- Крива навчання (images, containers, volumes, networks)
- File sync issues (Windows/Mac volume performance)
- Debugging складніший (attach до контейнера)
- Memory overhead (Docker Desktop 2-4GB RAM)
- Port mapping confusion
- Volume permissions issues (особливо на Linux)

**Нативний підхід:**

- ✅ Звичайні команди: `pnpm install`, `pnpm dev`
- ✅ Instant hot reload (без Docker layer)
- ✅ Прямий debugging (VS Code, Chrome DevTools)
- ✅ Немає Docker Desktop crashes
- ✅ Менше RAM споживання
- ✅ Простіше для новачків

**Benchmark розробки:**

```
Docker: 
  - Cold start: 30-60s
  - Hot reload: 2-5s (volume sync delay)
  - RAM:  +2-4GB (Docker Desktop)
  - File sync issues на Windows/Mac

Native:
  - Cold start: 10-15s
  - Hot reload: <1s (instant)
  - RAM: minimal overhead
  - Instant file changes
```

#### 3. Performance

**Production performance:**

```
Docker:
  - Container overhead: ~5-10% CPU
  - Network overlay: latency +1-5ms
  - Volume I/O: може бути повільніше
  
Native:
  - Direct hardware access
  - No container overhead
  - Native filesystem I/O
  - Прямі network connections
```

Для невеликого MVP різниця незначна, але нативний підхід завжди швидший.

#### 4. Прозорість та control

**Docker приховує:**

- Як саме працює networking
- Де зберігаються дані (volumes)
- Як логування налаштоване
- Залежності між контейнерами

**Native підхід:**

- ✅ Ви точно знаєте де все знаходиться
- ✅ Systemd logs доступні через `journalctl`
- ✅ Прямий доступ до конфігурацій
- ✅ Легше troubleshooting

#### 5. Cost

**Managed сервіси:**

- Supabase Free tier: обмеження, потім $25/місяць
- AWS RDS: $15-50+/місяць
- Upstash Free tier: обмеження, потім $10/місяць
- **Total: $50-100/місяць** + scaling costs

**Native на VPS:**

- VPS (4GB RAM, 2 CPU): $5-12/місяць (Hetzner, DigitalOcean)
- PostgreSQL: безкоштовно (self-hosted)
- Redis: безкоштовно (self-hosted)
- **Total: $5-12/місяць** fixed

**Економія:  $40-90/місяць**

### Недоліки нативного підходу:

- ⚠️ Треба вручну налаштовувати сервер
- ⚠️ Відповідальність за backups лежить на вас
- ⚠️ Треба моніторити здоров'я сервісів
- ⚠️ Scaling складніший (але для MVP не потрібен)
- ⚠️ Кожен розробник повинен встановити PostgreSQL та Redis локально

### Чому не інші варіанти:

**Docker (розробка + production):**

- ❌ Додатковий прошарок складності
- ❌ Крива навчання
- ❌ Проблеми з performance (volume sync)
- ❌ Debugging складніший
- ❌ Оverkill для MVP
- ✅ Production parity (але не критично для MVP)
- ✅ Ізоляція (але не потрібна для simple stack)

**Зовнішні managed сервіси:**

- ❌ **SECURITY RISK** — ваші конфіденційні дані на чужих серверах
- ❌ Data leaks можливі
- ❌ Vendor lock-in
- ❌ Costs зростають зі scaling
- ❌ Compliance issues
- ✅ Zero maintenance (але втрачаємо control)

**PaaS (Vercel, Railway, Heroku):**

- ❌ **SECURITY RISK** — код та дані на платформі
- ❌ Expensive при scaling
- ❌ Vendor lock-in
- ❌ Обмеження platform
- ✅ Simple deployment (але втрачаємо control)

## Наслідки

### Позитивні:

- ✅ **Повна безпека даних** — контроль над всім стеком
- ✅ **Zero data leaks** — дані не виходять за межі ваших серверів
- ✅ **Простота розробки** — instant hot reload, прямий debugging
- ✅ **Прозорість** — знаєте де все знаходиться
- ✅ **Cost-effective** — $5-12/місяць замість $50-100
- ✅ **No vendor lock-in** — повна свобода
- ✅ **Performance** — no container overhead
- ✅ **Простіше для новачків** — менше абстракцій

### Негативні:

- ⚠️ Кожен розробник повинен встановити PostgreSQL та Redis
- ⚠️ Треба вручну налаштовувати production сервер
- ⚠️ Відповідальність за backups та monitoring
- ⚠️ Версії PostgreSQL/Redis можуть відрізнятись між розробниками (але мінімізуємо через чітку специфікацію)
- ⚠️ Scaling потребує більше ручної роботи (але для MVP не актуально)

### Нейтральні:

- ℹ️ Команда повинна знати basics Linux administration (але це корисний skill)
- ℹ️ Production deployment займає більше часу на початку (але потім простіше)

## Setup Instructions

### Локальна розробка

#### 1. Встановити PostgreSQL

**macOS:**

```bash
# Homebrew
brew install postgresql@15

# Запустити як сервіс
brew services start postgresql@15

# Створити БД
createdb ai_workflow

# Створити користувача (опціонально)
psql postgres
CREATE USER dev WITH PASSWORD 'dev';
GRANT ALL PRIVILEGES ON DATABASE ai_workflow TO dev;
\q
```

**Ubuntu/Debian:**

```bash
# Встановити
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запустити
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Створити БД та користувача
sudo -u postgres psql
CREATE DATABASE ai_workflow;
CREATE USER dev WITH PASSWORD 'dev';
GRANT ALL PRIVILEGES ON DATABASE ai_workflow TO dev;
\q
```

**Windows:**

```bash
# Варіант 1: Native installer
# Завантажити з https://www.postgresql.org/download/windows/
# Запустити installer, вибрати PostgreSQL 15

# Варіант 2: WSL2 (рекомендовано)
# Встановити WSL2 з Ubuntu
wsl --install
# Потім використати Ubuntu інструкції вище
```

**Перевірка:**

```bash
psql -U dev -d ai_workflow -h localhost
# Повинно підключитись без помилок
```

#### 2. Встановити Redis

**macOS:**

```bash
# Homebrew
brew install redis

# Запустити як сервіс
brew services start redis

# Перевірка
redis-cli ping
# Відповідь: PONG
```

**Ubuntu/Debian:**

```bash
# Встановити
sudo apt install redis-server

# Запустити
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Перевірка
redis-cli ping
# Відповідь: PONG
```

**Windows:**

```bash
# Варіант 1: Memurai (Windows port Redis)
# https://www.memurai.com/

# Варіант 2: WSL2 (рекомендовано)
# Використати Ubuntu інструкції вище
```

#### 3. Налаштувати environment

**`.env. example`:**

```env
# Database
DATABASE_URL="postgresql://dev:dev@localhost:5432/ai_workflow"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# GitHub
GITHUB_TOKEN="ghp_your_token_here"

# AI Provider
OPENAI_API_KEY="sk-your_key_here"

# App
NODE_ENV="development"
PORT="3001"
```

**Setup:**

```bash
cp .env.example .env
# Відредагувати . env з вашими credentials
```

#### 4. Запустити проєкт

```bash
# Встановити залежності
pnpm install

# Запустити міграції
pnpm --filter backend prisma migrate dev

# Terminal 1: Backend
pnpm --filter backend dev

# Terminal 2: Frontend
pnpm --filter dashboard dev
```

**Перевірка:**

- Backend API: http://localhost:3001
- Frontend: http://localhost:3000

### Production Deployment

#### Вимоги:

- VPS або dedicated server (мінімум 2GB RAM, 20GB disk)
- Ubuntu 22.04 LTS (рекомендовано)
- Root або sudo доступ
- Доменне ім'я (опціонально, для SSL)

#### Рекомендовані VPS провайдери:

- **Hetzner** — €4.51/місяць (CX21:  2 vCPU, 4GB RAM) — найкраще співвідношення ціна/якість
- **DigitalOcean** — $12/місяць (Basic Droplet:  2 vCPU, 4GB RAM)
- **Vultr** — $12/місяць (High Performance:  2 vCPU, 4GB RAM)
- **OVH** — €6/місяць (VPS Value: 2 vCPU, 4GB RAM)

**Локація сервера:** Оберіть близько до ваших користувачів (Європа, США тощо)

---

#### Крок 1: Підготовка сервера

```bash
# SSH до сервера
ssh root@your-server-ip

# Оновити систему
apt update && apt upgrade -y

# Встановити базові пакети
apt install -y curl wget git build-essential

# Створити non-root користувача
adduser deploy
usermod -aG sudo deploy

# Налаштувати SSH для deploy user
su - deploy
mkdir -p ~/. ssh
chmod 700 ~/.ssh

# На вашій локальній машині:
# ssh-copy-id deploy@your-server-ip

# Тепер можна логінитись як deploy
exit
exit
ssh deploy@your-server-ip
```

#### Крок 2: Встановити Node.js

```bash
# Встановити Node.js 20 через nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Перезавантажити shell
source ~/.bashrc

# Встановити Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Встановити pnpm
npm install -g pnpm

# Перевірка
node -v  # v20.x. x
pnpm -v  # 8.x.x
```

#### Крок 3: Встановити PostgreSQL

```bash
# Встановити PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Запустити
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Створити БД та користувача для production
sudo -u postgres psql

-- У psql консолі:
CREATE DATABASE ai_workflow_prod;
CREATE USER ai_workflow WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE ai_workflow_prod TO ai_workflow;

-- Оновити для PostgreSQL 15 (нові permissions)
\c ai_workflow_prod
GRANT ALL ON SCHEMA public TO ai_workflow;

\q

# Налаштувати PostgreSQL для локальних з'єднань
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Знайти лінію: 
# local   all             all                                     peer
# Замінити на:
# local   all             all                                     md5

# Перезапустити PostgreSQL
sudo systemctl restart postgresql

# Перевірка
psql -U ai_workflow -d ai_workflow_prod -h localhost
# Ввести пароль
```

#### Крок 4: Встановити Redis

```bash
# Встановити Redis
sudo apt install -y redis-server

# Налаштувати Redis
sudo nano /etc/redis/redis.conf

# Знайти та змінити: 
# supervised no
# На: 
supervised systemd

# Bind тільки до localhost (безпека)
bind 127.0.0.1 ::1

# Встановити пароль (опціонально але рекомендовано)
# Знайти: 
# # requirepass foobared
# Розкоментувати та змінити:
requirepass YOUR_STRONG_REDIS_PASSWORD

# Зберегти та вийти (Ctrl+X, Y, Enter)

# Перезапустити Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Перевірка
redis-cli
AUTH YOUR_STRONG_REDIS_PASSWORD
ping
# Відповідь: PONG
quit
```

#### Крок 5: Встановити PM2 (Process Manager)

```bash
# Встановити PM2 globally
npm install -g pm2

# Налаштувати PM2 для автозапуску
pm2 startup systemd
# Виконати команду яку PM2 виведе

# Перевірка
pm2 list
```

#### Крок 6: Клонувати та налаштувати проєкт

```bash
# Створити директорію для проєкту
mkdir -p ~/apps
cd ~/apps

# Клонувати проєкт (використати SSH або HTTPS з токеном)
git clone https://github.com/your-org/ai-workflow-assistant.git
cd ai-workflow-assistant

# Або якщо приватний репо:
git clone https://<token>@github.com/your-org/ai-workflow-assistant.git

# Встановити залежності
pnpm install --frozen-lockfile

# Створити .env для production
cp .env.example .env. production

# Редагувати .env. production
nano .env.production
```

**`.env.production`:**

```env
# Environment
NODE_ENV="production"

# Database
DATABASE_URL="postgresql://ai_workflow:STRONG_PASSWORD_HERE@localhost:5432/ai_workflow_prod"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="YOUR_STRONG_REDIS_PASSWORD"

# GitHub
GITHUB_TOKEN="ghp_your_production_token"

# AI Provider
OPENAI_API_KEY="sk-your_production_key"

# App
PORT="3001"
FRONTEND_URL="http://your-domain.com"

# Security
JWT_SECRET="generate_random_string_here"
```

**Генерація secrets:**

```bash
# Генерувати random strings для passwords
openssl rand -base64 32
```

```bash
# Запустити міграції
pnpm --filter backend prisma migrate deploy

# Build проєкту
pnpm build
```

#### Крок 7: Налаштувати PM2

**`ecosystem.config.js` (створити у root):**

```javascript
module.exports = {
    apps: [
        {
            name: 'backend',
            script: 'apps/backend/dist/main.js',
            cwd: '/home/deploy/apps/ai-workflow-assistant',
            instances: 1,
            exec_mode: 'cluster',
            env_file: '.env.production',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            error_file: '/home/deploy/logs/backend-error.log',
            out_file: '/home/deploy/logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm: ss Z',
            merge_logs: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '500M',
        },
        {
            name: 'frontend',
            script: 'node_modules/next/dist/bin/next',
            args: 'start -p 3000',
            cwd: '/home/deploy/apps/ai-workflow-assistant/apps/dashboard',
            instances: 1,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: '/home/deploy/logs/frontend-error.log',
            out_file: '/home/deploy/logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '300M',
        },
    ],
};
```

**Запустити:**

```bash
# Створити директорію для логів
mkdir -p ~/logs

# Запустити PM2
pm2 start ecosystem. config.js

# Перевірити статус
pm2 status

# Подивитись логи
pm2 logs

# Зберегти PM2 process list (для автозапуску після reboot)
pm2 save

# Перевірка
curl http://localhost:3001  # Backend
curl http://localhost:3000  # Frontend
```

#### Крок 8: Встановити Nginx (Reverse Proxy + SSL)

```bash
# Встановити Nginx
sudo apt install -y nginx

# Зупинити Apache якщо встановлений (конфлікт портів)
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl disable apache2 2>/dev/null || true

# Створити конфігурацію Nginx
sudo nano /etc/nginx/sites-available/ai-workflow
```

**Nginx конфігурація:**

```nginx
# /etc/nginx/sites-available/ai-workflow

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# Backend upstream
upstream backend {
    server 127.0.0.1:3001;
}

# Frontend upstream
upstream frontend {
    server 127.0.0.1:3000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (буде налаштовано пізніше через Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey. pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:! MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/ai-workflow-access.log;
    error_log /var/log/nginx/ai-workflow-error.log;

    # Max upload size
    client_max_body_size 10M;

    # API endpoints (backend)
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend (Next.js)
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (якщо є)
    location /_next/static {
        proxy_pass http://frontend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

**Активувати конфігурацію:**

```bash
# Створити symlink
sudo ln -s /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/

# Видалити default конфігурацію
sudo rm /etc/nginx/sites-enabled/default

# Перевірити конфігурацію
sudo nginx -t

# Якщо OK — перезапустити Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Крок 9: Налаштувати SSL (Let's Encrypt)

```bash
# Встановити Certbot
sudo apt install -y certbot python3-certbot-nginx

# Отримати SSL сертифікат
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Слідувати інструкціям Certbot: 
# 1. Ввести email
# 2. Agree to Terms
# 3. Обрати "2:  Redirect" (HTTP → HTTPS)

# Certbot автоматично оновить Nginx конфігурацію

# Перевірити auto-renewal
sudo certbot renew --dry-run

# Certbot автоматично створить cron job для renewal
```

**Якщо немає доменного імені:**

```bash
# Використати HTTP (без SSL)
# Відредагувати /etc/nginx/sites-available/ai-workflow
# Видалити SSL секцію, залишити тільки: 

server {
    listen 80;
    server_name your-server-ip;
    
    # ...  решта конфігурації
}
```

#### Крок 10: Налаштувати Firewall

```bash
# Встановити UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Дозволити SSH (ВАЖЛИВО!  Інакше втратите доступ)
sudo ufw allow OpenSSH
# Або конкретний порт:
sudo ufw allow 22/tcp

# Дозволити HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Закрити прямий доступ до backend (тільки через Nginx)
# Порт 3001 та 3000 не відкриваємо

# Увімкнути firewall
sudo ufw enable

# Перевірити статус
sudo ufw status verbose
```

#### Крок 11: Налаштувати автоматичні backups

**Створити backup script:**

```bash
nano ~/backup. sh
```

**`backup.sh`:**

```bash
#!/bin/bash

# Конфігурація
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ai_workflow_prod"
DB_USER="ai_workflow"
RETENTION_DAYS=7

# Створити директорію для backups
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
PGPASSWORD="STRONG_PASSWORD_HERE" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql. gz

# Backup Redis (якщо використовується для persistent data)
redis-cli -a "YOUR_STRONG_REDIS_PASSWORD" --rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Backup . env файлів та конфігурацій
tar -czf $BACKUP_DIR/config_backup_$DATE.tar. gz \
    /home/deploy/apps/ai-workflow-assistant/. env. production \
    /home/deploy/apps/ai-workflow-assistant/ecosystem.config.js

# Видалити старі backups (старше RETENTION_DAYS)
find $BACKUP_DIR -name "*. gz" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed:  $DATE"
```

**Зробити executable:**

```bash
chmod +x ~/backup.sh
```

**Налаштувати cron (щоденні backups о 2: 00 AM):**

```bash
crontab -e

# Додати лінію:
0 2 * * * /home/deploy/backup.sh >> /home/deploy/logs/backup.log 2>&1
```

**Тестовий запуск:**

```bash
~/backup.sh
ls -lh ~/backups/
```

#### Крок 12: Моніторинг та логи

**PM2 monitoring:**

```bash
# Статус всіх processes
pm2 status

# Детальна інформація
pm2 show backend
pm2 show frontend

# Логи (real-time)
pm2 logs

# Логи конкретного процесу
pm2 logs backend
pm2 logs frontend

# CPU/Memory monitoring
pm2 monit
```

**Systemd logs:**

```bash
# PostgreSQL logs
sudo journalctl -u postgresql -f

# Redis logs
sudo journalctl -u redis-server -f

# Nginx logs
sudo tail -f /var/log/nginx/ai-workflow-access.log
sudo tail -f /var/log/nginx/ai-workflow-error. log
```

**System resources:**

```bash
# CPU/Memory/Disk
htop

# Disk usage
df -h

# Specific directory size
du -sh ~/apps/ai-workflow-assistant
```

#### Крок 13: Deployment workflow (оновлення)

**Створити deployment script:**

```bash
nano ~/deploy.sh
```

**`deploy.sh`:**

```bash
#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting deployment..."

cd /home/deploy/apps/ai-workflow-assistant

# Backup перед deployment
echo "📦 Creating backup..."
~/backup.sh

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run migrations
echo "🗄️  Running database migrations..."
pnpm --filter backend prisma migrate deploy

# Build apps
echo "🏗️  Building applications..."
pnpm build

# Restart PM2 processes
echo "🔄 Restarting applications..."
pm2 restart ecosystem.config.js

# Check status
echo "✅ Deployment completed!"
pm2 status
```

**Зробити executable:**

```bash
chmod +x ~/deploy.sh
```

**Використання:**

```bash
# З локальної машини push до git
git push origin main

# На сервері
ssh deploy@your-server-ip
~/deploy.sh
```

---

### Моніторинг та maintenance

#### Щоденні задачі:

```bash
# Перевірити статус сервісів
pm2 status
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx

# Перевірити логи на помилки
pm2 logs --lines 100 --err
```

#### Щотижневі задачі:

```bash
# Оновити систему
sudo apt update && sudo apt upgrade -y

# Перевірити disk usage
df -h
du -sh ~/apps/ai-workflow-assistant
du -sh ~/backups

# Очистити старі логи PM2
pm2 flush
```

#### Щомісячні задачі:

```bash
# Оновити Node.js (якщо є нова LTS версія)
nvm install 20
nvm use 20
npm install -g pnpm pm2

# Vacuum PostgreSQL (оптимізація)
sudo -u postgres psql ai_workflow_prod -c "VACUUM ANALYZE;"

# Перевірити SSL certificate renewal
sudo certbot certificates
```

---

## Security Best Practices

### 1. SSH Security

```bash
# Заборонити root login
sudo nano /etc/ssh/sshd_config

# Змінити: 
PermitRootLogin no
PasswordAuthentication no  # Тільки SSH keys
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. Автоматичні security updates

```bash
# Встановити unattended-upgrades
sudo apt install -y unattended-upgrades

# Налаштувати
sudo dpkg-reconfigure -plow unattended-upgrades
# Вибрати "Yes"
```

### 3. Fail2Ban (захист від brute-force)

```bash
# Встановити
sudo apt install -y fail2ban

# Налаштувати
sudo nano /etc/fail2ban/jail. local
```

**`/etc/fail2ban/jail. local`:**

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/ai-workflow-error.log
maxretry = 5
bantime = 600
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Перевірити статус
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 4. PostgreSQL security

**`/etc/postgresql/15/main/pg_hba. conf`:**

```
# Тільки локальні з'єднання
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Заборонити remote connections
```

### 5. Environment variables security

```bash
# .env. production повинен мати strict permissions
chmod 600 ~/apps/ai-workflow-assistant/.env.production

# Тільки deploy user може читати
ls -la ~/apps/ai-workflow-assistant/. env.production
# -rw------- 1 deploy deploy
```

---

## Troubleshooting

### Backend не запускається

```bash
# Перевірити PM2 logs
pm2 logs backend --lines 100

# Перевірити . env файл
cat ~/apps/ai-workflow-assistant/.env. production

# Перевірити PostgreSQL з'єднання
psql -U ai_workflow -d ai_workflow_prod -h localhost

# Перевірити Redis з'єднання
redis-cli -a "PASSWORD" ping

# Перезапустити
pm2 restart backend
```

### Frontend показує 502 Bad Gateway

```bash
# Перевірити PM2 статус
pm2 status

# Перевірити Nginx error logs
sudo tail -f /var/log/nginx/ai-workflow-error.log

# Перевірити чи frontend запущений
curl http://localhost:3000

# Restart
pm2 restart frontend
sudo systemctl restart nginx
```

### PostgreSQL out of disk space

```bash
# Перевірити disk usage
df -h

# Очистити старі backups
rm ~/backups/*_old_*.gz

# Vacuum БД
sudo -u postgres psql ai_workflow_prod -c "VACUUM FULL;"
```

### SSL certificate не оновлюється

```bash
# Manually renew
sudo certbot renew --force-renewal

# Перевірити cron job
sudo systemctl status certbot.timer

# Restart Nginx
sudo systemctl restart nginx
```

---

## Метрики успіху

- ✅ Локальна розробка:  cold start < 15s, hot reload < 1s
- ✅ Production uptime > 99%
- ✅ Deployment час < 5 хвилин
- ✅ Backups виконуються щодня автоматично
- ✅ Zero data leaks (всі дані на власних серверах)
- ✅ Monthly cost < $15

---

## Порівняння підходів

| Критерій                | Native (наш вибір)    | Docker                        | Managed Services       |
|-------------------------|-----------------------|-------------------------------|------------------------|
| **Безпека даних**       | ✅ Повний контроль     | ✅ Контроль (якщо self-hosted) | ❌ Дані у третіх сторін |
| **Простота розробки**   | ✅ Instant reload      | ⚠️ Повільний reload           | ✅ Zero setup           |
| **Простота deployment** | ⚠️ Ручне налаштування | ✅ Просто (docker-compose up)  | ✅ Один клік            |
| **Performance**         | ✅ Native швидкість    | ⚠️ Container overhead         | ✅ Оптимізовано         |
| **Cost (monthly)**      | ✅ $5-15               | ✅ $5-15 (self-hosted)         | ❌ $50-100+             |
| **Крива навчання**      | ⚠️ Linux basics       | ⚠️ Docker + Linux             | ✅ Мінімальна           |
| **Складність**          | ⚠️ Середня            | ⚠️ Висока                     | ✅ Низька               |
| **Vendor lock-in**      | ✅ Немає               | ✅ Немає                       | ❌ Є                    |
| **Scaling**             | ⚠️ Ручний             | ✅ Легкий (orchestration)      | ✅ Автоматичний         |

**Для MVP з вимогами безпеки: Native підхід оптимальний** ✅

---

## Альтернативи для майбутнього

Переглянемо це рішення якщо:

- [ ] Команда виросла до 10+ розробників
- [ ] Потрібен horizontal scaling (multiple servers)
- [ ] Deployment частота > 5 разів на день
- [ ] Складність інфраструктури зросла значно

У такому випадку розглянемо:

- **Kubernetes** (self-hosted) — якщо потрібен складний orchestration
- **CI/CD з Docker** — для автоматизації deployment
- **Infrastructure as Code** (Terraform, Ansible)

Але для **MVP з 1-2 розробниками та вимогами безпеки** — нативний підхід найкращий.

---

## Зв'язки

- Related to: [ADR-001: Backend Framework (NestJS)](001-backend-framework-nestjs.md)
- Related to: [ADR-004: Database (PostgreSQL + Prisma)](004-database-postgresql-prisma.md)
- Related to: [ADR-003: Queue System (BullMQ + Redis)](003-queue-system-bullmq. md)
- Related to: [ADR-007: Frontend Framework (Next.js)](007-frontend-framework-nextjs-react.md)

---

## Примітки

### Чому саме цей підхід для вашого проєкту?

1. **Безпека** — проєкт обробляє конфіденційні дані (код, GitHub токени, бізнес-логіку)
2. **MVP** — простота важливіша за масштабованість на початку
3. **Поверхневе знання** — Native простіше зрозуміти ніж Docker
4. **Cost** — $10/місяць замість $100/місяць
5. **Control** — повна прозорість та контроль

### Production checklist

Перед запуском у production переконайтесь:

- [ ] SSL сертифікат налаштований
- [ ] Firewall налаштований (UFW)
- [ ] SSH доступ тільки через keys
- [ ] PostgreSQL має сильний пароль
- [ ] Redis має пароль
- [ ] . env файли мають permissions 600
- [ ] Backups налаштовані та перевірені
- [ ] Fail2Ban активний
- [ ] Логи ротуються (logrotate)
- [ ] PM2 автозапуск налаштований
- [ ] Nginx rate limiting налаштований
- [ ] Environment variables не комітяться у git

---

## Автори

- @indigo-soft

## Дата

2024-01-20

## Теги

`security` `self-hosted` `no-docker` `native` `production` `deployment` `privacy`
