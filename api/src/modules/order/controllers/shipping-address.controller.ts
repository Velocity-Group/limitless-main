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
  Body,
  Post,
  Delete
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData, SearchRequest } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { ShippingAddressService } from '../services';
import { ShippingAddressModel } from '../models';
import { AddressBodyPayload } from '../payloads';

@Injectable()
@Controller('addresses')
export class ShippingAddressController {
  constructor(
    private readonly shippingAddressService: ShippingAddressService
  ) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async orders(
    @Query() req: SearchRequest,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<any>>> {
    const data = await this.shippingAddressService.search(req, user);
    return DataResponse.ok(data);
  }

  @Post('/create')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto,
    @Body() payload: AddressBodyPayload
  ): Promise<DataResponse<ShippingAddressModel>> {
    const info = await this.shippingAddressService.create(payload, user);
    return DataResponse.ok(info);
  }

  @Put('/:id/update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findOne(
    @Param('id') id: string,
    @Body() payload: AddressBodyPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<boolean>> {
    const data = await this.shippingAddressService.update(id, payload, user);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<ShippingAddressModel>> {
    const data = await this.shippingAddressService.findOne(id, user);
    return DataResponse.ok(data);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<boolean>> {
    const data = await this.shippingAddressService.delete(id, user);
    return DataResponse.ok(data);
  }
}
