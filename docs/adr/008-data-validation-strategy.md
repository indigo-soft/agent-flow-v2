import {Body, Post, Controller} from '@nestjs/common';
import {IsString, IsNotEmpty, IsArray, IsOptional} from 'class-validator';
// Уявімо, що ми винесли базовий інтерфейс у shared пакет згідно з ADR-009
import {ICreateDraft} from '@repo/shared/types/draft.types';

export class CreateDraftDto implements ICreateDraft {
@IsString()
@IsNotEmpty()
conversationText: string;

    @IsOptional()
    @IsArray()
    @IsString({each: true})
    artifacts?: string[];

}

@Controller('drafts')
export class DraftsController {
@Post()
async createDraft(@Body() createDraftDto: CreateDraftDto): Promise<void> {
// Логіка створення чернетки, використовуючи валідований createDraftDto
}
}
