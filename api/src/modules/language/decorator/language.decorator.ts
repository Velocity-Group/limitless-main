import { SetMetadata } from '@nestjs/common';

export const Language = (value: string) => SetMetadata('language', value);
