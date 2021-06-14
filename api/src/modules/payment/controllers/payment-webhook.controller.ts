import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
  Query
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { PaymentService } from '../services/payment.service';
@Injectable()
@Controller('payment')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService
  ) {}

  @Post('/ccbill/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ccbillCallhook(
    @Body() payload: Record<string, string>,
    @Query() req: Record<string, string>
  ): Promise<DataResponse<any>> {
    // TODO - update for ccbill whitelist here
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

  @Post('/stripe/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async stripePaymentCallhook(
    @Body() payload: Record<string, string>
  ): Promise<DataResponse<any>> {
    const { type } = payload; // event type
    if (!type.includes('payment_intent') && !type.includes('customer.subscription')) {
      return DataResponse.ok(false);
    }
    let info;
    if (type.includes('customer.subscription')) {
      info = await this.paymentService.stripeSubscriptionWebhook(payload);
    }
    if (type.includes('payment_intent')) {
      info = await this.paymentService.stripePaymentWebhook(payload);
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
}
