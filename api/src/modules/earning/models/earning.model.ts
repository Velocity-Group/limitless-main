import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class EarningModel extends Document {
  transactionId: ObjectId;

  orderId: ObjectId;

  performerId: ObjectId;

  userId: ObjectId;

  agentId: ObjectId;

  sourceType: string;

  type: string;

  grossPrice: number;

  netPrice: number;

  referralPrice: number;

  agentPrice: number;

  siteCommission: number;

  referralCommission: number;

  agentCommission: number;

  isPaid: boolean;

  createdAt: Date;

  paidAt: Date;

  transactionStatus: string;

  isToken: boolean;
}
