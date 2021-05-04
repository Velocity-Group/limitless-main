import { Schema } from 'mongoose';
import { STATUS } from 'src/kernel/constants';

export const FeedSchema = new Schema({
  type: {
    type: String,
    index: true
  },
  fromSourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  fromSource: {
    type: String,
    index: true
  },
  title: { type: String },
  text: { type: String },
  fileIds: [{
    type: Schema.Types.ObjectId,
    _id: false
  }],
  pollIds: [{
    type: Schema.Types.ObjectId,
    _id: false
  }],
  pollExpiredAt: {
    type: Date,
    default: Date.now
  },
  orientation: {
    type: String,
    index: true
  },
  teaserId: {
    type: Schema.Types.ObjectId
  },
  thumbnailId: {
    type: Schema.Types.ObjectId
  },
  status: {
    type: String,
    index: true,
    default: STATUS.ACTIVE
  },
  tagline: String,
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  totalLike: { type: Number, default: 0 },
  totalComment: { type: Number, default: 0 },
  isSale: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  isSchedule: { type: Boolean, default: false },
  scheduleAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
