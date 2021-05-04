import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Query
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles, CurrentUser } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PurchasedItemSearchService } from '../services';
import { PaymentTokenSearchPayload } from '../payloads/purchase-item.search.payload';
import { IPaymentTokenResponse } from '../dtos';

@Injectable()
@Controller('purchased-items')
export class PaymentTokenSearchController {
  constructor(
    private readonly paymentTokenService: PurchasedItemSearchService
  ) {}

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminTranasctions(
    @Query() req: PaymentTokenSearchPayload
  ): Promise<DataResponse<PageableData<IPaymentTokenResponse>>> {
    const data = await this.paymentTokenService.adminGetUserTransactionsToken(
      req
    );
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  @UsePipes(new ValidationPipe({ transform: true }))
  async userTranasctions(
    @Query() req: PaymentTokenSearchPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<PageableData<IPaymentTokenResponse>>> {
    const data = await this.paymentTokenService.getUserTransactionsToken(
      req,
      user
    );
    return DataResponse.ok(data);
  }
}
