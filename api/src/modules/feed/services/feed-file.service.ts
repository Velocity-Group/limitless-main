import {
  Injectable
} from '@nestjs/common';
import {
  getConfig
} from 'src/kernel';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { InvalidFeedTypeException } from '../exceptions';

@Injectable()
export class FeedFileService {
  constructor(
    private readonly fileService: FileService
  ) { }

  public async validateThumbnail(photo: FileDto): Promise<any> {
    if (!photo.isImage()) {
      await this.fileService.remove(photo._id);
      throw new InvalidFeedTypeException('Invalid photo file!');
    }
    await this.fileService.queueProcessPhoto(photo._id, {
      thumbnailSize: getConfig('image').blurThumbnail
    });
    return true;
  }

  public async validateTeaser(video: FileDto): Promise<any> {
    if (!video.isVideo()) {
      await this.fileService.remove(video._id);
      throw new InvalidFeedTypeException('Invalid video file!');
    }
    await this.fileService.queueProcessVideo(video._id, {
      size: '640x480',
      count: 1
    });
    return true;
  }

  public async validatePhoto(photo: FileDto): Promise<any> {
    if (!photo.isImage()) {
      await this.fileService.remove(photo._id);
      throw new InvalidFeedTypeException('Invalid photo file!');
    }
    await this.fileService.queueProcessPhoto(photo._id, {
      thumbnailSize: getConfig('image').blurThumbnail
    });
    return true;
  }

  public async validateVideo(video: FileDto): Promise<any> {
    if (!video.isVideo()) {
      await this.fileService.remove(video._id);
      throw new InvalidFeedTypeException('Invalid video file!');
    }
    await this.fileService.queueProcessVideo(video._id, {
      size: '65x65',
      count: 1
    });
    return true;
  }

  public async validateAudio(audio: FileDto): Promise<any> {
    if (!audio.isAudio()) {
      await this.fileService.remove(audio._id);
      throw new InvalidFeedTypeException('Invalid audio file!');
    }
    await this.fileService.queueProcessAudio(audio._id, {});
    return true;
  }
}
