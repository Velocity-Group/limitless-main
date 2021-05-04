import { pick } from 'lodash';
import { ObjectId } from 'mongodb';

export class PayoutRequestDto {
  _id: any;

  source: string;

  sourceId: ObjectId;

  sourceInfo: any;

  paymentAccountInfo?: any;

  paymentAccountType: string;

  requestNote: string;

  adminNote?: string;

  status: string;

  requestTokens: number;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<PayoutRequestDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'source',
        'sourceId',
        'sourceInfo',
        'paymentAccountType',
        'paymentAccountInfo',
        'requestNote',
        'adminNote',
        'status',
        'sourceType',
        'requestTokens',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}
