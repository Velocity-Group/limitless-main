import * as mongoose from 'mongoose';
import { REPORT_TARGET } from '../constants';

export const ReportSchema = new mongoose.Schema({
  description: String,
  source: {
    type: String,
    default: 'user',
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  performerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  target: {
    type: String,
    default: REPORT_TARGET.FEED,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
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
