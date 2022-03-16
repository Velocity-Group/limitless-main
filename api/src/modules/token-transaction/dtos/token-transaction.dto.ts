import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export interface PaymentProduct {
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

export interface DigitalProductResponse {
  digitalFileUrl?: any;
  digitalFileId?: any;
  _id?: string | ObjectId;
}

export class IPaymentTokenResponse {
  _id: ObjectId;

  sourceInfo?: any;

  source?: string;

  sourceId: ObjectId;

  performerId?: ObjectId;

  performerInfo?: any;

  target?: string;

  targetId?: ObjectId;

  sessionId: string;

  type?: string;

  products?: PaymentProduct[];

  totalPrice?: number;

  originalPrice?: number;

  status?: string;

  createdAt: Date;

  updatedAt: Date;

  digitalProducts?: DigitalProductResponse[];

  shippingInfo?: any;
}

export class TokenTransactionDto {
  _id: ObjectId;

  sourceInfo?: any;

  source?: string;

  sourceId: ObjectId;

  performerId?: ObjectId;

  performerInfo?: any;

  target?: string;

  targetId?: ObjectId;

  sessionId?: string;

  type?: string;

  products?: PaymentProduct[];

  totalPrice?: number;

  originalPrice?: number;

  status?: string;

  createdAt: Date;

  updatedAt: Date;

  digitalProducts?: DigitalProductResponse[];

  shippingInfo?: any;

  constructor(data: Partial<TokenTransactionDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'sourceInfo',
          'source',
          'sourceId',
          'performerId',
          'performerInfo',
          'target',
          'targetId',
          'sessionId',
          'type',
          'products',
          'status',
          'totalPrice',
          'originalPrice',
          'createdAt',
          'updatedAt',
          'digitalProducts',
          'shippingInfo'
        ])
      );
  }

  toResponse(includePrivateInfo = false): IPaymentTokenResponse {
    const publicInfo = {
      _id: this._id,
      sourceId: this.sourceId,
      source: this.source,
      sourceInfo: this.sourceInfo,
      performerId: this.performerId,
      performerInfo: this.performerInfo,
      target: this.target,
      targetId: this.targetId,
      sessionId: this.sessionId,
      type: this.type,
      products: this.products,
      totalPrice: this.totalPrice,
      originalPrice: this.originalPrice,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    const privateInfo = { shippingInfo: this.shippingInfo };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }
}
