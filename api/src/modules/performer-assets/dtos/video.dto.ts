import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class VideoDto {
  _id: ObjectId;

  performerId: ObjectId;

  fileId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  tags: string[];

  processing: boolean;

  thumbnailId: ObjectId;

  teaserId: ObjectId;

  isSale: boolean;

  price: number;

  thumbnail: string;

  teaser: any;

  teaserStatus: string;

  video: any;

  performer: any;

  stats: {
    views: number;
    likes: number;
    comments: number;
    bookmarks: number;
  };

  userReaction: {
    liked: boolean;
    bookmarked: boolean;
  };

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  participantIds: string[];

  participants: any[];

  tagline: string;

  isBought: boolean;

  constructor(init: Partial<VideoDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'fileId',
        'type',
        'title',
        'slug',
        'description',
        'status',
        'processing',
        'thumbnailId',
        'teaserId',
        'isSchedule',
        'isSale',
        'price',
        'video',
        'thumbnail',
        'teaser',
        'teaserStatus',
        'performer',
        'tags',
        'stats',
        'userReaction',
        'createdBy',
        'updatedBy',
        'scheduledAt',
        'createdAt',
        'updatedAt',
        'participantIds',
        'participants',
        'tagline',
        'isBought'
      ])
    );
  }
}

export class IVideoResponse {
  _id: ObjectId;

  performerId: ObjectId;

  fileId: ObjectId;

  type: string;

  title: string;

  slug: string;

  description: string;

  status: string;

  tags: string[];

  processing: boolean;

  thumbnailId: ObjectId;

  teaserId: ObjectId;

  isSale: boolean;

  price: number;

  thumbnail: string;

  video: any;

  teaser: any;

  teaserStatus: any;

  performer: any;

  stats: {
    views: number;
    likes: number;
    comments: number;
    bookmarks: number;
  };

  userReaction: {
    liked: boolean;
    bookmarked: boolean;
  };

  isBought: boolean;

  isSubscribed: boolean;

  createdBy: ObjectId;

  updatedBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  participantIds: string[];

  participants: any[];

  tagline: string;

  constructor(init: Partial<IVideoResponse>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'fileId',
        'type',
        'title',
        'description',
        'status',
        'processing',
        'thumbnailId',
        'teaserId',
        'isSchedule',
        'isSale',
        'price',
        'video',
        'thumbnail',
        'teaser',
        'teaserStatus',
        'performer',
        'tags',
        'stats',
        'userReaction',
        'isBought',
        'isSubscribed',
        'createdBy',
        'updatedBy',
        'scheduledAt',
        'createdAt',
        'updatedAt',
        'participantIds',
        'participants'
      ])
    );
  }
}
