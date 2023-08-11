import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class ReferralModel extends Document {
  registerSource: string;

  registerId: ObjectId;

  referralSource: string;

  referralId: ObjectId;

  createdAt: Date;
}

export class ReferralCodeModel extends Document {
  source: string;

  sourceId: ObjectId;

  code: string;

  createdAt: Date;

  updatedAt: Date;
}
