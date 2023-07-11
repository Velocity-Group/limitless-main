import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class TranslationSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sourceIds?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  locales?: string;
}
