export const PAYMENT_STATUS = {
  CREATED: 'created',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAIL: 'fail',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
  REQUIRE_AUTHENTICATION: 'require_authentication'
};

export const PAYMENT_TYPE = {
  TOKEN_PACKAGE: 'token_package',
  FREE_SUBSCRIPTION: 'free_subscription',
  MONTHLY_SUBSCRIPTION: 'monthly_subscription',
  YEARLY_SUBSCRIPTION: 'yearly_subscription'
};

export const PAYMENT_TARGET_TYPE = {
  TOKEN_PACKAGE: 'token_package',
  PERFORMER: 'performer'
};

export const TRANSACTION_SUCCESS_CHANNEL = 'TRANSACTION_SUCCESS_CHANNEL';
export const MISSING_CONFIG_PAYMENT_GATEWAY = 'Missing config for this payment method';
