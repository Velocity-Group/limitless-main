import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class GalleryModel extends Document {
  performerId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  coverPhotoId: ObjectId;

  price: number;

  isSale: boolean;

  numOfItems: number;

  stats: {
    likes: number;
    bookmarks: number;
    comments: number;
    views: number;
  };

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
