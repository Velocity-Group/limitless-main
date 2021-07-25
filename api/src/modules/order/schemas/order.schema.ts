import { Schema } from 'mongoose';

export const OrderSchema = new Schema({
  transactionId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  performerId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  orderNumber: {
    type: String
  },
  shippingCode: {
    type: String
  },
  productId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  productInfo: {
    type: Schema.Types.Mixed
  },
  unitPrice: {
    type: Number,
    default: 1
  },
  quantity: {
    type: Number,
    default: 1
  },
  totalPrice: {
    type: Number,
    default: 1
  },
  deliveryAddress: {
    type: String
  },
  postalCode: {
    type: String
  },
  deliveryStatus: {
    type: String,
    index: true
  },
  userNote: {
    type: String
  },
  phoneNumber: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
