import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  Request,
  Body,
  Put,
  Query
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { DataResponse, PageableData } from 'src/kernel';
import { AuthService } from 'src/modules/auth/services';
import { UserSearchService, UserService } from '../services';
import { UserDto, IUserResponse } from '../dtos';
import { UserSearchRequestPayload, UserUpdatePayload } from '../payloads';

@Injectable()
@Controller('users')
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userSearchService: UserSearchService
  ) { }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async me(
    @Request() req: any
  ): Promise<DataResponse<IUserResponse>> {
    const { authUser, jwToken } = req;
    const user = await this.userService.getMe(authUser.sourceId, jwToken);
    return DataResponse.ok(user);
  }

  @Put()
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UserUpdatePayload
  ): Promise<DataResponse<IUserResponse>> {
    const user = await this.userService.update(currentUser._id, payload, currentUser);
    if (payload.password) {
      await Promise.all([
        user.email && this.authService.create({
          source: 'user',
          sourceId: user._id,
          type: 'email',
          key: user.email,
          value: payload.password
        }),
        user.username && this.authService.create({
          source: 'user',
          sourceId: user._id,
          type: 'username',
          key: user.username,
          value: payload.password
        })
      ]);
    }
    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Get('/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() req: UserSearchRequestPayload
  ): Promise<DataResponse<PageableData<IUserResponse>>> {
    return DataResponse.ok(await this.userSearchService.performerSearch(req));
  }
}
