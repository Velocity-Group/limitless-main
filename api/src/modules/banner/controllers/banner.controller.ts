import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  Query
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { STATUS } from 'src/kernel/constants';
import { BannerSearchRequest } from '../payloads';
import { BannerSearchService } from '../services';

@Injectable()
@Controller('site-promo')
export class BannerController {
  constructor(private readonly bannerSearchService: BannerSearchService) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  async search(@Query() req: BannerSearchRequest) {
    req.status = STATUS.ACTIVE;
    const list = await this.bannerSearchService.search(req);
    return DataResponse.ok(list);
  }
}
