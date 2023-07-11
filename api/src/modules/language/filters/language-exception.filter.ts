import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as mongoose from 'mongoose';
import { LanguageModel } from '../language.model';
import { languageSchema } from '../language.schema';

mongoose.connect(process.env.MONGO_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

@Catch()
export class LanguageExceptionFilter extends BaseExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const key = exception.getResponse() as any;
      const ctx = host.switchToHttp().getRequest();
      const locale = ctx.headers['content-language'];

      if (typeof key === 'string' && locale) {
        const languageModel = mongoose.model<LanguageModel>(
          'LanguageSetting',
          languageSchema
        );
        const result = await languageModel.findOne({ key, locale });
        if (result) {
          super.catch(
            new HttpException(result.value, exception.getStatus()),
            host
          );
          return;
        }
      }
    }

    super.catch(exception, host);
  }
}
