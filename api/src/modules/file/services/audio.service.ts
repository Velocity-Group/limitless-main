import * as ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { StringHelper } from 'src/kernel';
import { ConvertMp3ErrorException } from '../exceptions';
import { IConvertOptions, IConvertResponse } from './video.service';

export class AudioFileService {
  public async convert2Mp3(
    filePath: string,
    options = {} as IConvertOptions
  ): Promise<IConvertResponse> {
    try {
      const fileName = `${StringHelper.randomString(5)}_${StringHelper.getFileName(filePath, true)}.mp3`;
      const toPath = options.toPath || join(StringHelper.getFilePath(filePath), fileName);

      return new Promise((resolve, reject) => {
        // eslint-disable-next-line new-cap
        const command = new ffmpeg(filePath)
          // set target codec
          .audioCodec('libmp3lame')
          // .addOption('-vf', 'scale=2*trunc(iw/2):-2')
          .outputOptions('-strict -2')
          .on('end', () => resolve({
            fileName,
            toPath
          }))
          .on('error', reject)
          .toFormat('mp3');

        if (options.size) {
          command.size(options.size);
        }
        // save to file
        command.save(toPath);
      });
    } catch (e) {
      throw new ConvertMp3ErrorException(e);
    }
  }
}
