import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Get,
  Post,
  UseGuards,
  Body,
  Put
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { PayoutRequestCreatePayload, PayoutRequestPerformerUpdatePayload } from '../payloads/payout-request.payload';
import { PayoutRequestService } from '../services/payout-request.service';

@Injectable()
@Controller('payout-requests/performer')
export class PayoutRequestController {
  constructor(private readonly payoutRequestService: PayoutRequestService) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() payload: PayoutRequestCreatePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.performerCreate(payload, user);
    return DataResponse.ok(data);
  }

  @Post('/calculate')
  @HttpCode(HttpStatus.OK)
  @Roles('performer', 'admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculate(
    @Body() payload: { performerId: string },
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.calculate(user, payload);
    return DataResponse.ok(data);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() payload: PayoutRequestPerformerUpdatePayload,
    @CurrentUser() performer: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.performerUpdate(id, payload, performer);
    return DataResponse.ok(data);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async details(
    @Param('id') id: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.details(id, user);
    return DataResponse.ok(data);
  }
}
