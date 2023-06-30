import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class StreamRequest extends Document {
  performerId: ObjectId;

  userId: ObjectId;

  startAt: string;

  timezone: string;

  status: string;

  createdAt: Date;

  updatedAt: Date;

  totalTimeInSeconds: number;

  totalTokenSpent: number;
}
