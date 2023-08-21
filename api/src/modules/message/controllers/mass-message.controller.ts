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
  Param,
  Put,
  Delete
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { MassMessageSearchPayload, MassMessagesToSubscribersCreatePayload, MassMessagesUpdatePayload } from '../payloads';
import { MassMessageDto } from '../dtos/mass-message.dto';
import { MassMessageService } from '../services';

@Injectable()
@Controller('mass-messages')
export class MassMessageController {
  constructor(
      private readonly massMessageService: MassMessageService
  ) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async sendMassMessages(
    @CurrentUser() user: UserDto,
    @Body() payload: MassMessagesToSubscribersCreatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.massMessageService.sendMassMessagesToSubscribers(user, payload);
    return DataResponse.ok(data);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
      @Query() req: MassMessageSearchPayload,
      @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<MassMessageDto>>> {
    const data = await this.massMessageService.searchMassMessages(req, user);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPerformerMassMessage(
    @Param('id') id: string
  ): Promise<DataResponse<MassMessageDto>> {
    const data = await this.massMessageService.findOne(id);
    return DataResponse.ok(data);
  }

  @Put('/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() payload: MassMessagesUpdatePayload
  ) {
    const details = await this.massMessageService.update(id, payload);
    return DataResponse.ok(details);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const details = await this.massMessageService.delete(id);
    return DataResponse.ok(details);
  }
}
