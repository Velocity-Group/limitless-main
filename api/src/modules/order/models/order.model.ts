import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class OrderModel extends Document {
  transactionId: ObjectId;

  performerId: ObjectId;

  userId: ObjectId;

  orderNumber: string;

  shippingCode: string;

  productId: ObjectId;

  productInfo: any;

  quantity: number;

  unitPrice: number;

  totalPrice: number;

  deliveryAddress: string;

  deliveryStatus: string;

  postalCode: string;

  userNote: string;

  phoneNumber: string;

  createdAt: Date;

  updatedAt: Date;
}
