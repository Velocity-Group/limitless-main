import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ReactionDto {
  _id?: ObjectId;

  source?: string;

  action?: string;

  objectId?: ObjectId;

  objectInfo?: any;

  objectType?: string;

  createdBy?: string | ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  creator?: any;

  constructor(data?: Partial<ReactionDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'source',
        'action',
        'objectId',
        'objectInfo',
        'objectType',
        'createdBy',
        'creator',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}
