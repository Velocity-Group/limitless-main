import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class StreamModel extends Document {
  performerId?: ObjectId;

  userIds?: ObjectId[];

  streamIds?: string[];

  type?: string;

  sessionId?: string;

  isStreaming?: number;

  streamingTime?: number;

  lastStreamingTime?: Date;

  isFree?: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}
