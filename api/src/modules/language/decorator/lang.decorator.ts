import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const I18nLang = createParamDecorator(
  (data, context: ExecutionContext) => {
    const ctx = context.switchToHttp().getRequest();
    return ctx.i18nLang;
  }
);
