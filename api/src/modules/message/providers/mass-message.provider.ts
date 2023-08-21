import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { MassMessageSchema } from '../schemas';

export const MASS_MESSAGE_MODEL_PROVIDER = 'MASS_MESSAGE_MODEL_PROVIDER';

export const massMessageProviders = [
  {
    provide: MASS_MESSAGE_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('MassMessages', MassMessageSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
