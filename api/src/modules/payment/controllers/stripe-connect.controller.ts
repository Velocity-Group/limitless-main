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
  Get,
  Query,
  Param,
  Res
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { Response } from 'express';
import { StripeService } from '../services';

@Injectable()
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('accounts')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const info = await this.stripeService.createConnectAccount(user);
    return DataResponse.ok(info);
  }

  @Get('accounts/:id/callback')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async accountCallback(
    @Res() res: Response,
    @Body() payload: any,
    @Query() req: any,
    @Param('id') id: string
  ) {
    console.log(11, req);
    await this.stripeService.connectAccountCallback(payload, id);
    res.redirect(`${process.env.BASE_URL}/model/account`);
  }
}
