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
  Body,
  Get,
  Delete
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { Roles, CurrentUser } from 'src/modules/auth';
import { DataResponse } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { PayoutRequestService } from '../services/payout-request.service';
import { PayoutRequestUpdatePayload } from '../payloads/payout-request.payload';

@Injectable()
@Controller('payout-requests')
export class AdminPayoutRequestController {
  constructor(private readonly payoutRequestService: PayoutRequestService) {}

  @Post('/payout/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async payout(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.adminStripePayout(id);
    return DataResponse.ok(data);
  }

  @Post('/status/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateStatus(
    @Param('id') id: string,
    @Body() payload: PayoutRequestUpdatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.adminUpdateStatus(id, payload);
    return DataResponse.ok(data);
  }

  @Get('/admin/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminDetails(@Param('id') id: string): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.adminDetails(id);
    return DataResponse.ok(data);
  }

  @Delete('/admin/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async delete(@Param('id') id: string): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.adminDelete(id);
    return DataResponse.ok(data);
  }

  @Post('/admin/calculate')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculate(
    @Body() payload: { performerId: string },
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.calculate(user, payload);
    return DataResponse.ok(data);
  }
}
