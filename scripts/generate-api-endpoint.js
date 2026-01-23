#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const resourceName = process.argv[2];

if (!resourceName) {
    console.error('❌ Error: Resource name is required');
    console.log('Usage: pnpm generate:api <resource-name>');
    console.log('Example: pnpm generate:api users');
    process.exit(1);
}

const kebabName = resourceName.toLowerCase().replace(/\s+/g, '-');
const pascalName = kebabName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
const singularPascal = pascalName.endsWith('s')
    ? pascalName.slice(0, -1)
    : pascalName;

const apiDir = path.join(__dirname, '../src/api', kebabName);

if (fs.existsSync(apiDir)) {
    console.error(`❌ Error: API endpoint "${kebabName}" already exists`);
    process.exit(1);
}

fs.mkdirSync(apiDir, {recursive: true});

// Templates
const moduleTemplate = `import { Module } from '@nestjs/common';
import { ${pascalName}Controller } from './${kebabName}.controller';
import { ${pascalName}Service } from './${kebabName}.service';
import { DatabaseModule } from '@database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [${pascalName}Controller],
  providers: [${pascalName}Service],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;

const controllerTemplate = `import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ${pascalName}Service } from './${kebabName}.service';
import { Create${singularPascal}Dto, Update${singularPascal}Dto, ${singularPascal}FilterDto } from './dtos';

@Controller('${kebabName}')
export class ${pascalName}Controller {
  constructor(private readonly ${kebabName}Service: ${pascalName}Service) {}

  @Get()
  async findAll(@Query() filter: ${singularPascal}FilterDto) {
    return this.${kebabName}Service.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.${kebabName}Service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: Create${singularPascal}Dto) {
    return this.${kebabName}Service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Update${singularPascal}Dto) {
    return this.${kebabName}Service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.${kebabName}Service.remove(id);
  }
}
`;

const serviceTemplate = `import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Create${singularPascal}Dto, Update${singularPascal}Dto, ${singularPascal}FilterDto } from './dtos';

@Injectable()
export class ${pascalName}Service {
  private readonly logger = new Logger(${pascalName}Service.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ${singularPascal}FilterDto) {
    this.logger.log('Finding all ${kebabName}');
    
    // TODO: Implement filtering
    return this.prisma.${resourceName}.findMany({
      // where: { ... },
      // orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.${resourceName}.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(\`${singularPascal} with ID "\${id}" not found\`);
    }

    return item;
  }

  async create(dto: Create${singularPascal}Dto) {
    this.logger.log('Creating ${singularPascal.toLowerCase()}');
    
    return this.prisma.${resourceName}.create({
      data: dto,
    });
  }

  async update(id: string, dto: Update${singularPascal}Dto) {
    await this.findOne(id); // Check exists
    
    return this.prisma.${resourceName}.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check exists
    
    return this.prisma.${resourceName}.delete({
      where: { id },
    });
  }
}
`;

const dtosTemplate = `import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class Create${singularPascal}Dto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // TODO: Add more fields
}

export class Update${singularPascal}Dto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // TODO: Add more fields
}

export class ${singularPascal}FilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  // TODO: Add more filters
}
`;

const typesTemplate = `export interface ${singularPascal} {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // TODO: Add more fields
}
`;

const specTemplate = `import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ${pascalName}Service } from './${kebabName}.service';
import { PrismaService } from '@database/prisma.service';

describe('${pascalName}Service', () => {
  let service: ${pascalName}Service;
  let prisma: PrismaService;

  const mockPrisma = {
    ${resourceName}: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${pascalName}Service,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<${pascalName}Service>(${pascalName}Service);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of ${kebabName}', async () => {
      const expected = [{ id: '1', name: 'Test' }];
      mockPrisma.${resourceName}.findMany.mockResolvedValue(expected);

      const result = await service.findAll({});
      
      expect(result).toEqual(expected);
      expect(prisma.${resourceName}.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single item', async () => {
      const expected = { id: '1', name: 'Test' };
      mockPrisma.${resourceName}.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');
      
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.${resourceName}.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const dto = { name: 'Test' };
      const expected = { id: '1', ...dto };
      mockPrisma.${resourceName}.create.mockResolvedValue(expected);

      const result = await service.create(dto);
      
      expect(result).toEqual(expected);
      expect(prisma.${resourceName}.create).toHaveBeenCalledWith({ data: dto });
    });
  });
});
`;

const indexTemplate = `export * from './${kebabName}.module';
export * from './${kebabName}.controller';
export * from './${kebabName}.service';
export * from './dtos';
export * from './types';
`;

// Write files
const files = {
    [`${kebabName}.module.ts`]: moduleTemplate,
    [`${kebabName}.controller.ts`]: controllerTemplate,
    [`${kebabName}.service.ts`]: serviceTemplate,
    'dtos.ts': dtosTemplate,
    'types.ts': typesTemplate,
    [`${kebabName}.spec.ts`]: specTemplate,
    'index.ts': indexTemplate,
};

Object.entries(files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(apiDir, filename), content);
});

console.log(`
✅ API endpoint "${kebabName}" created successfully!

Files created:
  src/api/${kebabName}/
    ├── ${kebabName}.module.ts
    ├── ${kebabName}.controller.ts
    ├── ${kebabName}.service.ts
    ├── dtos.ts
    ├── types.ts
    ├── ${kebabName}.spec.ts
    └── index.ts

Next steps:
  1. Add Prisma model in src/database/prisma/schema.prisma:
     
     model ${singularPascal} {
       id          String   @id @default(cuid())
       name        String
       description String?
       createdAt   DateTime @default(now())
       updatedAt   DateTime @updatedAt
     }

  2. Run migration: pnpm prisma:migrate
  3. Implement business logic in ${kebabName}.service.ts
  4. Register module in src/app.module.ts
  5. Test endpoints: GET/POST/PATCH/DELETE /${kebabName}
`);
