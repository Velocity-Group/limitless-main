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
  Param,
  Post,
  Body
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { EarningService } from '../services/earning.service';
import {
  EarningSearchRequestPayload,
  UpdateEarningStatusPayload
} from '../payloads';
import { EarningDto, IEarningStatResponse } from '../dtos/earning.dto';

@Injectable()
@Controller('earning')
export class EarningController {
  constructor(private readonly earningService: EarningService) {}

  @Get('/admin/search')
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() req: EarningSearchRequestPayload
  ): Promise<DataResponse<PageableData<EarningDto>>> {
    const data = await this.earningService.admminSearch(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<EarningDto>>> {
    const data = await this.earningService.search(req, user);
    return DataResponse.ok(data);
  }

  @Get('/admin/stats')
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminStats(
    @Query() req: EarningSearchRequestPayload
  ): Promise<DataResponse<IEarningStatResponse>> {
    const data = await this.earningService.stats(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/stats')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerStats(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<IEarningStatResponse>> {
    req.performerId = user._id;
    const data = await this.earningService.stats(req);
    return DataResponse.ok(data);
  }

  @Post('/admin/update-status')
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateStats(
    @Body() payload: UpdateEarningStatusPayload
  ): Promise<DataResponse<IEarningStatResponse>> {
    const data = await this.earningService.updatePaidStatus(payload);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @Roles('admin', 'sub-admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async details(@Param('id') id: string): Promise<DataResponse<EarningDto>> {
    const data = await this.earningService.details(id);
    return DataResponse.ok(data);
  }
}
