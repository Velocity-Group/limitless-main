import { Schema } from 'mongoose';

export const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  isSale: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  // text, file, etc...
  type: {
    type: String,
    default: 'text',
    index: true
  },
  fileIds: [{
    type: Schema.Types.ObjectId
  }],
  text: String,
  senderSource: String,
  senderId: Schema.Types.ObjectId,
  meta: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
