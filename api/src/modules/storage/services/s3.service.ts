import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { QueueEvent, QueueEventService, MulterHelper } from 'src/kernel';
import { SettingDto, SettingService } from 'src/modules/settings';
import { SETTING_CHANNEL, SETTING_KEYS } from 'src/modules/settings/constants';
import * as multerS3 from 'multer-s3';
import { StorageEngine } from 'multer';
import { join } from 'path';
import { Body, ObjectCannedACL, Delete } from 'aws-sdk/clients/s3';
import { ConfigService } from 'nestjs-config';
import {
  MulterS3Options,
  MultiUploadMulterS3Options,
  S3ServiceConfigurationOptions
} from '../interfaces';
import { S3ObjectCannelACL } from '../contants';

export class S3Service {
  static listObjects(
    params: AWS.S3.ListObjectsRequest,
    options?: S3ServiceConfigurationOptions
  ) {
    const s3 = new AWS.S3(options);
    return s3.listObjects(params).promise();
  }

  static getObject(
    params: AWS.S3.GetObjectRequest,
    options?: S3ServiceConfigurationOptions
  ) {
    const s3 = new AWS.S3(options);
    return s3.getObject(params).promise();
  }

  static createReadStream(
    params: AWS.S3.GetObjectRequest,
    options?: S3ServiceConfigurationOptions
  ) {
    const s3 = new AWS.S3(options);
    return s3.getObject(params).createReadStream();
  }

  static deleteObject(
    params: AWS.S3.DeleteObjectRequest,
    options?: S3ServiceConfigurationOptions
  ) {
    const s3 = new AWS.S3(options);
    return s3.deleteObject(params).promise();
  }

  static deleteObjects(
    params: AWS.S3.DeleteObjectsRequest,
    options?: S3ServiceConfigurationOptions
  ) {
    const s3 = new AWS.S3(options);
    return s3.deleteObjects(params).promise();
  }

  static getSignedUrlPromise(
    params: any,
    options?: S3ServiceConfigurationOptions,
    operation = 'getObject'
  ): Promise<string> {
    const s3 = new AWS.S3(options);
    return s3.getSignedUrlPromise(operation, params);
  }

  static getSignedUrl(
    params: any,
    options?: S3ServiceConfigurationOptions,
    operation = 'getObject'
  ): string {
    const s3 = new AWS.S3(options);
    const signedUrl = s3.getSignedUrl(operation, params);
    return signedUrl;
  }

  static upload(
    params: AWS.S3.PutObjectRequest,
    configurationOption?: S3ServiceConfigurationOptions,
    uploadOptions?: AWS.S3.ManagedUpload.ManagedUploadOptions
  ) {
    const s3 = new AWS.S3(configurationOption);
    return s3.upload(params, uploadOptions).promise();
  }

  static getEndpoint(upload: AWS.S3.ManagedUpload.SendData): string {
    // eslint-disable-next-line prefer-template
    const regex = new RegExp(upload.Bucket + '[a-z0-9.-]+', 'g');
    const path = upload.Location.match(regex)[0];
    // eslint-disable-next-line prefer-template
    return path.replace(upload.Bucket + '.', '');
  }
}

@Injectable()
export class S3ConfigurationService {
  public static s3ConfigurationOptions: S3ServiceConfigurationOptions = {
    params: {}
  };

  private Bucket: string;

  constructor(
    private readonly settingService: SettingService,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      SETTING_CHANNEL,
      'HANDLE_S3_SETTINGS_CHANGE',
      this.subscribeChange.bind(this)
    );
    this.update();
  }

  private async subscribeChange(event: QueueEvent) {
    const { value, key } = event.data as SettingDto;
    const options = S3ConfigurationService.s3ConfigurationOptions;
    switch (key) {
      case SETTING_KEYS.AWS_S3_ACCESS_KEY_ID:
        AWS.config.update({ accessKeyId: value });
        this.setCredential({ ...options, accessKeyId: value });
        break;
      case SETTING_KEYS.AWS_S3_SECRET_ACCESS_KEY:
        AWS.config.update({ secretAccessKey: value });
        this.setCredential({ ...options, secretAccessKey: value });
        break;
      case SETTING_KEYS.AWS_S3_BUCKET_ENDPOINT:
        S3ConfigurationService.s3ConfigurationOptions.endpoint = value;
        this.setCredential({ ...options, endpoint: value });
        break;
      case SETTING_KEYS.AWS_S3_BUCKET_NAME:
        S3ConfigurationService.s3ConfigurationOptions.params.Bucket = value;
        this.setBucket(value);
        break;
      case SETTING_KEYS.AWS_S3_REGION_NAME:
        AWS.config.update({ region: value });
        this.setCredential({ ...options, region: value });
        break;
      default:
        break;
    }
  }

  private setCredential(options: S3ServiceConfigurationOptions) {
    S3ConfigurationService.s3ConfigurationOptions = options;
  }

  public getCredential(): S3ServiceConfigurationOptions {
    return S3ConfigurationService.s3ConfigurationOptions;
  }

  private setBucket(Bucket: string) {
    this.Bucket = Bucket;
  }

  public getBucket(): string {
    return this.Bucket;
  }

  public async update() {
    const [
      accessKeyId,
      secretAccessKey,
      region,
      endpoint,
      Bucket
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_ACCESS_KEY_ID),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_SECRET_ACCESS_KEY),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_REGION_NAME),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_BUCKET_ENDPOINT),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_BUCKET_NAME)
    ]);

    const options = {
      signatureVersion: 'v4',
      accessKeyId,
      secretAccessKey,
      region,
      endpoint
    };
    AWS.config.update(options);
    this.setBucket(Bucket);
    this.setCredential(options);
  }

  public async checkSetting() {
    const [
      enabled,
      accessKeyId,
      secretAccessKey,
      region,
      endpoint,
      bucket
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_ENABLE),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_ACCESS_KEY_ID),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_SECRET_ACCESS_KEY),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_REGION_NAME),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_BUCKET_ENDPOINT),
      this.settingService.getKeyValue(SETTING_KEYS.AWS_S3_BUCKET_NAME)
    ]);
    if (!enabled || !accessKeyId || !secretAccessKey || !region || !endpoint || !bucket) {
      return false;
    }
    return true;
  }
}

@Injectable()
export class S3StorageService {
  constructor(
    private readonly s3ConfigurationService: S3ConfigurationService,
    private readonly config: ConfigService
  ) {}

  public checkSetting() {
    return this.s3ConfigurationService.checkSetting();
  }

  public createMulterS3Storage(options: MulterS3Options): StorageEngine {
    const credential = this.s3ConfigurationService.getCredential();
    const bucket = this.s3ConfigurationService.getBucket();
    const s3 = new AWS.S3(credential);
    const { acl, fileName } = options;
    const { config: { endpoint, region } } = s3;
    const folderPath = acl === S3ObjectCannelACL.PublicRead ? 'public' : 'protected';
    return multerS3({
      s3,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => cb(null, {
        ...file,
        bucket: bucket || process.env.AWS_S3_BUCKET_NAME,
        endpoint,
        region,
        expires: this.config.get('s3.expires').toString()
      }),
      bucket: (req, file, cb) => cb(null, bucket || process.env.AWS_S3_BUCKET_NAME),
      key: (req, file, cb) => {
        if (fileName) {
          return cb(null, join(folderPath, fileName));
        }

        return cb(null, join(folderPath, MulterHelper.formatFileName(file)));
      },
      acl: (req, file, cb) => cb(null, acl)
    });
  }

  public createMultiUploadMulterS3Storage(
    options: MultiUploadMulterS3Options
  ): StorageEngine {
    const credential = this.s3ConfigurationService.getCredential();
    const bucket = this.s3ConfigurationService.getBucket();
    const s3 = new AWS.S3(credential);
    const { acls } = options;
    const { config: { endpoint, region } } = s3;
    return multerS3({
      s3,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => cb(null, {
        ...file,
        bucket: bucket || process.env.AWS_S3_BUCKET_NAME,
        endpoint,
        region,
        expires: this.config.get('s3.expires').toString()
      }),
      bucket: (req, file, cb) => cb(null, bucket || process.env.AWS_S3_BUCKET_NAME),
      key: (req, file, cb) => {
        const folderPath = acls[file.fieldname] === S3ObjectCannelACL.PublicRead
          ? 'public'
          : 'protected';
        return cb(null, join(folderPath, MulterHelper.formatFileName(file)));
      },
      acl: (req, file, cb) => cb(null, acls[file.fieldname] || S3ObjectCannelACL.PublicRead)
    });
  }

  upload(Key: string, ACL: ObjectCannedACL, file: Body, mimeType: string) {
    const credential = this.s3ConfigurationService.getCredential();
    const Bucket = this.s3ConfigurationService.getBucket();
    const folderPath = ACL === 'public-read' ? 'public' : 'protected';
    const { endpoint, region } = credential;
    return S3Service.upload(
      {
        Bucket,
        Key: join(folderPath, Key),
        ACL,
        Body: file,
        ContentType: mimeType,
        Metadata: {
          mimeType,
          endpoint: endpoint.toString(),
          region,
          bucket: Bucket,
          expires: this.config.get('s3.expires').toString()
        }
      },
      credential
    );
  }

  getObject(Key: string) {
    const credential = this.s3ConfigurationService.getCredential();
    const Bucket = this.s3ConfigurationService.getBucket();
    return S3Service.getObject({ Bucket, Key }, credential);
  }

  deleteObjects(del: Delete) {
    const credential = this.s3ConfigurationService.getCredential();
    const Bucket = this.s3ConfigurationService.getBucket();
    return S3Service.deleteObjects({ Bucket, Delete: del }, credential);
  }
}
