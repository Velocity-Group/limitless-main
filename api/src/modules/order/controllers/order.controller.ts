import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Body
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { AuthService } from 'src/modules/auth/services';
import { UserDto } from 'src/modules/user/dtos';
import { OrderService } from '../services';
import { OrderDto } from '../dtos';
import { OrderSearchPayload, OrderUpdatePayload } from '../payloads';
@Injectable()
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly authService: AuthService
  ) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async orders(
    @Query() req: OrderSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<OrderDto>>> {
    const data = await this.orderService.search(req, user);
    return DataResponse.ok(data);
  }

  @Get('/users/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userOrders(
    @Query() req: OrderSearchPayload,
    @CurrentUser() user: any
  ): Promise<DataResponse<PageableData<OrderDto>>> {
    const data = await this.orderService.userSearch(req, user);
    return DataResponse.ok(data);
  }

  @Put('/:id/update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findOne(
    @Param('id') id: string,
    @Body() payload: OrderUpdatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.orderService.update(id, payload);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string
  ): Promise<DataResponse<OrderDto>> {
    const data = await this.orderService.findOne(id);
    return DataResponse.ok(data);
  }
}
