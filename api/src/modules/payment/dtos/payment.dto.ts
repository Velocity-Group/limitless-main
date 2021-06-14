import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { ICouponResponse } from 'src/modules/coupon/dtos';

export interface PaymentProduct {
  name?: string;
  description?: string;
  price?: number | string;
  extraInfo?: any;
  productType?: string;
  productId?: ObjectId;
  performerId?: ObjectId;
  quantity?: number;
}

export class IPaymentResponse {
  _id: ObjectId;

  paymentGateway?: string;

  sourceInfo?: any;

  source?: string;

  sourceId: ObjectId;

  performerId?: ObjectId;

  performerInfo?: any;

  target?: string;

  targetId?: ObjectId;

  type?: string;

  products?: PaymentProduct[];

  paymentResponseInfo?: any;

  stripeInvoiceId?: string;

  stripeConfirmUrl?: string;

  totalPrice?: number;

  originalPrice?: number;

  couponInfo?: ICouponResponse;

  status?: string;

  liveMode?: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export class PaymentDto {
  _id: ObjectId;

  paymentGateway?: string;

  sourceInfo?: any;

  source?: string;

  sourceId: ObjectId;

  performerId?: ObjectId;

  performerInfo?: any;

  target?: string;

  targetId?: ObjectId;

  type?: string;

  products?: PaymentProduct[];

  paymentResponseInfo?: any;

  stripeInvoiceId?: string;

  stripeConfirmUrl?: string;

  totalPrice?: number;

  originalPrice?: number;

  couponInfo?: ICouponResponse;

  status?: string;

  liveMode?: boolean;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<PaymentDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'paymentGateway',
          'sourceInfo',
          'source',
          'sourceId',
          'performerId',
          'performerInfo',
          'target',
          'targetId',
          'type',
          'products',
          'paymentResponseInfo',
          'stripeInvoiceId',
          'stripeConfirmUrl',
          'status',
          'totalPrice',
          'originalPrice',
          'couponInfo',
          'liveMode',
          'createdAt',
          'updatedAt'
        ])
      );
  }

  toResponse(includePrivateInfo = false): IPaymentResponse {
    const publicInfo = {
      _id: this._id,
      paymentGateway: this.paymentGateway,
      sourceId: this.sourceId,
      source: this.source,
      sourceInfo: this.sourceInfo,
      performerId: this.performerId,
      performerInfo: this.performerInfo,
      target: this.target,
      targetId: this.targetId,
      type: this.type,
      products: this.products,
      totalPrice: this.totalPrice,
      originalPrice: this.originalPrice,
      couponInfo: this.couponInfo,
      status: this.status,
      stripeConfirmUrl: this.stripeConfirmUrl,
      liveMode: this.liveMode,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    const privateInfo = {
      paymentResponseInfo: this.paymentResponseInfo,
      stripeInvoiceId: this.stripeInvoiceId
    };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }
}
