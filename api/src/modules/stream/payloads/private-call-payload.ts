import {
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PrivateCallRequestPayload {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userNote: string;
}
