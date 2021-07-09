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
      replaceWithoutExif: true
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
      convertMp4: true
    })
  )
  async uploadVideo(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validateVideo(file);

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
      destination: getConfig('file').feedProtectedDir
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
      replaceWithThumbail: false,
      generateThumbnail: true,
      thumbnailSize: {
        width: 900,
        height: 300
      }
    })
  )
  async uploadThumb(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    await this.feedFileService.validatePhoto(file);

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
      convertMp4: true
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
