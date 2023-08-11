import * as mongoose from 'mongoose';

export const ReferralSchema = new mongoose.Schema(
  {
    registerSource: {
      type: String,
      default: 'performer'
    },
    registerId: {
      type: mongoose.Types.ObjectId,
      index: true
    },
    referralSource: {
      type: String,
      default: 'performer'
    },
    referralId: {
      type: mongoose.Types.ObjectId,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'referrals'
  }
);

export const ReferralCodeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      default: 'user'
    },
    sourceId: {
      type: mongoose.Types.ObjectId
    },
    code: {
      type: String,
      index: true,
      unique: true,
      trim: true,
      // uniq if not null
      sparse: true
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
    collection: 'referralCodes'
  }
);
