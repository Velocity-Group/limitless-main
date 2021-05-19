import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PerformerBlockUserModel extends Document {
  source: string;

  sourceId: ObjectId;

  target: string;

  targetId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
