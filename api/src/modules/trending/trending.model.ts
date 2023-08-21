import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class TrendingModel extends Document {
  source: string;

  sourceId: ObjectId;

  performerId: ObjectId;

  totalViews: number;

  totalFavorites: number;

  totalLikes: number;

  totalBookmarks: number;

  createdAt: Date;

  updatedAt: Date;
}
