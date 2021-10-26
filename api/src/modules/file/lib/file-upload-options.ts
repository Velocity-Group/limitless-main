import { ObjectId } from 'mongodb';
import { PerformerDto } from 'src/modules/performer/dtos';

export interface IFileUploadOptions {
  uploader?: PerformerDto;
  convertMp4?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: {
    width: number;
    height: number;
  },
  replaceWithThumbail?: boolean;
  refItem?: {
    itemId: ObjectId;
    itemType: string;
  };
  fileName?: string;
  destination?: string;
  server?: string;
  replaceWithoutExif?: boolean;
  createThumbs?: boolean;
}
