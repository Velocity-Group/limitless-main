import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TranslationUpdatePayload {
  @ApiProperty()
  @IsOptional()
  @IsString()
  locale: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  source: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sourceId: string;
}
