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

export class PaymentTransactionModel extends Document {
  paymentGateway: string;

  source: string;

  sourceId: ObjectId;

  target: string;

  targetId: ObjectId;

  performerId: ObjectId;

  couponInfo: any;

  // subscription, store, etc...
  type: string;

  totalPrice: number;

  originalPrice: number;

  products: PaymentProductModel[];

  paymentResponseInfo: any;

  stripeInvoiceId: string;

  stripeConfirmUrl: string;

  liveMode: boolean;

  status: string;

  createdAt: Date;

  updatedAt: Date;
}
