import {
  Injectable
} from '@nestjs/common';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { InvalidFeedTypeException } from '../exceptions';

@Injectable()
export class FeedFileService {
  constructor(
    private readonly fileService: FileService
  ) { }

  public async validatePhoto(photo: FileDto): Promise<any> {
    if (!photo.isImage()) {
      await this.fileService.remove(photo._id);
      throw new InvalidFeedTypeException('Invalid photo file!');
    }
    await this.fileService.queueProcessPhoto(photo._id, {
      thumbnailSize: { // for blur image
        width: 500,
        height: 500
      }
    });

    return true;
  }

  public async validateVideo(video: FileDto): Promise<any> {
    if (!video.isVideo()) {
      await this.fileService.remove(video._id);

      throw new InvalidFeedTypeException('Invalid video file!');
    }

    await this.fileService.queueProcessVideo(video._id, {});
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
