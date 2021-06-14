import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class StripeProductModel extends Document {
  source: string;

  sourceId: ObjectId;

  name: string;

  description: string;

  productType: string;

  stripeProductId: string;

  metaData: any;

  createdAt: Date;

  updatedAt: Date;
}
