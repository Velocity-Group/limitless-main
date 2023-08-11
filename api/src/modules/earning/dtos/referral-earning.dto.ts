import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ReferralEarningDto {
  _id: ObjectId;

  registerSource: string;

  registerId: ObjectId;

  registerInfo?: any;

  referralSource: string;

  referralId: ObjectId;

  referralInfo?: any;

  earningId: ObjectId;

  type: string;

  grossPrice: number;

  netPrice: number;

  referralCommission: number;

  isPaid: boolean;

  paidAt: Date;

  createdAt: Date;

  isToken: boolean;

  transactionStatus: string;

  constructor(data: Partial<ReferralEarningDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'registerSource',
        'registerId',
        'registerInfo',
        'referralSource',
        'referralId',
        'referralInfo',
        'earningId',
        'type',
        'grossPrice',
        'netPrice',
        'referralCommission',
        'isPaid',
        'paidAt',
        'createdAt',
        'isToken',
        'transactionStatus'
      ])
    );
  }
}

export interface IReferralEarningStatResponse {
  totalRegisters: number;
  totalSales: number;
  totalNetPrice: number;
}
