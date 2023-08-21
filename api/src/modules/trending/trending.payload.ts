import {
  IsString, IsOptional
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class TrendingSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  source: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  time: string;
}
