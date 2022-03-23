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
import { LoadUser, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserInterceptor } from 'src/modules/auth/interceptors';
import { UserDto } from 'src/modules/user/dtos';
import { StreamService } from '../services/stream.service';
import {
  StartStreamPayload, SetDurationPayload, SearchStreamPayload, UpdateStreamPayload
} from '../payloads';
import { StreamDto } from '../dtos';

@Injectable()
@Controller('streaming')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getList(
    @Query() req: SearchStreamPayload
  ): Promise<DataResponse<PageableData<StreamDto>>> {
    const data = await this.streamService.adminSearch(req);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoadUser)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userList(
    @Query() req: SearchStreamPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<StreamDto>>> {
    const data = await this.streamService.userSearch(req, user);
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

  @Post('/live')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async goLive(
    @CurrentUser() performer: PerformerDto,
    @Body() payload: StartStreamPayload
  ) {
    const data = await this.streamService.goLive(payload, performer);
    return DataResponse.ok(data);
  }

  @Put('/live/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async editLive(
    @Param('id') id,
    @Body() payload: UpdateStreamPayload
  ) {
    const data = await this.streamService.editLive(id, payload);
    return DataResponse.ok(data);
  }

  @Post('/join/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UserInterceptor)
  @UseGuards(LoadUser)
  @UsePipes(new ValidationPipe({ transform: true }))
  async join(
    @Param('id') performerId: string
  ) {
    const data = await this.streamService.joinPublicChat(performerId);
    return DataResponse.ok(data);
  }

  @Put('/set-duration')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async setDuration(
    @CurrentUser() user: PerformerDto,
    @Body() payload: SetDurationPayload
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.updateStreamDuration(payload, user);
    return DataResponse.ok(result);
  }
}
