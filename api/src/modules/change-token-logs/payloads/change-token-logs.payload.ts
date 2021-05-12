import {
  IsString, IsNotEmpty
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeTokenLogsSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceId: string;
}
