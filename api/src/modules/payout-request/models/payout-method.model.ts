import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PayoutMethodModel extends Document {
  source: string;

  sourceId: ObjectId;

  key: string;

  value: any;

  createdAt:Date;

  updatedAt: Date;
}
