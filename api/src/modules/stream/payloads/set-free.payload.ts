import {
  IsString,
  IsNotEmpty,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetFreePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  streamId: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isFree: boolean;
}
