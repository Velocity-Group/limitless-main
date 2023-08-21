import { Schema } from 'mongoose';
import { STATUS } from 'src/kernel/constants';

export const MassMessageSchema = new Schema({
  text: String,
  senderId: Schema.Types.ObjectId,
  status: { type: String, default: STATUS.PENDING },
  isSchedule: Boolean,
  scheduledAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
