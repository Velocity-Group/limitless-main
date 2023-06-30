import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { RoleGuard } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { StreamRequestPayload, StreamRequestSearchPayload } from '../payloads';
import { StreamRequestSerivce } from '../services';

@Controller("streaming/private")
export class StreamRequestController {
  constructor(private readonly streamRequestService: StreamRequestSerivce) {}

  @Post("request")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("user")
  async request(
    @Body() payload: StreamRequestPayload,
    @CurrentUser() user: UserDto
  ) {
    return DataResponse.ok(
      await this.streamRequestService.create(payload, user)
    );
  }

  @Post("request/:id/approve")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("performer")
  async accept(@Param("id") id: string, @CurrentUser() user: UserDto) {
    return DataResponse.ok(
      await this.streamRequestService.approveRequest(id, user)
    );
  }

  @Post("request/:id/reject")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("performer")
  async reject(@Param("id") id: string, @CurrentUser() user: UserDto) {
    return DataResponse.ok(
      await this.streamRequestService.rejectRequest(id, user)
    );
  }

  @Post("request/:id/start")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("performer")
  async start(@Param("id") id: string, @CurrentUser() user: UserDto, @Body() payload: any) {
    return DataResponse.ok(
      await this.streamRequestService.startStream(id, user, payload)
    );
  }

  @Post("request/:id/join")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("user")
  async join(@Param("id") id: string, @CurrentUser() user: UserDto) {
    return DataResponse.ok(
      await this.streamRequestService.joinStream(id, user)
    );
  }

  @Post("request/:id/edit")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("performer")
  async edit(@Param("id") id: string, @CurrentUser() user: UserDto, @Body() payload: any) {
    return DataResponse.ok(
      await this.streamRequestService.editStream(id, user, payload)
    );
  }

  @Delete("request/:id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("user")
  async cancel(@Param("id") id: string, @CurrentUser() user: UserDto) {
    return DataResponse.ok(await this.streamRequestService.delete(id, user));
  }

  @Get("request/search")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("user")
  async search(
    @Query() payload: StreamRequestSearchPayload,
    @CurrentUser() user: UserDto
  ) {
    return DataResponse.ok(
      await this.streamRequestService.searchByUser(payload, user)
    );
  }

  @Get("request")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles("performer")
  async searchByPerformer(
    @Query() payload: StreamRequestSearchPayload,
    @CurrentUser() user: UserDto
  ) {
    return DataResponse.ok(
      await this.streamRequestService.searchByPerformer(payload, user)
    );
  }
}
