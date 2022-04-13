import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class SubscriptionModel extends Document {
  subscriptionType: string;

  userId: ObjectId;

  performerId: ObjectId;

  subscriptionId: string;

  transactionId: ObjectId;

  paymentGateway: string;

  status: string;

  meta: any;

  startRecurringDate: Date;

  nextRecurringDate: Date;

  createdAt: Date;

  updatedAt: Date;

  expiredAt: Date;

  usedFreeSubscription: boolean;
}
