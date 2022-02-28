import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartStreamPayload {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isFree: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
