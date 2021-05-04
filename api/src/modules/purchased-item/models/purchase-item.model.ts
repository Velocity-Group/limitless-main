import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PaymentProductModel {
  name?: string;

  description?: string;

  price?: number | string;

  extraInfo?: any;

  productType?: string;

  productId?: ObjectId;

  performerId?: ObjectId;

  quantity?: number;

  tokens?: number;
}

export class PaymentTokenModel extends Document {
  source: string;

  sourceId: ObjectId;

  target: string;

  targetId: ObjectId;

  performerId: ObjectId;

  type: string;

  totalPrice: number;

  originalPrice: number;

  products: PaymentProductModel[];

  status: string;

  createdAt: Date;

  updatedAt: Date;
}
