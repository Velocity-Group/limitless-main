import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { FollowSchema } from '../schemas/follow.schema';

export const FOLLOW_MODEL_PROVIDER = 'FOLLOW_MODEL_PROVIDER';

export const followProviders = [
  {
    provide: FOLLOW_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Follows', FollowSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
