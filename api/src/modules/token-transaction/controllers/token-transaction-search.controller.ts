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
import { TokenTransactionSearchService } from '../services';
import { PaymentTokenSearchPayload } from '../payloads/purchase-item.search.payload';
import { IPaymentTokenResponse } from '../dtos';

@Injectable()
@Controller('token-transactions')
export class PaymentTokenSearchController {
  constructor(
    private readonly tokenTransactionSearchService: TokenTransactionSearchService
  ) {}

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminTranasctions(
    @Query() req: PaymentTokenSearchPayload
  ): Promise<DataResponse<PageableData<IPaymentTokenResponse>>> {
    const data = await this.tokenTransactionSearchService.adminGetUserTransactionsToken(
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
    const data = await this.tokenTransactionSearchService.getUserTransactionsToken(
      req,
      user
    );
    return DataResponse.ok(data);
  }
}
