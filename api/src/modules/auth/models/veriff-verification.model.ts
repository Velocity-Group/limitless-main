import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class VeriffVerificationModel extends Document {
  userSource: string;

  userId: ObjectId;

  sessionId: string;

  responseData: any;

  status: string;

  createAt: Date;

  updatedAt: Date;
}
