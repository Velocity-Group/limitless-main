import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { payoutRequestSchema, PayoutMethodSchema } from '../schemas';

export const PAYOUT_REQUEST_MODEL_PROVIDER = 'PAYOUT_REQUEST_MODEL_PROVIDER';
export const PAYOUT_METHOD_MODEL_PROVIDER = 'PAYOUT_METHOD_MODEL_PROVIDER';

export const payoutRequestProviders = [
  {
    provide: PAYOUT_REQUEST_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PayoutRequest', payoutRequestSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: PAYOUT_METHOD_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PayoutMethods', PayoutMethodSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
