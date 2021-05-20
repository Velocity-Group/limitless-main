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
import { RoleGuard, AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
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
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.paymentService.cancelSubscription(subscriptionId, user);
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
