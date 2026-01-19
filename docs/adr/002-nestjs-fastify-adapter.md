# ADR-002: Використання Fastify як HTTP adapter для NestJS

## Статус

Прийнято

## Контекст

NestJS за замовчуванням використовує Express.js як HTTP сервер. Fastify є альтернативою, яка пропонує кращу performance.

Проєкт матиме:

- REST API для Dashboard (CRUD операції з завданнями, чернетками)
- Webhook endpoints (можливо у майбутньому для GitHub webhooks)
- Health check endpoints

Вимоги:

- Висока швидкість обробки HTTP запитів
- Низька latency
- Ефективна валідація запитів

## Рішення

Використовуємо **Fastify adapter** замість стандартного Express.js у NestJS.

## Обґрунтування

### Переваги Fastify:

1. **Performance**
    - В 2-3 рази швидший за Express.js у benchmarks
    - Оптимізований JSON serializer
    - Нижчий overhead

2. **Вбудована валідація**
    - Валідація через JSON Schema (швидше за class-validator для великих payload)
    - Автоматична серіалізація відповідей

3. **TypeScript підтримка**
    - Чудова типізація з коробки
    - Генерація типів з JSON Schema

4. **Сумісність з NestJS**
    - Офіційний `@nestjs/platform-fastify` пакет
    - Всі декоратори NestJS працюють
    - Всі модулі NestJS сумісні

### Недоліки:

- Дещо менша екосистема плагінів порівняно з Express
- Деякі Express middleware може не працювати (але є Fastify альтернативи)

### Чому не Express:

- Нижча performance (хоч для MVP це не критично)
- Старіший код base
- Повільніша валідація

## Наслідки

### Позитивні:

- Кращий response time для API
- Менше навантаження на сервер
- Готовність до масштабування

### Негативні:

- Якщо потрібен специфічний Express middleware — треба шукати Fastify альтернативу
- Трохи інший API для деяких low-level речей

### Нейтральні:

- Для розробників API залишається тим же (NestJS декоратори)

## Приклад коду

```typescript
// main.ts
import {NestFactory} from '@nestjs/core';
import {FastifyAdapter, NestFastifyApplication} from '@nestjs/platform-fastify';
import {AppModule} from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({logger: true})
    );

    await app.listen(3000, '0.0.0.0');
}

bootstrap();
```

## Примітки

- Використовуємо `@nestjs/platform-fastify` версії, сумісної з NestJS 10.x
- Документуємо будь-які Fastify-specific налаштування
