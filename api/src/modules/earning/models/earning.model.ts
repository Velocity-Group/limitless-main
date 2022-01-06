import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class EarningModel extends Document {
  transactionId: ObjectId;

  performerId: ObjectId;

  userId: ObjectId;

  sourceType: string;

  type: string;

  grossPrice: number;

  netPrice: number;

  siteCommission: number;

  isPaid: boolean;

  createdAt: Date;

  paidAt: Date;

  transactionStatus: string;

  isToken: boolean;
}
