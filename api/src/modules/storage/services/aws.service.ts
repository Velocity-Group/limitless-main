import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { SettingDto, SettingService } from 'src/modules/settings';
import { SETTING_CHANNEL, SETTING_KEYS } from 'src/modules/settings/constants';
import { join } from 'path';
import { Body, ObjectCannedACL, Delete } from 'aws-sdk/clients/s3';
import { ConfigService } from 'nestjs-config';
import {
  S3ServiceConfigurationOptions
} from '../interfaces';

export class AwsS3Service {
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

  static checkSetting() {
    const accessKeyId = SettingService.getValueByKey(SETTING_KEYS.AWS_S3_ACCESS_KEY_ID);
    const secretAccessKey = SettingService.getValueByKey(SETTING_KEYS.AWS_S3_SECRET_ACCESS_KEY);
    const region = SettingService.getValueByKey(SETTING_KEYS.AWS_S3_REGION_NAME);
    const endpoint = SettingService.getValueByKey(SETTING_KEYS.AWS_S3_BUCKET_ENDPOINT);
    const bucket = SettingService.getValueByKey(SETTING_KEYS.AWS_S3_BUCKET_NAME);
    if (!accessKeyId || !secretAccessKey || !region || !endpoint || !bucket) {
      return false;
    }
    return true;
  }
}

@Injectable()
export class AwsS3ConfigurationService {
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
    const options = AwsS3ConfigurationService.s3ConfigurationOptions;
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
        AwsS3ConfigurationService.s3ConfigurationOptions.endpoint = value;
        this.setCredential({ ...options, endpoint: value });
        break;
      case SETTING_KEYS.AWS_S3_BUCKET_NAME:
        AwsS3ConfigurationService.s3ConfigurationOptions.params.Bucket = value;
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
    AwsS3ConfigurationService.s3ConfigurationOptions = options;
  }

  public getCredential(): S3ServiceConfigurationOptions {
    return AwsS3ConfigurationService.s3ConfigurationOptions;
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
}

@Injectable()
export class AwsS3storageService {
  constructor(
    private readonly awsS3ConfigurationService: AwsS3ConfigurationService,
    private readonly config: ConfigService
  ) {}

  upload(Key: string, ACL: ObjectCannedACL, file: Body, mimeType: string) {
    const credential = this.awsS3ConfigurationService.getCredential();
    const Bucket = this.awsS3ConfigurationService.getBucket();
    const folderPath = ACL === 'public-read' ? 'public' : 'protected';
    const { endpoint, region } = credential;
    return AwsS3Service.upload(
      {
        Bucket,
        Key: join(folderPath, Key),
        ACL,
        Body: file,
        ContentType: mimeType,
        Metadata: {
          mimeType,
          s3: 'aws',
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
    const credential = this.awsS3ConfigurationService.getCredential();
    const Bucket = this.awsS3ConfigurationService.getBucket();
    return AwsS3Service.getObject({ Bucket, Key }, credential);
  }

  deleteObjects(del: Delete) {
    const credential = this.awsS3ConfigurationService.getCredential();
    const Bucket = this.awsS3ConfigurationService.getBucket();
    return AwsS3Service.deleteObjects({ Bucket, Delete: del }, credential);
  }
}
