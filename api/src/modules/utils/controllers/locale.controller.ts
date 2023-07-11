import {
  Controller, Get, Query, HttpCode, HttpStatus
} from '@nestjs/common';
import { DataResponse, SearchRequest } from 'src/kernel';
import { LocaleService } from '../services';

@Controller('/locales')
export class LocaleController {
  constructor(private readonly localeService: LocaleService) { }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  search(@Query() payload: SearchRequest) {
    const results = this.localeService.search(payload);
    return DataResponse.ok(results);
  }
}
