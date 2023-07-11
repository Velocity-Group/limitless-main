import { Schema } from 'mongoose';

export const languageSchema = new Schema({
  key: {
    type: String,
    index: true
  },
  locale: {
    type: String,
    index: true
  },
  value: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
