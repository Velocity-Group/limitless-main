import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Query,
  Post,
  Param,
  UseGuards
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { CurrentUser, Roles } from '../decorators';
import { AuthGuard, RoleGuard } from '../guards';
import { ReferralStats, ReferralSearch } from '../payloads';
import { ReferralService } from '../services';

@Controller('referrals')
export class ReferralController {
  constructor(
    private readonly referralService: ReferralService
  ) { }

  @Get('admin/stats')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  public async adminStats(
  @Query() req: ReferralStats
  ): Promise<DataResponse<any>> {
    const resp = await this.referralService.adminStats(req);
    return DataResponse.ok(resp);
  }

  @Get('admin/search')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  public async adminSearch(
  @Query() req: ReferralSearch
  ): Promise<DataResponse<any>> {
    const resp = await this.referralService.search(req);
    return DataResponse.ok(resp);
  }

  @Get('user/search')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async userSearch(
  @Query() req: ReferralSearch,
  @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    req.referralId = user._id.toString();
    const resp = await this.referralService.search(req);
    return DataResponse.ok(resp);
  }

  @Get('user/code')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async userCode(
  @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const resp = await this.referralService.userCode(user);
    return DataResponse.ok(resp);
  }

  @Post('user/code/:code')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async updateReferral(
  @CurrentUser() user: UserDto,
  @Param() code: string
  ): Promise<DataResponse<any>> {
    const data = {
      code,
      registerSource: user.isPerformer ? 'performer' : 'user',
      registerId: user._id
    };
    const resp = await this.referralService.newReferral(data);
    return DataResponse.ok(resp);
  }
}
