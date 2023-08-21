import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class FeedModel extends Document {
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

  totalBookmark: number;

  totalLike: number;

  totalComment: number;

  totalViews: number;

  isSale: boolean;

  price: number;

  orientation: string;

  teaserId: ObjectId;

  thumbnailId: ObjectId;

  isPinned: boolean;

  status: string;

  isSchedule: boolean;

  scheduleAt: Date;

  pinnedAt: Date;

  createdAt: Date;

  updatedAt: Date;
}
