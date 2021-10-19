import * as AWS from 'aws-sdk';
import { ObjectCannedACL } from 'aws-sdk/clients/s3';

export type S3 = AWS.S3;

export interface S3ServiceConfigurationOptions
  extends AWS.S3.ClientConfiguration {
  endpoint?: string | AWS.Endpoint;
  params?: {
    Bucket?: string;
    [key: string]: any;
  };
}

export interface MulterS3Options {
  s3?: S3;
  acl: ObjectCannedACL;
  uploadDir?: string;
  fileName?: string;
}

export interface MultiUploadMulterS3Options {
  s3?: S3;
  acls: Record<string, ObjectCannedACL>
}
