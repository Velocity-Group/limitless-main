import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';
import { StreamRequestStatus } from '../constant';

export const StreamRequestSchema = new Schema({
  performerId: {
    type: ObjectId,
    index: true
  },
  userId: {
    type: ObjectId,
    index: true
  },
  startAt: String,
  timezone: String,
  totalTimeInSeconds: {
    type: Number,
    default: 0
  },
  totalTokenSpent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: StreamRequestStatus.PENDING
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
