import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Post,
  Param
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { PaymentService } from '../services/payment.service';

@Injectable()
@Controller('payment')
export class CancelSubscriptionController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/ccbill/cancel-subscription/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ccbillCancel(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.paymentService.ccbillCancelSubscription(subscriptionId, user);
    return DataResponse.ok(data);
  }

  @Post('/stripe/cancel-subscription/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async stripeCancel(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.paymentService.stripeCancelSubscription(subscriptionId, user);
    return DataResponse.ok(data);
  }
}
