import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class StreamRequestPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startAt: string;
}

export class StreamRequestSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  performerId: string;
}
