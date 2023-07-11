import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TranslationCreatePayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locale: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sourceId: string;
}
