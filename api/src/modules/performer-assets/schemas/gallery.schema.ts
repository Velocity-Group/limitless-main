import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const GallerySchema = new Schema({
  performerId: { type: ObjectId, index: true },
  type: {
    type: String,
    index: true
  },
  title: {
    type: String
    // TODO - text index?
  },
  description: String,
  status: {
    type: String,
    // draft, active
    default: 'active'
  },
  price: {
    type: Number,
    default: 0
  },
  isSale: {
    type: Boolean,
    default: false
  },
  numOfItems: {
    type: Number,
    default: 0
  },
  tagline: String,
  coverPhotoId: ObjectId,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
