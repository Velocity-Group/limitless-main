import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class StripeConnectAccountModel extends Document {
  source: string;

  sourceId: ObjectId;

  accountToken: string;

  metaData: any;

  createdAt: Date;

  updatedAt: Date;
}
