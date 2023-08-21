import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class MassMessageModel extends Document {
  text: string;

  senderId: ObjectId;

  status: string;

  isSchedule: Boolean;

  scheduledAt: Date;

  createdAt: Date;

  updatedAt: Date;
}
