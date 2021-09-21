import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class EarningDto {
  _id: ObjectId;

  userId: ObjectId;

  userInfo?: any;

  transactionId: ObjectId;

  transactionInfo?: any;

  performerId: ObjectId;

  performerInfo?: any;

  sourceType: string;

  type: string;

  grossPrice: number;

  netPrice: number;

  referralPrice: number;

  siteCommission: number;

  referralCommission: number;

  isPaid?: boolean;

  createdAt: Date;

  updatedAt: Date;

  paidAt: Date;

  transactionStatus?: string;

  isToken?: boolean;

  constructor(data?: Partial<EarningDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'userId',
        'userInfo',
        'transactionId',
        'transactionInfo',
        'performerId',
        'performerInfo',
        'sourceType',
        'type',
        'grossPrice',
        'netPrice',
        'referralPrice',
        'isPaid',
        'siteCommission',
        'referralCommission',
        'createdAt',
        'updatedAt',
        'paidAt',
        'transactionStatus',
        'isToken'
      ])
    );
  }
}

export interface IEarningStatResponse {
  totalGrossPrice: number;
  totalNetPrice: number;
  totalSiteCommission: number;
  totalReferralCommission?: number;
  totalAgentCommission?: number;
}
