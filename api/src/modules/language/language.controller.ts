import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  HttpException
} from '@nestjs/common';
import { DataResponse, PageableData, getConfig } from 'src/kernel';
import { MultiFileUploadInterceptor, FilesUploaded } from 'src/modules/file';
import { Storage } from 'src/modules/storage/contants';
import { FileService } from 'src/modules/file/services';
import { Roles } from '../auth';
import { RoleGuard } from '../auth/guards';
import { LanguageDto } from './dtos';
import { LanguageService } from './language.service';
import {
  LanguageSettingPayload,
  LanguageSettingSearchPayload
} from './payloads';

@Controller('languages')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly fileService: FileService
  ) { }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async create(
    @Body() payload: LanguageSettingPayload
  ): Promise<DataResponse<LanguageDto>> {
    const result = await this.languageService.create(payload);
    return DataResponse.ok(result);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async search(
    @Query() payload: LanguageSettingSearchPayload
  ): Promise<DataResponse<PageableData<LanguageDto>>> {
    const results = await this.languageService.search(payload);
    return DataResponse.ok(results);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id') id: string,
    @Body() payload: LanguageSettingPayload
  ): Promise<DataResponse<LanguageDto>> {
    const result = await this.languageService.update(id, payload);
    return DataResponse.ok(result);
  }

  @Delete('/reset-locale')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async resetToUSLocale() {
    await this.languageService.resetToUSLocale();
    return DataResponse.ok({ success: true });
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async delete(@Param('id') id: string) {
    await this.languageService.delete(id);
    return DataResponse.ok({ success: true });
  }

  @Post('/generate')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateLanguage(
    @Body() payload: any
  ) {
    const result = await this.languageService.generateLanguage(payload);

    return DataResponse.ok(result);
  }

  @Get('/:locale/csv')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async downloadCsv(
    @Param('locale') locale: string,
    @Res() res: any
  ) {
    const csv = await this.languageService.generateCsvJson(locale);
    res.setHeader('Content-disposition', `attachment; filename=${locale}.csv`);
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  }

  @Post('/:locale/csv/import')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor([
      {
        type: 'csv',
        fieldName: 'csv',
        options: {
          destination: getConfig('file').settingDir,
          server: Storage.DiskStorage
        }
      }
    ])
  )
  async importCsv(
    @Param('locale') locale: string,
    @FilesUploaded() files: Record<string, any>
  ) {
    if (!files.csv) throw new HttpException('Missing csv file', 400);

    await this.languageService.importLanguageCsvFile(locale, files.csv.absolutePath);
    await this.fileService.remove(files.csv._id);
    return DataResponse.ok(true);
  }
}
