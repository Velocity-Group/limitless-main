import { Schema } from 'mongoose';

export const ShippingAddressSchema = new Schema({
  source: {
    type: String,
    index: true,
    default: 'user'
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  name: String,
  country: String,
  state: String,
  city: String,
  district: String,
  ward: String,
  streetNumber: String,
  streetAddress: String,
  zipCode: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
