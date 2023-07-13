import { IFile } from './file';
import { IUser } from './user';

export interface IConversation {
  _id: string;

  type: string;

  name: string;

  recipients: any;

  lastMessage: string;

  lastSenderId: string;

  lastMessageCreatedAt: Date;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  recipientInfo: IUser;

  totalNotSeenMessages: number;

  isSubscribed: boolean;

  isBlocked: boolean;
}

export interface IMessage {
  _id: string;

  conversationId: string;

  type: string;

  fileId: string;

  fileIds: string[];

  files: IFile[];

  localFiles: [];

  isBought: boolean;

  text: string;

  senderId: string;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  senderInfo: IUser

  isSale: boolean;

  price: number;

  isDeleted: boolean;
}
