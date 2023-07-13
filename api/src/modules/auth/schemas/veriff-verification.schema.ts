import { Schema } from 'mongoose';

export const VeriffVerificationSchema = new Schema(
  {
    userSource: {
      type: String,
      default: 'performer' // user or performer
    },
    userId: {
      type: Schema.Types.ObjectId
    },
    sessionId: String,
    responseData: {
      type: Schema.Types.Mixed
    },
    status: {
      type: String,
      default: 'created'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'veriffverifications'
  }
);
