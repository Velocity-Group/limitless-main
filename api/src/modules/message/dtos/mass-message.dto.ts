import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class MassMessageDto {
  _id: ObjectId;

  text: string;

  senderId: ObjectId;

  status: string;

  scheduledAt: Date;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<MassMessageDto>) {
    Object.assign(this, pick(data, [
      '_id',
      'text',
      'senderId',
      'status',
      'scheduledAt',
      'createdAt',
      'updatedAt'
    ]));
  }
}
