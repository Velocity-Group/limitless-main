import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const StreamSchema = new Schema({
  performerId: { type: ObjectId, index: true },
  type: { type: String, index: true },
  sessionId: { type: String, index: true },
  isStreaming: { type: Number, default: 0 },
  userIds: [{ type: ObjectId, index: true }],
  streamIds: [{ type: String, index: true }],
  lastStreamingTime: Date,
  streamingTime: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
