import {
  Post,
  HttpCode,
  HttpStatus,
  Controller,
  UseGuards,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth';
import { VeriffGeneratePayload } from 'src/modules/auth/payloads';
import { UserDto } from 'src/modules/user/dtos';
import { VeriffService } from '../services';

@Controller('veriff')
export class VeriffController {
  constructor(
    private readonly veriffService: VeriffService
  ) {}

  @Get('decision')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getDecision(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    // https://developers.veriff.com/#get-sessions-sessionid-decision
    const data = await this.veriffService.getDecision(user._id);
    return DataResponse.ok(data);
  }

  @Get('/:performerId/decision')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminGetIdentity(
    @Param('performerId') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.veriffService.getDecision(id);
    return DataResponse.ok(data);
  }

  @Post('generate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createAcccessToken(
    @CurrentUser() user: UserDto,
    @Body() payload: VeriffGeneratePayload
  ): Promise<DataResponse<any>> {
    const data = await this.veriffService.generateVerification(payload, user);
    return DataResponse.ok(data);
  }

  @Post('callhook')
  @HttpCode(HttpStatus.OK)
  async callhook(
    @Body() payload: any
  ): Promise<DataResponse<any>> {
    const data = await this.veriffService.listenStatusWebhook(payload);
    return DataResponse.ok(data);
  }

  @Post('event-callhook')
  @HttpCode(HttpStatus.OK)
  async eventCallhook(
    @Body() payload: any
  ): Promise<DataResponse<any>> {
    const data = await this.veriffService.listenEventWebhook(payload);
    return DataResponse.ok(data);
  }
}
