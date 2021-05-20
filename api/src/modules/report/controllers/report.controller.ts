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
  Delete,
  forwardRef,
  Inject,
  Param
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { AuthService } from 'src/modules/auth/services';
import { ReportService } from '../services/report.service';
import { ReportCreatePayload, ReportSearchRequestPayload } from '../payloads';
import { ReportDto } from '../dtos/report.dto';
import { UserDto } from '../../user/dtos';

@Injectable()
@Controller('reports')
export class ReportController {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly reportService: ReportService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto,
    @Body() payload: ReportCreatePayload
  ): Promise<DataResponse<ReportDto>> {
    const data = await this.reportService.create(payload, user);
    return DataResponse.ok(data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async remove(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.reportService.remove(id);
    return DataResponse.ok(data);
  }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async bookmarkFeeds(
    @Query() query: ReportSearchRequestPayload
  ): Promise<DataResponse<PageableData<ReportDto>>> {
    const data = await this.reportService.search(query);
    return DataResponse.ok(data);
  }
}
