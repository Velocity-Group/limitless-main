import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SOURCE_TYPE } from '../constants';

export const payoutRequestSchema = new Schema({
  source: {
    index: true,
    type: String,
    enum: [SOURCE_TYPE.PERFORMER, SOURCE_TYPE.AGENT],
    default: SOURCE_TYPE.PERFORMER
  },
  sourceId: {
    index: true,
    type: ObjectId
  },
  paymentAccountType: {
    type: String,
    index: true,
    default: 'stripe'
  },
  requestNote: {
    type: String
  },
  adminNote: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'done'],
    default: 'pending',
    index: true
  },
  requestTokens: {
    type: Number,
    default: 0
  },
  tokenConversionRate: {
    type: Number,
    default: 1
  },
  payoutId: {
    type: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
