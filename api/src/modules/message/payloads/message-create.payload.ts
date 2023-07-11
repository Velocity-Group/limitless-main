import {
  IsString, IsOptional, ValidateIf, IsNotEmpty, IsBoolean, IsNumber, IsArray
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MESSAGE_TYPE } from '../constants';

export class MessageCreatePayload {
  @ApiProperty()
  @ValidateIf((o) => o.type === MESSAGE_TYPE.TEXT)
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isSale: boolean;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  fileIds: string[];
}

export class MassMessagesToSubscribersCreatePayload {
  @ApiProperty()
  @ValidateIf((o) => o.type === MESSAGE_TYPE.TEXT)
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subscriptionType: string;
}
