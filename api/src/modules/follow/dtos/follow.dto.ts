import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { IPerformerResponse } from 'src/modules/performer/dtos';
import { IUserResponse } from 'src/modules/user/dtos';

export class FollowDto {
  _id: ObjectId;

  followerId: ObjectId;

  followingId: ObjectId;

  followerInfo: IUserResponse;

  followingInfo: IPerformerResponse;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<FollowDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'followerId',
        'followingId',
        'followerInfo',
        'followingInfo',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}
