import { Schema } from 'mongoose';

export const AdminChangeTokenBalanceLogSchema = new Schema({
  source: {
    type: String,
    index: true
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  token: {
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now }
});
