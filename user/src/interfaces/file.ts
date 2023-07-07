export interface IFile {
  _id: string;

  type: string; // video, podcast, file, etc...

  name: string;

  description: string;

  mimeType: string;

  server: string; // eg: local, aws, etc... we can create a helper to filter and get direct link

  path: string; // path of key in local or server

  absolutePath: string;

  width: number; // for video, img

  height: number; // for video, img

  duration: number; // for video, podcast

  size: number; // in byte

  status: string;

  encoding: string;

  thumbnails: string[];

  url: string;

  refItems: any;

  acl: string;

  metadata: any;

  createdBy: string;

  updatedBy: string;

  createdAt: Date;

  updatedAt: Date;

  transcodingId: string;
}
