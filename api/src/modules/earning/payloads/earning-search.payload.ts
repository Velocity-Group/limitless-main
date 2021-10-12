import { SearchRequest } from 'src/kernel/common';
import { ObjectId } from 'mongodb';
import {
  IsString,
  IsOptional,
  IsNotEmpty
} from 'class-validator';

export class EarningSearchRequestPayload extends SearchRequest {
  performerId?: string | ObjectId;

  transactionId?: string | ObjectId;

  sourceType?: string;

  type?: string;

  fromDate?: string | Date;

  toDate?: string | Date;

  paidAt?: string | Date;

  isPaid?: boolean;

  isToken?: any;
}

export class UpdateEarningStatusPayload {
  @IsString()
  @IsOptional()
  performerId: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string | Date;

  @IsString()
  @IsNotEmpty()
  toDate: string | Date;
}
