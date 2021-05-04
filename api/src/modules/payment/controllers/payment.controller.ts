import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Post,
  Body,
  Query,
  Param
} from '@nestjs/common';
import { RoleGuard, AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import {
  PurchaseTokenPayload
} from '../payloads';
import { PaymentService } from '../services/payment.service';

@Injectable()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/purchase-tokens/:tokenId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async purchaseTokens(
    @CurrentUser() user: PerformerDto,
    @Param('tokenId') tokenId: string,
    @Body() payload: PurchaseTokenPayload
  ): Promise<DataResponse<any>> {
    const info = await this.paymentService.buyTokens(tokenId, payload, user);
    return DataResponse.ok(info);
  }

  @Post('/ccbill/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ccbillCallhook(
    @Body() payload: Record<string, string>,
    @Query() req: Record<string, string>
  ): Promise<DataResponse<any>> {
    if (!['NewSaleSuccess', 'RenewalSuccess'].includes(req.eventType)) {
      return DataResponse.ok(false);
    }

    let info;
    const data = {
      ...payload,
      ...req
    };
    switch (req.eventType) {
      case 'RenewalSuccess':
        info = await this.paymentService.ccbillRenewalSuccessWebhook(data);
        break;
      default:
        info = await this.paymentService.ccbillSinglePaymentSuccessWebhook(
          data
        );
        break;
    }
    return DataResponse.ok(info);
  }

  @Post('/bitpay/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async bitpayCallhook(
    @Body() payload: Record<string, any>
  ): Promise<DataResponse<any>> {
    const info = await this.paymentService.bitpaySuccessWebhook(payload);
    return DataResponse.ok(info);
  }

  @Post('/ccbill/cancel-subscription/:performerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ccbillCancel(
    @Param('performerId') performerId: string,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.paymentService.cancelSubscription(performerId, user);
    return DataResponse.ok(data);
  }

  @Post('/ccbill/admin/cancel-subscription/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminCancelCCbill(
    @Param('subscriptionId') subscriptionId: string
  ): Promise<DataResponse<any>> {
    const data = await this.paymentService.adminCancelSubscription(subscriptionId);
    return DataResponse.ok(data);
  }
}
