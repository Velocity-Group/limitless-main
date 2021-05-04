export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};
export const PAYMENT_TYPE = {
  FREE_SUBSCRIPTION: 'free_subscription',
  MONTHLY_SUBSCRIPTION: 'monthly_subscription',
  YEARLY_SUBSCRIPTION: 'yearly_subscription',
  SALE_VIDEO: 'sale_video',
  PRODUCT: 'product',
  TIP_PERFORMER: 'tip',
  FEED: 'feed',
  MESSAGE: 'message',
  TOKEN_PACKAGE: 'token_package'
};
export const PAYMENT_TARGET_TYPE = {
  TIP: 'tip',
  PERFORMER: 'subscription_performer',
  PRODUCT: 'product',
  VIDEO: 'video',
  FEED: 'feed',
  MESSAGE: 'message',
  TOKEN_PACKAGE: 'token_package'
};

export const TRANSACTION_SUCCESS_CHANNEL = 'TRANSACTION_SUCCESS_CHANNEL';

export const OVER_PRODUCT_STOCK = 'OVER_PRODUCT_STOCK';
export const DIFFERENT_PERFORMER_PRODUCT = 'DIFFERENT_PERFORMER_PRODUCT';
export const MISSING_CONFIG_PAYMENT_GATEWAY = 'Missing config for this payment method';

export const ORDER_STATUS = {
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  REFUNDED: 'refunded'
};
