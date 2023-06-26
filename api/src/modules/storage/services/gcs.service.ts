import { Injectable } from '@nestjs/common';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { join } from 'path';
import { ObjectCannedACL } from 'aws-sdk/clients/s3';
import { ConfigService } from 'nestjs-config';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import * as stream from 'stream';

export class GCSs3Service {
  static getCredentials() {
    const projectId = SettingService.getValueByKey(SETTING_KEYS.GCS_PROJECT_ID);
    const privateKeyId = SettingService.getValueByKey(SETTING_KEYS.GCS_PRIVATE_KEY_ID);
    const privateKeySecret = SettingService.getValueByKey(SETTING_KEYS.GCS_PRIVATE_KEY_SECRET);
    const clientEmail = SettingService.getValueByKey(SETTING_KEYS.GCS_CLIENT_EMAIL);
    const clientId = SettingService.getValueByKey(SETTING_KEYS.GCS_CLIENT_ID);
    const clientCertUrl = SettingService.getValueByKey(SETTING_KEYS.GCS_CLIENT_CERT_URL);
    const bucket = SettingService.getValueByKey(SETTING_KEYS.GCS_BUCKET_NAME);

    if (!projectId || !privateKeyId || !privateKeySecret || !clientEmail || !clientId || !clientCertUrl || !bucket) {
      return null;
    }
    const credentials = {
      type: 'service_account',
      project_id: projectId,
      private_key_id: privateKeyId,
      private_key: privateKeySecret,
      client_email: clientEmail,
      client_id: clientId,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: clientCertUrl,
      universe_domain: 'googleapis.com'
    };
    return { projectId, credentials, bucket };
  }

  static async getFileByName(fileName: string, acl: ObjectCannedACL) {
    const { bucket, projectId, credentials } = GCSs3Service.getCredentials();
    const storage = new Storage({
      projectId,
      credentials
    });
    const folderPath = acl === 'public-read' ? 'public' : 'protected';
    const myBucket = storage.bucket(bucket);
    const file = myBucket.file(`${folderPath}/${fileName}`);
    return { file, path: `${folderPath}/${fileName}`, bucket };
  }

  static async getSignUrl(absolutePath: string, otps?: GetSignedUrlConfig) {
    const { bucket, projectId, credentials } = GCSs3Service.getCredentials();
    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      ...otps
    } as any;
    const storage = new Storage({
      projectId,
      credentials
    });
    const [url] = await storage
      .bucket(bucket)
      .file(absolutePath)
      .getSignedUrl(options);

    return url;
  }
}

@Injectable()
export class GCSstorageService {
  constructor(
    private readonly config: ConfigService
  ) { }

  public async uploadFromPath(fileName: string, filePath: string, acl: ObjectCannedACL) {
    const { bucket, projectId, credentials } = GCSs3Service.getCredentials();
    const storage = new Storage({
      projectId,
      credentials
    });

    let folderPath = 'public';
    let isPublic = true;
    let isPrivate = false;
    if (acl !== 'public-read') {
      folderPath = 'protected';
      isPublic = false;
      isPrivate = true;
    }
    // Get a reference to the bucket
    const destFileName = join(folderPath, fileName);

    const options = {
      destination: destFileName,
      public: isPublic,
      private: isPrivate,
      metadata: {
        bucket,
        expires: this.config.get('s3.expires').toString()
      }
    } as any;

    return storage.bucket(bucket).upload(filePath, options);
  }

  public async uploadFromBuffer(fileName: string, acl: ObjectCannedACL, buffer: Buffer) {
    const { bucket, projectId, credentials } = GCSs3Service.getCredentials();
    const storage = new Storage({
      projectId,
      credentials
    });

    let folderPath = 'public';
    let isPublic = true;
    let isPrivate = false;
    if (acl !== 'public-read') {
      folderPath = 'protected';
      isPublic = false;
      isPrivate = true;
    }
    // Get a reference to the bucket
    const destFileName = join(folderPath, fileName);
    const myBucket = storage.bucket(bucket);
    const file = myBucket.file(destFileName);

    const options = {
      destination: destFileName,
      public: isPublic,
      private: isPrivate
    } as any;
    return file.save(buffer, options);
  }

  public async streamFileUpload(fileName: string, acl: ObjectCannedACL, buffer: Buffer) {
    const { bucket, projectId, credentials } = GCSs3Service.getCredentials();
    const storage = new Storage({
      projectId,
      credentials
    });

    let folderPath = 'public';
    let isPublic = true;
    let isPrivate = false;
    if (acl !== 'public-read') {
      folderPath = 'protected';
      isPublic = false;
      isPrivate = true;
    }
    // Get a reference to the bucket
    const destFileName = join(folderPath, fileName);
    const myBucket = storage.bucket(bucket);
    const file = myBucket.file(destFileName);

    const options = {
      destination: destFileName,
      public: isPublic,
      private: isPrivate
    } as any;

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(buffer);
    passthroughStream.end();
    passthroughStream.pipe(file.createWriteStream({
      ...options
    }));
    return passthroughStream;
  }

  public async deleteObject(absolutePath: string) {
    const { bucket, projectId, credentials } = GCSs3Service.getCredentials();
    const storage = new Storage({
      projectId,
      credentials
    });
    const deleteOptions = {
      ifGenerationMatch: 0
    };
    return storage.bucket(bucket).file(absolutePath).delete(deleteOptions);
  }
}
