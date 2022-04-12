import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ConfigService } from 'nestjs-config';
import {
  StringHelper, QueueEventService, QueueEvent, getConfig, EntityNotFoundException
} from 'src/kernel';
import {
  writeFileSync, unlinkSync, existsSync, createReadStream, readFileSync
} from 'fs';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { S3Service, S3StorageService } from 'src/modules/storage/services';
import { formatFileName } from 'src/kernel/helpers/multer.helper';
import { join } from 'path';
import * as jwt from 'jsonwebtoken';
import { FILE_MODEL_PROVIDER } from '../providers';
import { FileModel } from '../models';
import { IMulterUploadedFile } from '../lib/multer/multer.utils';
import { FileDto } from '../dtos';
import { IFileUploadOptions } from '../lib';
import { ImageService } from './image.service';
import { VideoFileService } from './video.service';
import { AudioFileService } from './audio.service';

const VIDEO_QUEUE_CHANNEL = 'VIDEO_PROCESS';
const AUDIO_QUEUE_CHANNEL = 'AUDIO_PROCESS';
const PHOTO_QUEUE_CHANNEL = 'PHOTO_PROCESS';

export const FILE_EVENT = {
  VIDEO_PROCESSED: 'VIDEO_PROCESSED',
  PHOTO_PROCESSED: 'PHOTO_PROCESSED',
  AUDIO_PROCESSED: 'AUDIO_PROCESSED'
};

@Injectable()
export class FileService {
  constructor(
    @Inject(forwardRef(() => S3StorageService))
    private readonly s3StorageService: S3StorageService,
    @Inject(FILE_MODEL_PROVIDER)
    private readonly fileModel: Model<FileModel>,
    private readonly imageService: ImageService,
    private readonly videoService: VideoFileService,
    private readonly audioFileService: AudioFileService,
    private readonly queueEventService: QueueEventService,
    private readonly config: ConfigService
  ) {
    this.queueEventService.subscribe(
      VIDEO_QUEUE_CHANNEL,
      'PROCESS_VIDEO',
      this._processVideo.bind(this)
    );

    this.queueEventService.subscribe(
      AUDIO_QUEUE_CHANNEL,
      'PROCESS_AUDIO',
      this._processAudio.bind(this)
    );

    this.queueEventService.subscribe(
      PHOTO_QUEUE_CHANNEL,
      'PROCESS_PHOTO',
      this._processPhoto.bind(this)
    );
  }

  public async findById(id: string | ObjectId): Promise<FileDto> {
    const model = await this.fileModel.findById(id);
    if (!model) return null;
    return new FileDto(model);
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<FileDto[]> {
    const items = await this.fileModel.find({
      _id: {
        $in: ids
      }
    });

    return items.map((i) => new FileDto(i));
  }

  public async countByRefType(itemType: string): Promise<any> {
    const count = await this.fileModel.countDocuments({
      refItems: { $elemMatch: { itemType } }
    });
    return count;
  }

  public async findByRefType(itemType: string, limit: number, offset: number): Promise<any> {
    const items = await this.fileModel.find({
      refItems: { $elemMatch: { itemType } }
    }).limit(limit).skip(offset * limit);
    return items.map((item) => new FileDto(item));
  }

  public async createFromMulter(
    type: string,
    multerData: IMulterUploadedFile,
    fileUploadOptions?: IFileUploadOptions
  ): Promise<FileDto> {
    const options = { ...fileUploadOptions } || {};
    const publicDir = this.config.get('file.publicDir');
    const photoDir = this.config.get('file.photoDir');
    const checkS3Settings = await this.s3StorageService.checkSetting();
    let absolutePath = multerData.path;
    let path = multerData.path.replace(publicDir, '');
    let { metadata = {} } = multerData;
    let server = options.server || Storage.DiskStorage;
    if (server === Storage.S3 && !checkS3Settings) {
      server = Storage.DiskStorage;
    }
    const thumbnails = [];

    if (multerData.mimetype.includes('image') && options.uploadImmediately) {
      if (options.generateThumbnail) {
        const thumbBuffer = await this.imageService.createThumbnail(
          multerData.path,
          options.thumbnailSize || { width: 500, height: 500 }
        ) as Buffer;
        const thumbName = `${StringHelper.randomString(5)}_thumb${StringHelper.getExt(multerData.path)}`;
        if (fileUploadOptions.server === Storage.S3 && checkS3Settings) {
          const [uploadThumb] = await Promise.all([
            this.s3StorageService.upload(
              thumbName,
              fileUploadOptions.acl,
              thumbBuffer,
              multerData.mimetype
            )
          ]);
          if (uploadThumb.Key && uploadThumb.Location) {
            thumbnails.push({
              thumbnailSize: options.thumbnailSize || { width: 500, height: 500 },
              path: uploadThumb.Location,
              absolutePath: uploadThumb.Key
            });
          }
        } else {
          writeFileSync(join(photoDir, thumbName), thumbBuffer);
          thumbnails.push({
            thumbnailSize: options.thumbnailSize || { width: 500, height: 500 },
            path: join(photoDir, thumbName).replace(publicDir, ''),
            absolutePath: join(photoDir, thumbName)
          });
        }
      }
      const buffer = await this.imageService.replaceWithoutExif(multerData.path);
      if (fileUploadOptions.server === Storage.S3 && checkS3Settings) {
        const upload = await this.s3StorageService.upload(
          formatFileName(multerData),
          fileUploadOptions.acl,
          buffer,
          multerData.mimetype
        );
        if (upload.Key && upload.Location) {
          absolutePath = upload.Key;
          path = upload.Location;
        }
        server = Storage.S3;
        metadata = {
          ...metadata,
          bucket: upload.Bucket,
          endpoint: S3Service.getEndpoint(upload)
        };
        // remove old file once upload s3 done
        existsSync(multerData.path) && unlinkSync(multerData.path);
      } else {
        server = Storage.DiskStorage;
        writeFileSync(multerData.path, buffer);
      }
    }
    // other file not image
    if (!multerData.mimetype.includes('image') && options.uploadImmediately) {
      const buffer = readFileSync(multerData.path);
      if (fileUploadOptions.server === Storage.S3 && checkS3Settings) {
        const upload = await this.s3StorageService.upload(
          formatFileName(multerData),
          fileUploadOptions.acl,
          buffer,
          multerData.mimetype
        );
        if (upload.Key && upload.Location) {
          absolutePath = upload.Key;
          path = upload.Location;
        }
        metadata = {
          ...metadata,
          bucket: upload.Bucket,
          endpoint: S3Service.getEndpoint(upload)
        };
        // remove old file once upload s3 done
        existsSync(multerData.path) && unlinkSync(multerData.path);
      } else {
        writeFileSync(multerData.path, buffer);
      }
    }
    const data = {
      type,
      name: multerData.filename,
      description: '',
      mimeType: multerData.mimetype,
      server,
      path: path || multerData.location,
      absolutePath: absolutePath || multerData.key || multerData.path,
      acl: multerData.acl || options.acl,
      thumbnails,
      metadata,
      size: multerData.size,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.uploader ? options.uploader._id : null,
      updatedBy: options.uploader ? options.uploader._id : null
    };

    const file = await this.fileModel.create(data);
    // TODO - check option and process
    // eg create thumbnail, video converting, etc...
    return FileDto.fromModel(file);
  }

  public async addRef(
    fileId: ObjectId,
    ref: {
      itemId: ObjectId;
      itemType: string;
    }
  ) {
    return this.fileModel.updateOne(
      { _id: fileId },
      {
        $addToSet: {
          refItems: ref
        }
      }
    );
  }

  public async remove(fileId: string | ObjectId) {
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file) {
      return false;
    }

    await file.remove();

    const filePaths = [
      {
        absolutePath: file.absolutePath,
        path: file.path
      }
    ].concat(file.thumbnails || []);

    if (file.server === Storage.S3) {
      const del = filePaths.map((fp) => ({ Key: fp.absolutePath }));
      await this.s3StorageService.deleteObjects({ Objects: del });
      return true;
    }

    filePaths.forEach((fp) => {
      if (existsSync(fp.absolutePath)) {
        unlinkSync(fp.absolutePath);
      } else {
        const publicDir = this.config.get('file.publicDir');
        const filePublic = join(publicDir, fp.path);
        existsSync(filePublic) && unlinkSync(filePublic);
      }
    });
    // TODO - fire event
    return true;
  }

  public async deleteManyByRefIds(refIds: string[] | ObjectId[]) {
    if (!refIds.length) return;
    const files = await this.fileModel.find({
      refItems: {
        $elemMatch: {
          itemId: { $in: refIds }
        }
      }
    });
    await this.fileModel.deleteMany({ _id: files.map((f) => f._id) });
    // remove files
    await Promise.all([
      files.map((file) => {
        const filePaths = [
          {
            absolutePath: file.absolutePath,
            path: file.path
          }
        ].concat(file.thumbnails || []);
        if (file.server === Storage.S3) {
          const del = filePaths.map((fp) => ({ Key: fp.absolutePath }));
          return this.s3StorageService.deleteObjects({ Objects: del });
        }
        return filePaths.map((fp) => {
          if (existsSync(fp.absolutePath)) {
            unlinkSync(fp.absolutePath);
          } else {
            const publicDir = this.config.get('file.publicDir');
            const filePublic = join(publicDir, fp.path);
            existsSync(filePublic) && unlinkSync(filePublic);
          }
          return fp;
        });
      })
    ]);
  }

  public async removeIfNotHaveRef(fileId: string | ObjectId) {
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file) {
      return false;
    }

    if (file.refItems && !file.refItems.length) {
      return false;
    }

    await file.remove();

    if (file.server === Storage.S3) {
      const del = [{ Key: file.absolutePath }];
      await this.s3StorageService.deleteObjects({ Objects: del });
      return true;
    }

    if (existsSync(file.absolutePath)) {
      unlinkSync(file.absolutePath);
    } else {
      const publicDir = this.config.get('file.publicDir');
      const filePublic = join(publicDir, file.path);
      existsSync(filePublic) && unlinkSync(filePublic);
    }

    // TODO - fire event
    return true;
  }

  // TODO - fix here, currently we just support local server, need a better solution if scale?
  /**
   * generate mp4 video & thumbnail
   * @param fileId
   * @param options
   */
  public async queueProcessVideo(
    fileId: string | ObjectId,
    options?: {
      meta?: Record<string, any>;
      publishChannel?: string;
      size?: string; // 500x500
      count?: number; // num of thumbnails
    }
  ) {
    // add queue and convert file to mp4 and generate thumbnail
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file || file.status === 'processing') {
      return false;
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: VIDEO_QUEUE_CHANNEL,
        eventName: 'processVideo',
        data: {
          file: new FileDto(file),
          options
        }
      })
    );
    return true;
  }

  private async _processVideo(event: QueueEvent) {
    if (event.eventName !== 'processVideo') {
      return;
    }
    const fileData = event.data.file as FileDto;
    const options = event.data.options || {};
    // get thumb of the file, then convert to mp4
    const publicDir = this.config.get('file.publicDir');
    const videoDir = this.config.get('file.videoDir');
    let videoPath: string;
    let { metadata = {}, server } = fileData;
    if (existsSync(fileData.absolutePath)) {
      videoPath = fileData.absolutePath;
    } else if (existsSync(join(publicDir, fileData.path))) {
      videoPath = join(publicDir, fileData.path);
    }

    try {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'processing'
          }
        }
      );

      const respVideo = await this.videoService.convert2Mp4(videoPath);
      // delete old video and replace with new one
      let newAbsolutePath = respVideo.toPath;
      let newPath = respVideo.toPath.replace(publicDir, '');

      const meta = await this.videoService.getMetaData(videoPath);
      const { width, height } = meta.streams[0];
      const respThumb = await this.videoService.createThumbs(videoPath, {
        toFolder: videoDir,
        size: options?.size || (width && height ? `${width}x${height}` : '640x360'),
        count: options?.count || 3
      });
      let thumbnails: any = [];
      // check s3 settings
      const checkS3Settings = await this.s3StorageService.checkSetting();
      if (fileData.server === Storage.S3 && checkS3Settings) {
        const video = readFileSync(respVideo.toPath);
        const result = await this.s3StorageService.upload(
          respVideo.fileName,
          fileData.acl,
          video,
          'video/mp4'
        );
        newAbsolutePath = result.Key;
        newPath = result.Location;
        // eslint-disable-next-line prefer-template
        metadata = {
          ...metadata,
          bucket: result.Bucket,
          endpoint: S3Service.getEndpoint(result)
        };
        if (respThumb.length) {
          // eslint-disable-next-line no-restricted-syntax
          for (const name of respThumb) {
            if (existsSync(join(videoDir, name))) {
              const file = readFileSync(join(videoDir, name));
              // eslint-disable-next-line no-await-in-loop
              const thumb = await this.s3StorageService.upload(
                name,
                S3ObjectCannelACL.PublicRead,
                file,
                'image/png'
              );
              thumbnails.push({
                path: thumb.Location,
                absolutePath: thumb.Key
              });
              unlinkSync(join(videoDir, name));
            }
          }
        }
      } else {
        server = Storage.DiskStorage;
        thumbnails = respThumb.map((name) => ({
          absolutePath: join(videoDir, name),
          path: join(videoDir, name).replace(publicDir, '')
        }));
      }
      existsSync(videoPath) && unlinkSync(videoPath);
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'finished',
            absolutePath: newAbsolutePath,
            path: newPath,
            thumbnails,
            duration: parseInt(meta.format.duration, 10),
            metadata,
            server,
            width,
            height
          }
        }
      );
    } catch (e) {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'error'
          }
        }
      );
      throw e;
    } finally {
      // TODO - fire event to subscriber
      if (options.publishChannel) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: options.publishChannel,
            eventName: FILE_EVENT.VIDEO_PROCESSED,
            data: {
              meta: options.meta,
              fileId: fileData._id
            }
          })
        );
      }
    }
  }

  /**
   * generate mp4 video & thumbnail
   * @param fileId
   * @param options
   */
  public async queueProcessAudio(
    fileId: string | ObjectId,
    options?: {
      meta?: Record<string, any>;
      publishChannel?: string;
    }
  ) {
    // add queue and convert file to mp4 and generate thumbnail
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file || file.status === 'processing') {
      return false;
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: AUDIO_QUEUE_CHANNEL,
        eventName: 'processAudio',
        data: {
          file: new FileDto(file),
          options
        }
      })
    );
    return true;
  }

  private async _processAudio(event: QueueEvent) {
    if (event.eventName !== 'processAudio') {
      return;
    }
    const fileData = event.data.file as FileDto;
    const options = event.data.options || {};
    const publicDir = this.config.get('file.publicDir');
    let audioPath: string;
    let { metadata = {}, server } = fileData;
    if (existsSync(fileData.absolutePath)) {
      audioPath = fileData.absolutePath;
    } else if (existsSync(join(publicDir, fileData.path))) {
      audioPath = join(publicDir, fileData.path);
    }
    try {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'processing'
          }
        }
      );

      const respAudio = await this.audioFileService.convert2Mp3(audioPath);
      // delete old audio and replace with new one
      let newAbsolutePath = respAudio.toPath;
      let newPath = respAudio.toPath.replace(publicDir, '');
      // check s3 settings
      const checkS3Settings = await this.s3StorageService.checkSetting();
      if (fileData.server === Storage.S3 && checkS3Settings) {
        const audio = readFileSync(respAudio.toPath);
        const result = await this.s3StorageService.upload(
          respAudio.fileName,
          fileData.acl,
          audio,
          'audio/mp3'
        );
        newAbsolutePath = result.Key;
        newPath = result.Location;
        // eslint-disable-next-line prefer-template
        metadata = {
          ...metadata,
          bucket: result.Bucket,
          endpoint: S3Service.getEndpoint(result)
        };
      } else {
        server = Storage.DiskStorage;
      }
      const meta = await this.videoService.getMetaData(audioPath);
      existsSync(audioPath) && unlinkSync(audioPath);

      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'finished',
            absolutePath: newAbsolutePath,
            path: newPath,
            duration: parseInt(meta.format.duration, 10),
            mimeType: 'audio/mp3',
            name: fileData.name.replace(`.${fileData.mimeType.split('audio/')[1]}`, '.mp3'),
            metadata,
            server
          }
        }
      );
    } catch (e) {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'error'
          }
        }
      );

      throw e;
    } finally {
      // TODO - fire event to subscriber
      if (options.publishChannel) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: options.publishChannel,
            eventName: FILE_EVENT.AUDIO_PROCESSED,
            data: {
              meta: options.meta,
              fileId: fileData._id
            }
          })
        );
      }
    }
  }

  /**
   * process to create photo thumbnails
   * @param fileId file item
   * @param options
   */
  public async queueProcessPhoto(
    fileId: string | ObjectId,
    options?: {
      meta?: Record<string, any>;
      publishChannel?: string;
      thumbnailSize: {
        width: number;
        height: number;
      };
    }
  ) {
    // add queue and convert file to mp4 and generate thumbnail
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file || file.status === 'processing') {
      return false;
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PHOTO_QUEUE_CHANNEL,
        eventName: 'processPhoto',
        data: {
          file: new FileDto(file),
          options
        }
      })
    );
    return true;
  }

  private async _processPhoto(event: QueueEvent) {
    if (event.eventName !== 'processPhoto') {
      return;
    }
    const fileData = event.data.file as FileDto;
    let { metadata = {}, server } = fileData;
    const options = event.data.options || {};
    try {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'processing'
          }
        }
      );

      const publicDir = this.config.get('file.publicDir');
      const photoDir = this.config.get('file.photoDir');
      let photoPath: any;
      let thumbnailAbsolutePath: string;
      let thumbnailPath: string;
      let { absolutePath } = fileData;

      if (existsSync(fileData.absolutePath)) {
        photoPath = fileData.absolutePath;
      } else if (existsSync(join(publicDir, fileData.path))) {
        photoPath = join(publicDir, fileData.path);
      }
      const meta = await this.imageService.getMetaData(photoPath);
      const thumbBuffer = await this.imageService.createThumbnail(
        photoPath,
        options.thumbnailSize || {
          width: 500,
          height: 500
        }
      ) as Buffer;

      // create a thumbnail
      const thumbName = `${StringHelper.randomString(
        5
      )}_thumb${StringHelper.getExt(fileData.name)}`;
      // check s3 settings
      const checkS3Settings = await this.s3StorageService.checkSetting();
      // upload thumb to s3
      if (fileData.server === Storage.S3 && checkS3Settings) {
        const upload = await this.s3StorageService.upload(
          thumbName,
          S3ObjectCannelACL.PublicRead,
          thumbBuffer,
          fileData.mimeType
        );
        thumbnailAbsolutePath = upload.Key;
        thumbnailPath = upload.Location;
      } else {
        thumbnailPath = join(photoDir, thumbName).replace(publicDir, '');
        thumbnailAbsolutePath = join(photoDir, thumbName);
        writeFileSync(join(photoDir, thumbName), thumbBuffer);
      }
      // upload file to s3
      if (fileData.server === Storage.S3 && checkS3Settings) {
        const buffer = await this.imageService.replaceWithoutExif(photoPath);
        const upload = await this.s3StorageService.upload(
          fileData.name,
          fileData.acl,
          buffer,
          fileData.mimeType
        );
        if (upload.Key && upload.Location) {
          absolutePath = upload.Key;
          photoPath = upload.Location;
        }
        metadata = {
          ...metadata,
          bucket: upload.Bucket,
          endpoint: S3Service.getEndpoint(upload)
        };
        // remove old file once upload s3 done
        existsSync(photoPath) && unlinkSync(photoPath);
      } else {
        const buffer = await this.imageService.replaceWithoutExif(photoPath);
        writeFileSync(photoPath, buffer);
        photoPath = photoPath.replace(publicDir, '');
        server = Storage.DiskStorage;
      }
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'finished',
            width: meta.width,
            height: meta.height,
            metadata,
            server,
            absolutePath,
            path: photoPath,
            thumbnails: [
              {
                path: thumbnailPath,
                absolutePath: thumbnailAbsolutePath
              }
            ]
          }
        }
      );
    } catch (e) {
      await this.fileModel.updateOne(
        { _id: fileData._id },
        {
          $set: {
            status: 'error'
          }
        }
      );

      throw e;
    } finally {
      // TODO - fire event to subscriber
      if (options.publishChannel) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: options.publishChannel,
            eventName: FILE_EVENT.PHOTO_PROCESSED,
            data: {
              meta: options.meta,
              fileId: fileData._id
            }
          })
        );
      }
    }
  }

  /**
   * just generate key for
   */
  private generateJwt(fileId: string | ObjectId) {
    // 3h
    const expiresIn = 60 * 60 * 3;
    return jwt.sign(
      {
        fileId
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn
      }
    );
  }

  /**
   * generate download file url with expired time check
   * @param fileId
   * @param param1
   */
  public async generateDownloadLink(fileId: string | ObjectId) {
    const newUrl = new URL('files/download', getConfig('app').baseUrl);
    newUrl.searchParams.append('key', this.generateJwt(fileId));
    return newUrl.href;
  }

  public async getStreamToDownload(key: string) {
    try {
      const decoded = jwt.verify(key, process.env.TOKEN_SECRET);
      const file = await this.fileModel.findById(decoded.fileId);
      if (!file) throw new EntityNotFoundException();
      let filePath;
      const publicDir = this.config.get('file.publicDir');
      if (existsSync(file.absolutePath)) {
        filePath = file.absolutePath;
      } else if (existsSync(join(publicDir, file.path))) {
        filePath = join(publicDir, file.path);
      } else {
        throw new EntityNotFoundException();
      }

      return {
        file,
        stream: createReadStream(filePath)
      };
    } catch (e) {
      throw new EntityNotFoundException();
    }
  }
}
