/* eslint-disable no-shadow */
export const PURCHASE_ITEM_TYPE = {
  VIDEO: 'video',
  PRODUCT: 'product',
  GALLERY: 'gallery',
  TIP: 'tip',
  FEED: 'feed',
  MESSAGE: 'message',
  MONTHLY_SUBSCRIPTION: 'monthly_subscription',
  YEARLY_SUBSCRIPTION: 'yearly_subscription',
  FREE_SUBSCRIPTION: 'free_subscription',
  PUBLIC_CHAT: 'public_chat',
  GROUP_CHAT: 'group_chat',
  PRIVATE_CHAT: 'private_chat',
  GIFT: 'gift',
  INVITATION_REGISTER: 'invitation_register'
};

export enum PurchaseItemType {
  VIDEO = 'video',
  PRODUCT = 'product',
  GALLERY = 'gallery',
  TIP = 'tip',
  FEED = 'feed',
  MESSAGE = 'message',
  GIFT = 'gift',
  MONTHLY_SUBSCRIPTION = 'monthly_subscription',
  YEARLY_SUBSCRIPTION = 'yearly_subscription',
  PUBLIC_CHAT = 'public_chat',
  GROUP_CHAT = 'group_chat',
  PRIVATE_CHAT = 'private_chat'
}

export const PURCHASE_ITEM_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  REFUNDED: 'refunded'
};

export const PURCHASE_ITEM_TARTGET_TYPE = {
  PRODUCT: 'product',
  VIDEO: 'video',
  GALLERY: 'gallery',
  FEED: 'feed',
  MESSAGE: 'message',
  PERFORMER: 'performer',
  STREAM: 'stream'
};

export const ORDER_TOKEN_STATUS = {
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  REFUNDED: 'refunded'
};

export enum PURCHASE_ITEM_TARGET_SOURCE {
  USER = 'user'
}

export const PURCHASED_ITEM_SUCCESS_CHANNEL = 'PURCHASED_ITEM_SUCCESS_CHANNEL';

export const OVER_PRODUCT_STOCK = 'OVER_PRODUCT_STOCK';
export const ITEM_NOT_PURCHASED = 'ITEM_NOT_PURCHASED';

export enum ROLE {
  USER = 'user',
  PERFORMER = 'performer',
  AGENT = 'agent'
}
