import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { AuthGuard } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { AgoraService } from '../services';

@Controller('streaming/agora')
export class AgoraController {
  constructor(private readonly aograService: AgoraService) {}

  @Post('/token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  buildTokenWithAccount(@Body() payload, @CurrentUser() currentUser: UserDto) {
    return DataResponse.ok(
      this.aograService.buildTokenWithAccount(
        payload.channelName,
        currentUser._id.toString()
      )
    );
  }
}
