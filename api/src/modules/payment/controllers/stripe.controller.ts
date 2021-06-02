import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
  Body,
  Get,
  Delete,
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { StripeService } from '../services';
import { AuthoriseCardPayload } from '../payloads/authorise-card.payload';

@Injectable()
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService
  ) {}

  @Post('accounts')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async create(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const info = await this.stripeService.createConnectAccount(user);
    return DataResponse.ok(info);
  }

  @Get('accounts/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async myAccount(
    @CurrentUser() user: UserDto
  ) {
    const resp = await this.stripeService.retrieveConnectAccount(user._id);
    return DataResponse.ok(resp);
  }

  @Get('accounts/me/login-link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async loginLink(
    @CurrentUser() user: UserDto
  ) {
    const resp = await this.stripeService.getExpressLoginLink(user);
    return DataResponse.ok(resp);
  }

  @Post('user/cards')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  async authoriseCard(
    @CurrentUser() user: UserDto,
    @Body() payload: AuthoriseCardPayload
  ): Promise<DataResponse<any>> {
    const info = await this.stripeService.authoriseCard(user, payload);
    return DataResponse.ok(info);
  }

  @Delete('user/cards/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  async deleteCard(
    @CurrentUser() user: UserDto,
    @Param('id') cardId: string
  ): Promise<DataResponse<any>> {
    const info = await this.stripeService.removeCard(user, cardId);
    return DataResponse.ok(info);
  }

  @Get('user/cards')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('user')
  async getCards(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const info = await this.stripeService.getListCards(user);
    return DataResponse.ok(info);
  }
}
