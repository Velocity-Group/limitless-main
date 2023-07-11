import {
  Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Delete, UseGuards, UsePipes, ValidationPipe, Query, Param
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { TranslationCreatePayload, TranslationSearchPayload, TranslationUpdatePayload } from '../payloads';
import { TranslationService } from '../services';

@Controller('/translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() payload: TranslationCreatePayload
  ): Promise<DataResponse<any>> {
    const result = await this.translationService.create(payload);
    return DataResponse.ok(result);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() payload: TranslationUpdatePayload
  ) {
    await this.translationService.update(id, payload);
    const result = await this.translationService.findById(id);
    return DataResponse.ok(result);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(@Query() payload: TranslationSearchPayload) {
    const result = await this.translationService.search(payload);
    return DataResponse.ok(result);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async delete(@Param('id') id: string) {
    await this.translationService.delete(id);
    return DataResponse.ok();
  }
}
