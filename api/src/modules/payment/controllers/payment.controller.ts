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
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { PurchaseTokenPayload, SubscribePerformerPayload } from '../payloads';
import { PaymentService } from '../services/payment.service';

@Injectable()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/subscribe/performers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto,
    @Body() payload: SubscribePerformerPayload
  ): Promise<DataResponse<any>> {
    const info = await this.paymentService.subscribePerformer(payload, user);
    return DataResponse.ok(info);
  }

  @Post('/purchase-tokens/:tokenId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  @UsePipes(new ValidationPipe({ transform: true }))
  async purchaseTokens(
    @CurrentUser() user: UserDto,
    @Param('tokenId') tokenId: string,
    @Body() payload: PurchaseTokenPayload
  ): Promise<DataResponse<any>> {
    const info = await this.paymentService.buyTokens(tokenId, payload, user);
    return DataResponse.ok(info);
  }
}
