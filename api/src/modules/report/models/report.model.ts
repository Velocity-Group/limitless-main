import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class ReportModel extends Document {
  title: string;

  description: string;

  source: string;

  sourceId: ObjectId;

  performerId: ObjectId;

  target: string;

  targetId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
