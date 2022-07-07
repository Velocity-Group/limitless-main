import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class FollowModel extends Document {
  followerId: ObjectId;

  followingId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
