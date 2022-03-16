import {
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendGiftPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  conversationId: string;
}
