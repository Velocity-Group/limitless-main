import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { GalleryModel } from '../models';

export class GalleryDto {
  _id: ObjectId;

  performerId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  processing: boolean;

  coverPhotoId: ObjectId;

  price: number;

  coverPhoto: Record<string, any>;

  performer: any;

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  isSale: boolean;

  isBookMarked: boolean;

  isSubscribed: boolean;

  isBought: boolean;

  numOfItems: number;

  stats: {
    likes: number;
    bookmarks: number;
    comments: number;
    views: number;
  };

  constructor(init: Partial<GalleryDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'type',
        'title',
        'slug',
        'description',
        'status',
        'coverPhotoId',
        'price',
        'isSale',
        'coverPhoto',
        'performer',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        'isBookMarked',
        'isSubscribed',
        'isBought',
        'stats',
        'numOfItems'
      ])
    );
  }

  static fromModel(model: GalleryModel) {
    return new GalleryDto(model);
  }
}
