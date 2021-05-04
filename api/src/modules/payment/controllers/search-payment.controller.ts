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
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles, CurrentUser } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PaymentSearchService } from '../services';
import { PaymentSearchPayload } from '../payloads/payment-search.payload';
import { IPaymentResponse } from '../dtos';

@Injectable()
@Controller('transactions')
export class PaymentSearchController {
  constructor(private readonly paymentService: PaymentSearchService) {}

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminTranasctions(
    @Query() req: PaymentSearchPayload
  ): Promise<DataResponse<PageableData<IPaymentResponse>>> {
    const data = await this.paymentService.adminGetUserTransactions(req);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userTranasctions(
    @Query() req: PaymentSearchPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<PageableData<IPaymentResponse>>> {
    const data = await this.paymentService.getUserTransactions(req, user);
    return DataResponse.ok(data);
  }
}
