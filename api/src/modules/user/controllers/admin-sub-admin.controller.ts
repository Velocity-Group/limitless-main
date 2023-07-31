/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  Body,
  Put,
  Query,
  ValidationPipe,
  UsePipes,
  Param,
  Post,
  Inject,
  forwardRef,
  Delete
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { Roles } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { AuthService } from 'src/modules/auth/services';
import {
  SubAdminAuthCreatePayload
} from '../payloads';

import { UserDto, IUserResponse } from '../dtos';
import { UserSearchService, UserService } from '../services';

@Injectable()
@Controller('admin/sub-admin')
export class AdminSubAdminController {
  constructor(
      @Inject(forwardRef(() => AuthService))
      private readonly authService: AuthService,
      private readonly userService: UserService,
      private readonly userSearchService: UserSearchService

  ) {}

  @Post('/')
  @Roles('admin')
  @UseGuards(RoleGuard)
  async createUser(
      @Body() payload: SubAdminAuthCreatePayload
  ): Promise<DataResponse<IUserResponse>> {
    const user = await this.userService.createSubAdmin(new SubAdminAuthCreatePayload(payload), {
      roles: payload.roles
    });

    if (payload.password) {
      // generate auth if have pw, otherwise will create random and send to user email?
      await Promise.all([
        payload.email && this.authService.create({
          type: 'email',
          value: payload.password,
          source: 'user',
          key: payload.email,
          sourceId: user._id
        }),
        payload.username && this.authService.create({
          type: 'username',
          value: payload.password,
          source: 'user',
          key: payload.username,
          sourceId: user._id
        })
      ]);
    }

    return DataResponse.ok(new UserDto(user).toResponse(true));
  }
}
