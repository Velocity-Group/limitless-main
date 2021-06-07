import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Post,
  Body
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { PayoutRequestCreatePayload } from '../payloads/payout-request.payload';
import { PayoutRequestService } from '../services/payout-request.service';

@Injectable()
@Controller('payout-requests/webhooks')
export class PayoutWebhookController {
  constructor(private readonly payoutRequestService: PayoutRequestService) {}

  @Post('/paypal')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async paypalWebhook(
    @Body() payload: PayoutRequestCreatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.paypalPayoutCallhook(payload);
    return DataResponse.ok(data);
  }
}
