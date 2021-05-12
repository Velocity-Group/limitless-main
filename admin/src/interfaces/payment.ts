import { ISearch } from './utils';

export interface IProductPayment {
  name?: string;
  description?: string;
  price?: number;
  productId?: string;
  productType?: string;
}

export interface IPayment {
  _id: string;
  products: IProductPayment[];
  paymentGateway?: string;
  source?: string;
  sourceId?: string;
  target?: string;
  targetId?: string;
  type?: string;
  status?: string;
}

export interface IPaymentSearch extends ISearch {
  type?: string;
  sourceId?: string;
}

export interface IOrder {
  _id: string;
  transactionId: string;
  performerId: string;
  performerInfo?: any;
  userId: string;
  userInfo?: any;
  orderNumber: string;
  shippingCode: string;
  productId: string;
  productInfo: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryAddress?: string;
  deliveryStatus: string;
  postalCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentTokenHistory {
  _id: string;
  sourceInfo?: any;
  source?: string;
  sourceId: string;
  performerId?: string;
  performerInfo?: any;
  target?: string;
  targetId?: string;
  type?: string;
  products?: PaymentProduct[];
  totalPrice?: number;
  originalPrice?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  digitalProducts?: DigitalProductResponse[];
  shippingInfo?: IShippingInfo;
}

export interface DigitalProductResponse {
  digitalFileUrl?: any;
  digitalFileId?: any;
  _id?: string;
}

export interface IShippingInfo {
  isNew?: boolean;
  createdAt?: Date;
  deliveryAddress?: string;
  deliveryStatus?: string;
  orderNumber?: string;
  performerId?: string;
  postalCode?: number;
  productIds?: [];
  quantity?: number;
  shippingCode?: string;
  totalPrice?: number;
  transactionTokenId?: string;
  updatedAt?: Date;
  userId?: string;
  _id: string;
}

export interface PaymentProduct {
  name?: string;
  description?: string;
  price?: number;
  extraInfo?: any;
  productType?: string;
  productId?: string;
  performerId?: string;
  quantity?: number;
  tokens?: number;
}
