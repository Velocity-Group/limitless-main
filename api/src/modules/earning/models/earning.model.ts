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

  paymentGateway: string;

  isToken: boolean;
}
