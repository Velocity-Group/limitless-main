import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsNumber,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SearchRequest } from 'src/kernel/common';

export class MassMessageSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  scheduledAt: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fromDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  toDate: Date;
}
