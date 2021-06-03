import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class StripeConnectAccountModel extends Document {
  source: string;

  sourceId: ObjectId;

  accountToken: string;

  accountId: string;

  metaData: any;

  payoutsEnabled: boolean;

  detailsSubmitted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
