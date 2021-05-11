import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  OrderSchema
} from '../schemas';

export const ORDER_MODEL_PROVIDER = 'ORDER_MODEL_PROVIDER';

export const orderProviders = [
  {
    provide: ORDER_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('orders', OrderSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
