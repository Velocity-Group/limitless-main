import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { STATUS_ACTIVE, ROLE_USER } from '../constants';

export const userSchema = new mongoose.Schema({
  name: String,
  firstName: String,
  lastName: String,
  username: {
    type: String,
    index: true,
    unique: true,
    trim: true,
    // uniq if not null
    sparse: true
  },
  email: {
    type: String,
    index: true,
    unique: true,
    lowercase: true,
    trim: true,
    // uniq if not null
    sparse: true
  },
  verifiedEmail: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String
  },
  roles: [
    {
      type: String,
      default: ROLE_USER
    }
  ],
  avatarId: ObjectId,
  avatarPath: String,
  status: {
    type: String,
    default: STATUS_ACTIVE
  },
  gender: {
    type: String,
    index: true
  },
  balance: {
    type: Number,
    default: 0
  },
  country: {
    type: String
  },
  isOnline: {
    type: Number,
    default: 0
  },
  onlineAt: {
    type: Date
  },
  offlineAt: {
    type: Date
  },
  stats: {
    totalSubscriptions: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  twitterProfile: {
    type: mongoose.Schema.Types.Mixed
  },
  googleProfile: {
    type: mongoose.Schema.Types.Mixed
  },
  googleConnected: {
    type: Boolean,
    default: false
  },
  twitterConnected: {
    type: Boolean,
    default: false
  },
  stripeCardIds: [{
    type: String
  }],
  stripeCustomerId: {
    type: String
  }
});

export const UserSchema = userSchema;
