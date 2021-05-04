import { Schema } from 'mongoose';

export const tokenPackageSchema = new Schema({
  name: {
    type: String
  },
  description: {
    type: String
  },
  ordering: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  tokens: {
    type: Number,
    default: 0
  },
  isActive: { type: Boolean, default: false },
  updatedAt: {
    type: Date,
    default: new Date()
  },
  createdAt: {
    type: Date,
    default: new Date()
  }
});
