import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';

  @Injectable()
export class LanguageInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const language = this.reflector.get<string>(
      'language',
      context.getHandler()
    );
    const defaultLangguage = SettingService.getValueByKey(SETTING_KEYS.DEFAULT_LOCALE);

    const ctx = context.switchToHttp().getRequest();
    ctx.i18nLang = language || ctx.headers['content-language'] || defaultLangguage;
    return next.handle();
  }
}
