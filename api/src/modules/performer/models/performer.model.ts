import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class PerformerModel extends Document {
  _id: ObjectId;

  name: string;

  firstName: string;

  lastName: string;

  username: string;

  email: string;

  phone: string;

  phoneCode: string; // international code prefix

  avatarId: ObjectId;

  avatarPath: string;

  coverId: ObjectId;

  coverPath: string;

  idVerificationId: ObjectId;

  documentVerificationId: ObjectId;

  verifiedEmail: boolean;

  verifiedAccount: boolean;

  verifiedDocument: boolean;

  status: string;

  gender: string;

  country: string;

  city: string;

  state: string;

  zipcode: string;

  address: string;

  languages: string[];

  agentId: ObjectId;

  height: string;

  weight: string;

  hair: string;

  butt: string;

  ethnicity: string;

  bio: string;

  eyes: string;

  sexualOrientation: string;

  dateOfBirth: Date;

  bodyType: string;

  isFreeSubscription: boolean;

  durationFreeSubscriptionDays: number;

  monthlyPrice: number;

  yearlyPrice: number;

  stats: {
    likes: number;
    subscribers: number;
    views: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalFeeds: number;
    totalStreamTime: number;
    followers: number;
  };

  bankingInfomation: any;

  ccbillSetting: any;

  // score custom from other info like likes, subscribes, views....
  score: number;

  createdBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  isOnline: boolean;

  onlineAt: Date;

  offlineAt: Date;

  welcomeVideoId: ObjectId;

  welcomeVideoPath: string;

  activateWelcomeVideo: boolean;

  lastStreamingTime: Date;

  maxParticipantsAllowed: number;

  live: number;

  streamingStatus: string;

  twitterProfile: any;

  twitterConnected: boolean;

  googleProfile: any;

  googleConnected: boolean;

  privateChatPrice: number;

  publicChatPrice: number;

  groupChatPrice: number;

  roles: string[];

  balance: number;

  commissionPercentage: number;

  defaultMessageText: string;

  defaultMessagePhotoId: ObjectId;
}
