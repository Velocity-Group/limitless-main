import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTipsPayload {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  token: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  conversationId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  streamType: string;
}
