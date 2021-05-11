import {
  IsNotEmpty,
  IsString,
  IsIn
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribePerformerPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsIn(['monthly', 'yearly', 'free'])
  type: string
}
