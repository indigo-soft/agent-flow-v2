#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const integrationName = process.argv[2];

if (!integrationName) {
    console.error('❌ Error: Integration name is required');
    console.log('Usage: pnpm generate:integration <integration-name>');
    console.log('Example: pnpm generate:integration slack');
    process.exit(1);
}

const kebabName = integrationName.toLowerCase().replace(/\s+/g, '-');
const pascalName = kebabName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const integrationDir = path.join(__dirname, '../src/components', kebabName);

if (fs.existsSync(integrationDir)) {
    console.error(`❌ Error: Component "${kebabName}" already exists in src/components/`);
    process.exit(1);
}

fs.mkdirSync(integrationDir, {recursive: true});

// Templates
const moduleTemplate = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ${pascalName}Service } from './${kebabName}.service';
import { ${kebabName}Config } from './${kebabName}.config';

@Module({
  imports: [ConfigModule],
  providers: [${pascalName}Service, ${kebabName}Config],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;

const serviceTemplate = `import { Injectable, Logger } from '@nestjs/common';
import { ${pascalName}Config } from './${kebabName}.config';

@Injectable()
export class ${pascalName}Service {
  private readonly logger = new Logger(${pascalName}Service.name);

  constructor(private readonly config: ${pascalName}Config) {}

  async initialize(): Promise<void> {
    this.logger.log('Initializing ${pascalName} integration');
    // TODO: Initialize client/SDK
  }

  async sendMessage(message: string): Promise<void> {
    this.logger.log('Sending message via ${pascalName}');
    // TODO: Implement
  }

  async fetchData(params: any): Promise<any> {
    this.logger.log('Fetching data from ${pascalName}');
    // TODO: Implement
    return {};
  }

  async disconnect(): Promise<void> {
    this.logger.log('Disconnecting from ${pascalName}');
    // TODO: Cleanup
  }
}
`;

const configTemplate = `import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ${pascalName}Config {
  constructor(private readonly configService: ConfigService) {}

  get apiKey(): string {
    return this.configService.get<string>('${kebabName.toUpperCase()}_API_KEY', '');
  }

  get apiUrl(): string {
    return this.configService.get<string>(
      '${kebabName.toUpperCase()}_API_URL',
      'https://api.${kebabName}.com'
    );
  }

  get timeout(): number {
    return this.configService.get<number>('${kebabName.toUpperCase()}_TIMEOUT', 5000);
  }

  // TODO: Add more configuration options
}
`;

const typesTemplate = `export interface ${pascalName}Message {
  text: string;
  channel?: string;
  metadata?: Record<string, any>;
}

export interface ${pascalName}Response {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ${pascalName}Config {
  apiKey: string;
  apiUrl: string;
  timeout: number;
}
`;

const dtosTemplate = `import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Send${pascalName}MessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  channel?: string;
}
`;

const specTemplate = `import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ${pascalName}Service } from './${kebabName}.service';
import { ${pascalName}Config } from './${kebabName}.config';

describe('${pascalName}Service', () => {
  let service: ${pascalName}Service;
  let config: ${pascalName}Config;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${pascalName}Service,
        ${pascalName}Config,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<${pascalName}Service>(${pascalName}Service);
    config = module.get<${pascalName}Config>(${pascalName}Config);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });
  });

  // TODO: Add more tests
});
`;

const indexTemplate = `export * from './${kebabName}.module';
export * from './${kebabName}.service';
export * from './${kebabName}.config';
export * from './types';
export * from './dtos';
`;

const readmeTemplate = `# ${pascalName} Integration

## Description

Integration with ${pascalName} API.

## Configuration

Add to \`.env\`:

\`\`\`env
${kebabName.toUpperCase()}_API_KEY="your-api-key"
${kebabName.toUpperCase()}_API_URL="https://api.${kebabName}.com"
${kebabName.toUpperCase()}_TIMEOUT="5000"
\`\`\`

## Usage

\`\`\`typescript
import { ${pascalName}Service } from '@components/${kebabName}';

constructor(private readonly ${kebabName}: ${pascalName}Service) {}

async someMethod() {
  await this.${kebabName}.sendMessage('Hello!');
}
\`\`\`

## API Reference

TODO: Add API documentation
`;

// Write files
const files = {
    [`${kebabName}.module.ts`]: moduleTemplate,
    [`${kebabName}.service.ts`]: serviceTemplate,
    [`${kebabName}.config.ts`]: configTemplate,
    'types.ts': typesTemplate,
    'dtos.ts': dtosTemplate,
    [`${kebabName}.spec.ts`]: specTemplate,
    'index.ts': indexTemplate,
    'README.md': readmeTemplate,
};

Object.entries(files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(integrationDir, filename), content);
});

console.log(`
✅ Component "${kebabName}" created successfully!

Files created:
  src/components/${kebabName}/
    ├── ${kebabName}.module.ts
    ├── ${kebabName}.service.ts
    ├── ${kebabName}.config.ts
    ├── types.ts
    ├── dtos.ts
    ├── ${kebabName}.spec.ts
    ├── index.ts
    └── README.md

Next steps:
  1. Add environment variables to .env:
     ${kebabName.toUpperCase()}_API_KEY="your-key"
     ${kebabName.toUpperCase()}_API_URL="https://api.${kebabName}.com"

  2. Implement integration logic in ${kebabName}.service.ts
  3. Add configuration in ${kebabName}.config.ts
  4. Register module in src/app.module.ts
  5. Write tests in ${kebabName}.spec.ts
`);
