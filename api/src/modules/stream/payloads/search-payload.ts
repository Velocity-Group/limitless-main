import {
  IsOptional,
  IsString
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SearchRequest } from 'src/kernel';

export class SearchStreamPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  fromDate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  toDate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  isFree: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  performerId: string;
}
