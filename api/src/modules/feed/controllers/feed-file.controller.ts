import {
  Controller,
  Injectable,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, getConfig } from 'src/kernel';
import { FileDto, FileUploaded, FileUploadInterceptor } from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { Roles } from 'src/modules/auth';
import { FeedFileService } from '../services';

@Injectable()
@Controller('feeds/performers')
export class FeedFileController {
  constructor(
    private readonly feedFileService: FeedFileService
  ) {}

  @Post('photo/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @UseInterceptors(
    FileUploadInterceptor('feed-photo', 'file', {
      destination: getConfig('file').feedProtectedDir,
      acl: S3ObjectCannelACL.AuthenticatedRead,
      server: Storage.S3
    })
  )
  async uploadImage(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validatePhoto(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('video/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @UseInterceptors(
    FileUploadInterceptor('feed-video', 'file', {
      destination: getConfig('file').feedProtectedDir,
      acl: S3ObjectCannelACL.AuthenticatedRead,
      server: Storage.S3
    })
  )
  async uploadVideo(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateTeaser(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('audio/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @UseInterceptors(
    FileUploadInterceptor('feed-audio', 'file', {
      destination: getConfig('file').feedProtectedDir,
      acl: S3ObjectCannelACL.AuthenticatedRead,
      server: Storage.S3
    })
  )
  async uploadAudio(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateAudio(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('thumbnail/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @UseInterceptors(
    FileUploadInterceptor('feed-photo', 'file', {
      destination: getConfig('file').feedDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadThumb(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateThumbnail(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('teaser/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin', 'performer')
  @UseInterceptors(
    FileUploadInterceptor('feed-video', 'file', {
      destination: getConfig('file').feedDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadTeaser(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateVideo(file);
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }
}
