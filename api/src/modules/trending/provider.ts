import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { TrendingSchema } from './trending.schema';

export const TRENDING_MODEL_PROVIDER = 'TRENDING_MODEL_PROVIDER';

export const trendingProviders = [
  {
    provide: TRENDING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('trendings', TrendingSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
