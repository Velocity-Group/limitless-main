import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PayoutRequestModel extends Document {
  source: string;

  sourceId: ObjectId;

  paymentAccountType?: string;

  requestNote?: string;

  adminNote?: string

  status?: string;

  requestTokens?: number;

  tokenConversionRate?: number;

  payoutId?: string;

  createdAt: Date;

  updatedAt: Date;
}
