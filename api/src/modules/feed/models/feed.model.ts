import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class FeedModel extends Document {
  _id: ObjectId;

  type: string;

  fromSourceId: ObjectId | string;

  fromSource: string;

  title: string;

  slug: string;

  text: string;

  pollDescription: string;

  fileIds: Array<string | ObjectId>;

  pollIds: Array<string | ObjectId>;

  totalLike: number;

  totalComment: number;

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

  targetId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
