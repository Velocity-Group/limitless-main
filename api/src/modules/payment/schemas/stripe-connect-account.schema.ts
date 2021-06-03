import { Schema } from 'mongoose';

export const StripeAccountSchema = new Schema({
  // user, model, etc...
  source: {
    type: String,
    index: true
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  accountId: {
    type: String
  },
  payoutsEnabled: {
    type: Boolean,
    default: false
  },
  detailsSubmitted: {
    type: Boolean,
    default: false
  },
  accountToken: {
    type: String
  },
  metaData: {
    type: Schema.Types.Mixed
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
