import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  UseInterceptors,
  Put,
  Query
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserInterceptor } from 'src/modules/auth/interceptors';
import { StreamService } from '../services/stream.service';
import {
  StreamPayload, TokenCreatePayload, SetFreePayload, SetDurationPayload, PrivateCallRequestPayload, SearchStreamPayload
} from '../payloads';
import { StreamDto, Webhook } from '../dtos';
import { TokenResponse } from '../constant';

@Injectable()
@Controller('streaming')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('/admin/listing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getList(
    @Query() req: SearchStreamPayload
  ): Promise<DataResponse<PageableData<StreamDto>>> {
    const data = await this.streamService.search(req);
    return DataResponse.ok(data);
  }

  @Post('/admin/end-session/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async endSession(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.endSessionStream(id);
    return DataResponse.ok(data);
  }

  @Get('/session/:type')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSessionId(
    @CurrentUser() performer: PerformerDto,
    @Param() param: StreamPayload
  ): Promise<DataResponse<string>> {
    const sessionId = await this.streamService.getSessionId(
      performer._id,
      param.type
    );

    return DataResponse.ok(sessionId);
  }

  @Get('/session/:id/:type')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPerformerSessionId(
    @Param() params: StreamPayload
  ): Promise<DataResponse<string>> {
    const sessionId = await this.streamService.getSessionId(
      params.id,
      params.type
    );

    return DataResponse.ok(sessionId);
  }

  @Post('/live')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async goLive(
    @CurrentUser() performer: PerformerDto
  ) {
    const data = await this.streamService.goLive(performer);
    return DataResponse.ok(data);
  }

  @Post('/join/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UserInterceptor)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async join(@Param('id') performerId: string) {
    const data = await this.streamService.joinPublicChat(performerId);
    return DataResponse.ok(data);
  }

  @Post('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async requestPrivateChat(
    @Param('id') performerId: string,
    @Body() payload: PrivateCallRequestPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.requestPrivateChat(user, payload, performerId);
    return DataResponse.ok(data);
  }

  @Post('/private-chat/:id/decline')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async declinePrivateChat(
    @Param('id') id: string,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.declinePrivateChat(id, user);
    return DataResponse.ok(data);
  }

  @Get('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async accpetPrivateChat(
    @Param('id') id: string,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.acceptPrivateChat(id, performer._id);
    return DataResponse.ok(data);
  }

  @Post('/antmedia/webhook')
  async antmediaWebhook(@Body() payload: Webhook) {
    await this.streamService.webhook(payload.sessionId || payload.id, payload);
    return DataResponse.ok();
  }

  @Post('/token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async getOneTimeToken(
    @CurrentUser() user: PerformerDto,
    @Body() payload: TokenCreatePayload
  ): Promise<DataResponse<TokenResponse>> {
    const result = await this.streamService.getOneTimeToken(payload, user._id.toString());
    return DataResponse.ok(result);
  }

  @Put('/update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async setFree(
    @CurrentUser() user: PerformerDto,
    @Body() payload: SetFreePayload
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.updateStreamInfo(payload, user);
    return DataResponse.ok(result);
  }

  @Put('/set-duration')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async setDuration(
    @CurrentUser() user: PerformerDto,
    @Body() payload: SetDurationPayload
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.updateStreamDuration(payload, user);
    return DataResponse.ok(result);
  }

  @Get('/group-chat/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async joinGroupChat(
    @Param('id') id: string,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.joinGroupChat(id, user);

    return DataResponse.ok(data);
  }

  @Post('/group-chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async startGroupChat(
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.startGroupChat(performer._id);
    return DataResponse.ok(data);
  }
}
