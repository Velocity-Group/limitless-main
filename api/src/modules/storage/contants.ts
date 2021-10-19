/* eslint-disable no-shadow */
export enum Storage {
  DiskStorage = 'diskStorage',
  MemoryStorage = 'memoryStorage',
  S3 = 's3'
}

export enum S3ObjectCannelACL {
  PublicRead = 'public-read',
  AuthenticatedRead = 'authenticated-read'
}
