import { Provider } from '@nestjs/common';
import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { translationSchema } from '../schemas';

export const TRANSLATION_SCHEMA_PROVIDER = 'TRANSLATION_SCHEMA_PROVIDER';

export const provider: Provider[] = [{
  provide: TRANSLATION_SCHEMA_PROVIDER,
  inject: [MONGO_DB_PROVIDER],
  useFactory: (connection: Connection) => connection.model('Translation', translationSchema)
}];
