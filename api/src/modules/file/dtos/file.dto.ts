import { ObjectId } from 'mongodb';
import { getConfig } from 'src/kernel';
import { isUrl } from 'src/kernel/helpers/string.helper';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { S3Service } from 'src/modules/storage/services';
import { FileModel } from '../models';

export class FileDto {
  _id?: ObjectId;

  type?: string; // video, podcast, file, etc...

  name?: string;

  description?: string;

  mimeType?: string;

  server?: string; // eg: local, aws, etc... we can create a helper to filter and get direct link

  path?: string; // path of key in local or server

  absolutePath?: string;

  width?: number; // for video, img

  height?: number; // for video, img

  duration?: number; // for video, podcast

  size?: number; // in byte

  status?: string;

  encoding?: string;

  thumbnails?: Record<string, any>[];

  refItems: any;

  acl?: string;

  metadata?: any;

  createdBy?: ObjectId;

  updatedBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(init?: Partial<FileDto>) {
    if (init) {
      this._id = init._id;
      this.type = init.type;
      this.name = init.name;
      this.description = init.description;
      this.mimeType = init.mimeType;
      this.server = init.server;
      this.path = init.path;
      this.width = init.width;
      this.height = init.height;
      this.duration = init.duration;
      this.size = init.size;
      this.encoding = init.encoding;
      this.path = init.path;
      this.absolutePath = init.absolutePath;
      this.thumbnails = init.thumbnails;
      this.refItems = init.refItems;
      this.status = init.status;
      this.acl = init.acl;
      this.metadata = init.metadata;
      this.createdBy = init.createdBy;
      this.updatedBy = init.updatedBy;
      this.createdAt = init.createdAt;
      this.updatedAt = init.updatedAt;
    }
  }

  static fromModel(file: FileModel) {
    return new FileDto(file);
  }

  public getPublicPath() {
    if (this.absolutePath) {
      return this.absolutePath.replace(getConfig('file').publicDir, '');
    }

    return this.path || '';
  }

  public getUrl(authenticated = false): string {
    if (!this.path) return '';
    if (isUrl(this.path) && this.server !== Storage.S3) {
      return this.path;
    }

    if (isUrl(this.path) && this.server === Storage.S3) {
      if (this.acl === S3ObjectCannelACL.PublicRead) {
        return this.path;
      }

      if (!authenticated || !this.metadata) {
        return this.path;
      }

      const { bucket, expires, endpoint } = this.metadata;
      return S3Service.getSignedUrl(
        {
          Bucket: bucket,
          Key: this.absolutePath,
          Expires: parseInt(expires, 10) || 60
        },
        {
          endpoint
        }
      );
    }

    return new URL(this.path, getConfig('app').baseUrl).href;
  }

  public getThumbnails(): string[] {
    if (!this.thumbnails || !this.thumbnails.length) {
      return [];
    }

    return this.thumbnails.map((t) => {
      if (isUrl(t.path)) return t.path;

      return new URL(t.path, getConfig('app').baseUrl).href;
    });
  }

  static getPublicUrl(filePath: string): string {
    if (!filePath) return '';
    if (isUrl(filePath)) return filePath;
    return new URL(filePath, getConfig('app').baseUrl).href;
  }

  public isVideo() {
    return (this.mimeType || '').toLowerCase().includes('video');
  }

  public isImage() {
    return (this.mimeType || '').toLowerCase().includes('image');
  }

  public isAudio() {
    return (this.mimeType || '').toLowerCase().includes('audio');
  }

  public toResponse() {
    const data = { ...this };
    delete data.absolutePath;
    delete data.path;
    return data;
  }
}
