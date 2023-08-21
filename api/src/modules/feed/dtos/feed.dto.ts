import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { IPerformerResponse } from 'src/modules/performer/dtos';

export class FeedDto {
  _id: ObjectId;

  type: string;

  fromSourceId: ObjectId;

  fromSource: string;

  title: string;

  slug: string;

  text: string;

  pollDescription: string;

  fileIds: Array<ObjectId>;

  pollIds: Array<ObjectId>;

  pollExpiredAt: Date;

  totalBookmark: number;

  totalLike: number;

  totalComment: number;

  totalViews: number;

  createdAt: Date;

  updatedAt: Date;

  isLiked: boolean;

  isSubscribed: boolean;

  isBought: boolean;

  performer: IPerformerResponse;

  files?: any;

  polls?: any;

  isSale: boolean;

  price: number;

  isBookMarked: boolean;

  orientation: string;

  teaserId: ObjectId;

  teaser?: any;

  thumbnailId: ObjectId;

  thumbnail: any;

  isPinned: boolean;

  pinnedAt: Date;

  status: string;

  isSchedule: boolean;

  scheduleAt: Date;

  isFollowed: boolean;

  constructor(data: Partial<FeedDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'type',
        'fromSourceId',
        'fromSource',
        'title',
        'slug',
        'text',
        'pollDescription',
        'fileIds',
        'pollIds',
        'totalBookmark',
        'totalLike',
        'totalComment',
        'totalViews',
        'createdAt',
        'updatedAt',
        'isLiked',
        'isBookMarked',
        'performer',
        'files',
        'polls',
        'isSale',
        'price',
        'isSubscribed',
        'isBought',
        'pollExpiredAt',
        'orientation',
        'teaserId',
        'teaser',
        'thumbnailId',
        'thumbnail',
        'isPinned',
        'pinnedAt',
        'status',
        'isSchedule',
        'scheduleAt',
        'isFollowed'
      ])
    );
  }
}
