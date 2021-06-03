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
import { ObjectId } from 'mongodb';
import { STATUSES, SOURCE_TYPE } from '../constants';

export class PayoutRequestCreatePayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([SOURCE_TYPE.PERFORMER, SOURCE_TYPE.AGENT])
  source: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  requestTokens: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  requestNote: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentAccountType?: string;
}

export class PayoutRequestPerformerUpdatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  requestNote: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  requestTokens: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentAccountType?: string;
}

export class PayoutRequestUpdatePayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([STATUSES.PENDING, STATUSES.REJECTED, STATUSES.DONE, STATUSES.APPROVED])
  status: string;

  @ApiProperty()
  @IsOptional()
  adminNote: string;
}

export class PayoutRequestSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  sourceId: string | ObjectId;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentAccountType?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fromDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  toDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  source: string;
}
