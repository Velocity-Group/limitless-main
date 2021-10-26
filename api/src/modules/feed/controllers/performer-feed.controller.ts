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
  Put,
  Param,
  Delete,
  Get,
  Query,
  forwardRef,
  Inject
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { AuthService } from 'src/modules/auth/services';
import { UserDto } from 'src/modules/user/dtos';
import {
  FeedCreatePayload, FeedSearchRequest, PollCreatePayload
} from '../payloads';
import { FeedDto } from '../dtos';
import { FeedService } from '../services';
import { MissingFieldsException } from '../exceptions';

@Injectable()
@Controller('feeds/performers')
export class PerformerFeedController {
  constructor(
    private readonly feedService: FeedService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {}

  @Post('/')
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() payload: FeedCreatePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    if (user.roles && user.roles.includes('admin') && !payload.fromSourceId) {
      throw new MissingFieldsException();
    }
    const data = await this.feedService.create(payload, user);
    return DataResponse.ok(data);
  }

  @Get('/')
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMyFeeds(
    @Query() query: FeedSearchRequest,
    @CurrentUser() performer: UserDto
  ): Promise<DataResponse<PageableData<any>>> {
    const data = await this.feedService.search(query, performer);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPerformerFeed(
    @CurrentUser() user: UserDto,
    @Param('id') id: string
  ): Promise<DataResponse<FeedDto>> {
    const data = await this.feedService.findOne(id, user);
    return DataResponse.ok(data);
  }

  @Put('/:id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateFeed(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() payload: FeedCreatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.feedService.updateFeed(id, user, payload);
    return DataResponse.ok(data);
  }

  @Delete('/:id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deletePerformerFeed(
    @CurrentUser() user: UserDto,
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.feedService.deleteFeed(id, user);
    return DataResponse.ok(data);
  }

  @Post('/polls')
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPollFeed(
    @Body() payload: PollCreatePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.feedService.createPoll(payload, user);
    return DataResponse.ok(data);
  }
}
