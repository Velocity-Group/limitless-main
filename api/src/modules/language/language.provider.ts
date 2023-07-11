import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { languageSchema } from './language.schema';
import { LanguageInterceptor } from './interceptors';

export const LANGUAGE_MODEL_PROVIDER = 'LANGUAGE_MODEL_PROVIDER';

export const LANGUAGE_INTERCEPTOR = 'LANGUAGE_INTERCEPTOR';

export const languageProviders = [
  {
    provide: LANGUAGE_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('LanguageSetting', languageSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: LANGUAGE_INTERCEPTOR,
    useClass: LanguageInterceptor
  }
];
