import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class SubscribePerformerPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performerId: string | ObjectId;

  @ApiProperty()
  @IsNotEmpty()
  @IsIn(['monthly', 'yearly', 'free'])
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentGateway: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  stripeCardId: string;
}
