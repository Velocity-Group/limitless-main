import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class OrderDto {
  _id: ObjectId;

  transactionId: ObjectId;

  performerId: ObjectId;

  performerInfo?: any;

  userId: ObjectId;

  userInfo?: any;

  orderNumber: string;

  shippingCode: string;

  productId: ObjectId;

  productInfo: any;

  quantity: number;

  unitPrice: number;

  totalPrice: number;

  deliveryAddress?: string;

  deliveryStatus: string;

  postalCode?: string;

  userNote?: string;

  phoneNumber?: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<OrderDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'transactionId',
          'performerId',
          'performerInfo',
          'userId',
          'userInfo',
          'orderNumber',
          'shippingCode',
          'productId',
          'productInfo',
          'quantity',
          'unitPrice',
          'totalPrice',
          'deliveryAddress',
          'deliveryStatus',
          'postalCode',
          'userNote',
          'phoneNumber',
          'createdAt',
          'updatedAt'
        ])
      );
  }
}
