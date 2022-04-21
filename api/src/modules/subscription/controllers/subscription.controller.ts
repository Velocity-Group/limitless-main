import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query,
  Post,
  Body,
  Put,
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import {
  SubscriptionCreatePayload,
  SubscriptionSearchRequestPayload,
  SubscriptionUpdatePayload
} from '../payloads';
import {
  SubscriptionDto,
  ISubscriptionResponse
} from '../dtos/subscription.dto';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() payload: SubscriptionCreatePayload
  ): Promise<DataResponse<SubscriptionDto>> {
    const data = await this.subscriptionService.adminCreate(payload);
    return DataResponse.ok(data);
  }

  @Put('/admin/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Body() payload: SubscriptionUpdatePayload,
    @Param('id') subscriptionId: string
  ): Promise<DataResponse<SubscriptionDto>> {
    const data = await this.subscriptionService.adminUpdate(subscriptionId, payload);
    return DataResponse.ok(data);
  }

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() req: SubscriptionSearchRequestPayload
  ): Promise<DataResponse<PageableData<SubscriptionDto>>> {
    const data = await this.subscriptionService.adminSearch(req);
    return DataResponse.ok(data);
  }

  @Get('/admin/update-count-subscription')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminUpdateUserStats(): Promise<DataResponse<any>> {
    const data = await this.subscriptionService.adminUpdateUserStats();
    return DataResponse.ok({ data });
  }

  @Get('/performer/search')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerSearch(
    @Query() req: SubscriptionSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<SubscriptionDto>>> {
    const data = await this.subscriptionService.performerSearch(req, user);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userSearch(
    @Query() req: SubscriptionSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<ISubscriptionResponse>>> {
    const data = await this.subscriptionService.userSearch(req, user);
    return DataResponse.ok({
      total: data.total,
      data: data.data.map((s) => s.toResponse(false))
    });
  }
}
