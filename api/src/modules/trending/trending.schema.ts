import { Schema } from 'mongoose';

export const TrendingSchema = new Schema({
  source: {
    type: String,
    index: true
  },
  sourceId: {
    type: Schema.Types.ObjectId
  },
  performerId: {
    type: Schema.Types.ObjectId
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  totalBookmarks: {
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
