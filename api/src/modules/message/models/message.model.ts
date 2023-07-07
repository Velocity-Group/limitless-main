import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class MessageModel extends Document {
  conversationId: ObjectId;

  type: string;

  fileIds: ObjectId[];

  text: string;

  senderSource: string;

  senderId: ObjectId;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  isSale: boolean;

  price: number;
}
