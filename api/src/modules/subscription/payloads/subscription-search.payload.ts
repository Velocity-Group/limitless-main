import { SearchRequest } from 'src/kernel/common';
import { ObjectId } from 'mongodb';

export class SubscriptionSearchRequestPayload extends SearchRequest {
  userIds?: string[] | ObjectId[];

  userId?: string | ObjectId;

  performerId?: string | ObjectId;

  transactionId?: string | ObjectId;

  subscriptionId?: string;

  subscriptionType?: string;

  paymentGateway?: string;

  status?: string;

  fromDate?: string;

  toDate?: string;

  createdAt?: Date;

  expiredAt?: Date;
}
