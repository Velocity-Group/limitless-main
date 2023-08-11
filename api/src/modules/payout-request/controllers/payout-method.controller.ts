import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Post,
  UseGuards,
  Body
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { } from '../payloads/payout-request.payload';
import { PayoutMethodService } from '../services';

@Injectable()
@Controller('payout-methods')
export class PayoutMethodController {
  constructor(private readonly payoutMethodService: PayoutMethodService) {}

  @Post('/:key')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Param('key') key: string,
    @Body() payload: any,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutMethodService.updateMethod(key, payload, user);
    return DataResponse.ok(data);
  }

  @Post('/admin/:key')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('key') key: string,
    @Body() payload: any
  ): Promise<DataResponse<any>> {
    const data = await this.payoutMethodService.adminUpdateMethod(key, payload);
    return DataResponse.ok(data);
  }
}
