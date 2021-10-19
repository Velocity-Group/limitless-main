import {
  HttpCode,
  HttpStatus,
  Controller,
  Injectable,
  UseGuards,
  Post,
  UseInterceptors
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, getConfig } from 'src/kernel';
import { FileUploadInterceptor, FileUploaded, FileDto } from 'src/modules/file';
import { Roles } from 'src/modules/auth';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';

@Injectable()
@Controller('admin/settings/files')
export class SettingFileUploadController {
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UseInterceptors(
    FileUploadInterceptor('setting', 'file', {
      destination: getConfig('file').settingDir,
      uploadImmediately: true,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadFile(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }
}
