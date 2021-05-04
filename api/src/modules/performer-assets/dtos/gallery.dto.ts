import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { GalleryModel } from '../models';

export class GalleryDto {
  _id: ObjectId;

  performerId: ObjectId;

  type: string;

  title: string;

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

  isGallery = true;

  constructor(init: Partial<GalleryDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'type',
        'title',
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
        'isGallery'
      ])
    );
  }

  static fromModel(model: GalleryModel) {
    return new GalleryDto(model);
  }
}
