import { Schema } from 'mongoose';

export const StripeProductSchema = new Schema({
  // model, etc...
  source: {
    type: String,
    index: true
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  productType: {
    type: String,
    enum: ['free_subscription', 'monthly_subscription', 'yearly_subscription']
  },
  stripeProductId: {
    type: String
  },
  stripePriceId: {
    type: String
  },
  metaData: {
    type: Schema.Types.Mixed
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
