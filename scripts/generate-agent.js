#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const agentName = process.argv[2];

if (!agentName) {
    console.error('❌ Error: Agent name is required');
    console.log('Usage: pnpm generate:agent <agent-name>');
    console.log('Example: pnpm generate:agent notification');
    process.exit(1);
}

// Convert to a kebab-case
const kebabName = agentName.toLowerCase().replace(/\s+/g, '-');
// Convert to PascalCase
const pascalName = kebabName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const agentDir = path.join(__dirname, '../src/modules', `${kebabName}-agent`);

// Check if already exists
if (fs.existsSync(agentDir)) {
    console.error(`❌ Error: Agent "${kebabName}-agent" already exists`);
    process.exit(1);
}

// Create directory
fs.mkdirSync(agentDir, {recursive: true});

// Templates
const moduleTemplate = `import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ${pascalName}Service } from './${kebabName}.service';
import { ${pascalName}Processor } from './${kebabName}.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: '${kebabName}-events',
    }),
  ],
  providers: [${pascalName}Service, ${pascalName}Processor],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;

const serviceTemplate = `import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class ${pascalName}Service {
  private readonly logger = new Logger(${pascalName}Service.name);

  constructor(
    @InjectQueue('${kebabName}-events') private readonly queue: Queue,
  ) {}

  async process(data: any): Promise<any> {
    this.logger.log('Processing ${kebabName} request');
    
    // TODO: Implement business logic
    
    return { success: true };
  }
}
`;

const processorTemplate = `import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('${kebabName}-events')
export class ${pascalName}Processor {
  private readonly logger = new Logger(${pascalName}Processor.name);

  @Process('${kebabName}-task')
  async handleTask(job: Job) {
    this.logger.log(\`Processing job \${job.id}\`);
    
    // TODO: Implement task processing
    
    return { processed: true };
  }

  @OnQueueFailed()
  async handleFailed(job: Job, error: Error) {
    this.logger.error(\`Job \${job.id} failed: \${error.message}\`);
    // TODO: Handle failure (notify, retry, etc.)
  }
}
`;

const dtosTemplate = `import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Process${pascalName}Dto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class ${pascalName}ResponseDto {
  success: boolean;
  data?: any;
  error?: string;
}
`;

const typesTemplate = `export interface ${pascalName}Event {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface ${pascalName}Config {
  // TODO: Add configuration types
}
`;

const specTemplate = `import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { ${pascalName}Service } from './${kebabName}.service';

describe('${pascalName}Service', () => {
  let service: ${pascalName}Service;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${pascalName}Service,
        {
          provide: getQueueToken('${kebabName}-events'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<${pascalName}Service>(${pascalName}Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    it('should process data successfully', async () => {
      const result = await service.process({ test: 'data' });
      expect(result).toHaveProperty('success', true);
    });
  });
});
`;

const indexTemplate = `export * from './${kebabName}.module';
export * from './${kebabName}.service';
export * from './${kebabName}.processor';
export * from './dtos';
export * from './types';
`;

const readmeTemplate = `# ${pascalName} Agent

## Description

TODO: Describe what this agent does

## Responsibilities

- TODO: List responsibilities

## Events

### Consumed Events
- \`${kebabName}-task\` - TODO: describe

### Published Events
- TODO: List events this agent publishes

## Configuration

TODO: Describe configuration options

## Usage

\`\`\`typescript
import { ${pascalName}Service } from '@modules/${kebabName}-agent';

// TODO: Add usage examples
\`\`\`
`;

// Write files
const files = {
    [`${kebabName}.module.ts`]: moduleTemplate,
    [`${kebabName}.service.ts`]: serviceTemplate,
    [`${kebabName}.processor.ts`]: processorTemplate,
    'dtos.ts': dtosTemplate,
    'types.ts': typesTemplate,
    [`${kebabName}.spec.ts`]: specTemplate,
    'index.ts': indexTemplate,
    'README.md': readmeTemplate,
};

Object.entries(files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(agentDir, filename), content);
});

// Update modules barrel file if it exists
const modulesBarrelPath = path.join(__dirname, '../src/modules/modules.module.ts');
if (fs.existsSync(modulesBarrelPath)) {
    let modulesBarrel = fs.readFileSync(modulesBarrelPath, 'utf8');

    // Add import
    const importLine = `import { ${pascalName}Module } from './${kebabName}-agent';`;
    if (!modulesBarrel.includes(importLine)) {
        modulesBarrel = importLine + '\n' + modulesBarrel;
    }

    // Add to imports array
    const importArrayRegex = /imports:\s*\[([\s\S]*?)]/;
    const match = modulesBarrel.match(importArrayRegex);
    if (match && !match[1].includes(`${pascalName}Module`)) {
        const imports = match[1].trim();
        const newImports = imports ? `${imports},\n    ${pascalName}Module` : `${pascalName}Module`;
        modulesBarrel = modulesBarrel.replace(importArrayRegex, `imports: [\n    ${newImports}\n  ]`);
    }

    fs.writeFileSync(modulesBarrelPath, modulesBarrel);
    console.log('✅ Updated modules.module.ts');
}

console.log(`
✅ Agent "${kebabName}-agent" created successfully!

Files created:
  src/modules/${kebabName}-agent/
    ├── ${kebabName}.module.ts
    ├── ${kebabName}.service.ts
    ├── ${kebabName}.processor.ts
    ├── dtos.ts
    ├── types.ts
    ├── ${kebabName}.spec.ts
    ├── index.ts
    └── README.md

Next steps:
  1. Implement business logic in ${kebabName}.service.ts
  2. Implement queue processing in ${kebabName}.processor.ts
  3. Add DTO validation in dtos.ts
  4. Write tests in ${kebabName}.spec.ts
  5. Register module in src/app.module.ts if needed
`);
