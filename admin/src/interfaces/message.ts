export interface IMessage {
  _id: string;

  conversationId: string;

  type: string;

  fileIds: string[];

  text: string;

  senderId: string;

  senderInfo: any;

  recipientInfo: any;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  files?: any[];

  isSale?: boolean;

  price?: number;

  isBought?: boolean;

  isDeleted?: boolean;
}
