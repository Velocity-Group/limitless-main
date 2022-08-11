/* eslint-disable no-param-reassign */
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
  Delete,
  Param
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { FollowService } from '../services/follow.service';
import { FollowSearchRequestPayload } from '../payloads';
import { FollowDto } from '../dtos/follow.dto';

@Injectable()
@Controller('follows')
export class FollowController {
  constructor(
    private readonly followService: FollowService
  ) {}

  @Post('/:followingId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @CurrentUser() user: UserDto,
    @Param('followingId') id: string
  ): Promise<DataResponse<FollowDto>> {
    const data = await this.followService.create(id, user);
    return DataResponse.ok(data);
  }

  @Delete('/:followingId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async remove(
    @CurrentUser() user: UserDto,
    @Param('followingId') id: string
  ): Promise<DataResponse<boolean>> {
    const data = await this.followService.remove(id, user);
    return DataResponse.ok(data);
  }

  @Get('/followers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async followers(
    @Query() req: FollowSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<FollowDto>>> {
    req.followingId = user._id.toString();
    const data = await this.followService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/following')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async following(
    @Query() req: FollowSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<FollowDto>>> {
    req.followerId = user._id.toString();
    const data = await this.followService.search(req);
    return DataResponse.ok(data);
  }
}
