import {
  Controller,
  Injectable,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Query
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import {
  DataResponse
} from 'src/kernel';
import { Roles } from 'src/modules/auth';
import {
  ChangeTokenLogsSearchPayload
} from '../payloads';
import { ChangeTokenLogService } from '../services/change-token-log.service';

@Injectable()
@Controller('admin/change-token')
export class ChangeTokenLogsController {
  constructor(
    private readonly changeTokenLogService: ChangeTokenLogService
  ) { }

  @Get('/logs')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async tokenLogs(
    @Query() req: ChangeTokenLogsSearchPayload
  ): Promise<DataResponse<any>> {
    const data = await this.changeTokenLogService.tokenChangeLogs(req);
    return DataResponse.ok(data);
  }
}
