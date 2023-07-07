import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class MessageDto {
  _id: ObjectId;

  conversationId: ObjectId;

  type: string;

  fileIds: ObjectId[];

  files: any;

  text: string;

  senderId: ObjectId;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  senderInfo: any;

  isSale: boolean;

  price: number;

  isBought: boolean;

  constructor(data?: Partial<MessageDto>) {
    Object.assign(this, pick(data, [
      '_id',
      'conversationId',
      'type',
      'fileIds',
      'files',
      'senderInfo',
      'text',
      'senderId',
      'meta',
      'createdAt',
      'updatedAt',
      'isSale',
      'price',
      'isBought'
    ]));
  }
}
