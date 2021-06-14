import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  PaymentTransactionSchema, StripeAccountSchema, StripeProductSchema
} from '../schemas';

export const PAYMENT_TRANSACTION_MODEL_PROVIDER = 'PAYMENT_TRANSACTION_MODEL_PROVIDER';
export const STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER = 'STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER';
export const STRIPE_PRODUCT_MODEL_PROVIDER = 'STRIPE_PRODUCT_MODEL_PROVIDER';

export const paymentProviders = [
  {
    provide: PAYMENT_TRANSACTION_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PaymentTransaction', PaymentTransactionSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('StripeConnectAccounts', StripeAccountSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: STRIPE_PRODUCT_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('StripeProducts', StripeProductSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
