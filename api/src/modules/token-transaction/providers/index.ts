import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { TokenTransactionSchema } from '../schemas';

export const PAYMENT_TOKEN_MODEL_PROVIDER = 'PAYMENT_TOKEN_MODEL_PROVIDER';

export const paymentTokenProviders = [
  {
    provide: PAYMENT_TOKEN_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PurchasedItem', TokenTransactionSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
