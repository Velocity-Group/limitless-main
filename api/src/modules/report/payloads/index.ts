import { SearchRequest } from 'src/kernel/common';
import { ObjectId } from 'mongodb';
import {
  IsString, IsOptional, IsNotEmpty, IsIn
} from 'class-validator';
import { REPORT_TARGET } from '../constants';

export class ReportSearchRequestPayload extends SearchRequest {
  targetId?: string | ObjectId;

  target?: string;

  source?: string;

  sourceId?: string | ObjectId;

  performerId?: string | ObjectId;
}

export class ReportCreatePayload {
  @IsString()
  @IsOptional()
  @IsIn([
    REPORT_TARGET.FEED,
    REPORT_TARGET.COMMENT,
    REPORT_TARGET.GALLERY,
    REPORT_TARGET.VIDEO,
    REPORT_TARGET.GALLERY,
    REPORT_TARGET.PRODUCT
  ])
  target = REPORT_TARGET.FEED;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
