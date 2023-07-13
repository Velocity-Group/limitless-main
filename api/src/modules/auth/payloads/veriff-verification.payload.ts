import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional
} from 'class-validator';

export class VeriffGeneratePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsNotEmpty()
  responseData: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;
}
