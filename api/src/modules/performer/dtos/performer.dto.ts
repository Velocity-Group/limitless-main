import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';
import { UserDto } from 'src/modules/user/dtos';

interface ValueSchedule {
  start: string;
  end: string;
  closed: boolean;
}

export interface ISchedule {
  mon: ValueSchedule;
  tue: ValueSchedule;
  wed: ValueSchedule;
  thu: ValueSchedule;
  fri: ValueSchedule;
  sat: ValueSchedule;
  sun: ValueSchedule;
}
export interface IPerformerResponse {
  _id?: ObjectId;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCode?: string; // international code prefix
  status?: string;
  avatar?: string;
  cover?: string;
  idVerificationId?: ObjectId;
  documentVerificationId?: ObjectId;
  gender?: string;
  country?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  address?: string;
  languages?: string[];
  studioId?: ObjectId;
  categoryIds?: ObjectId[];
  height?: string;
  weight?: string;
  bio?: string;
  eyes?: string;
  hair?: string;
  pubicHair?: string;
  bust?: string;
  ethnicity?: string;
  sexualPreference?: string;
  isFreeSubscription?: boolean;
  monthlyPrice?: number;
  yearlyPrice?: number;
  publicChatPrice?: number;
  privateChatPrice?: number;
  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalBlogs: number;
    totalStories: number;
    totalStreamTime: number;
  };
  verifiedEmail?: boolean;
  verifiedAccount?: boolean;
  verifiedDocument?: boolean;
  score?: number;
  isPerformer: boolean;
  bankingInformation?: any;
  ccbillSetting?: any;
  commissionSetting?: any;
  blockCountries?: any;
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isOnline?: boolean;
  activateWelcomeVideo?: boolean;
  lastStreamingTime?: Date;
  maxParticipantsAllowed?: number;
  live?: boolean;
  streamingStatus?: string;
  twitterConnected?: boolean;
  googleConnected?: boolean;
  dateOfBirth?: Date;
  bodyType?: string;
}

export interface IBlockedUsersResponse {
  _id?: string | ObjectId;
  userId?: string | ObjectId;
  userInfo?: UserDto;
}

export class PerformerDto {
  _id: ObjectId;

  name?: string;

  firstName?: string;

  lastName?: string;

  username?: string;

  email?: string;

  phone?: string;

  phoneCode?: string; // international code prefix

  status?: string;

  avatarId?: ObjectId;

  avatarPath?: string;

  coverId?: ObjectId;

  coverPath?: string;

  idVerificationId?: ObjectId;

  idVerification?: any;

  documentVerificationId?: ObjectId;

  documentVerification?: any;

  verifiedEmail?: boolean;

  verifiedAccount?: boolean;

  verifiedDocument?: boolean;

  twitterConnected?: boolean;

  googleConnected?: boolean;

  avatar?: any;

  cover?: any;

  gender?: string;

  country?: string;

  city?: string;

  state?: string;

  zipcode?: string;

  address?: string;

  languages?: string[];

  studioId?: ObjectId;

  categoryIds?: ObjectId[];

  schedule?: ISchedule;

  timezone?: string;

  noteForUser?: string;

  height?: string;

  weight?: string;

  bio?: string;

  eyes?: string;

  hair?: string;

  pubicHair?: string;

  bust?: string;

  ethnicity?: string;

  sexualPreference?: string;

  isFreeSubscription?: boolean;

  monthlyPrice?: number;

  yearlyPrice?: number;

  publicChatPrice?: number;

  privateChatPrice?: number;

  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalFeeds: number;
    totalBlogs: number;
    totalStories: number;
    totalStreamTime: number;
  };

  score?: number;

  isPerformer: boolean;

  bankingInformation?: any;

  ccbillSetting?: any;

  commissionSetting?: any;

  blockCountries?: any;

  createdBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  isOnline?: boolean;

  welcomeVideoId?: ObjectId;

  welcomeVideoPath?: string;

  activateWelcomeVideo?: boolean;

  isBookMarked?: boolean;

  isSubscribed?: boolean;

  lastStreamingTime?: Date;

  maxParticipantsAllowed?: number;

  live?: boolean;

  streamingStatus?: string;

  dateOfBirth?: Date;

  bodyType?: string;

  constructor(data?: Partial<any>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'firstName',
        'lastName',
        'name',
        'username',
        'email',
        'phone',
        'phoneCode',
        'status',
        'avatarId',
        'avatarPath',
        'coverId',
        'coverPath',
        'idVerificationId',
        'idVerification',
        'documentVerificationId',
        'idVerification',
        'documentVerification',
        'gender',
        'country',
        'city',
        'state',
        'zipcode',
        'address',
        'languages',
        'studioId',
        'categoryIds',
        'schedule',
        'timezone',
        'noteForUser',
        'height',
        'weight',
        'bio',
        'eyes',
        'hair',
        'pubicHair',
        'bust',
        'ethnicity',
        'sexualPreference',
        'isFreeSubscription',
        'monthlyPrice',
        'yearlyPrice',
        'publicChatPrice',
        'privateChatPrice',
        'stats',
        'score',
        'isPerformer',
        'bankingInformation',
        'ccbillSetting',
        'commissionSetting',
        'blockCountries',
        'createdBy',
        'createdAt',
        'updatedAt',
        'verifiedEmail',
        'verifiedAccount',
        'verifiedDocument',
        'twitterConnected',
        'googleConnected',
        'isOnline',
        'welcomeVideoId',
        'welcomeVideoPath',
        'activateWelcomeVideo',
        'isBookMarked',
        'isSubscribed',
        'lastStreamingTime',
        'maxParticipantsAllowed',
        'live',
        'streamingStatus',
        'dateOfBirth',
        'bodyType'
      ])
    );
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean) {
    const publicInfo = {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      username: this.username,
      gender: this.gender,
      firstName: this.firstName,
      lastName: this.lastName,
      country: this.country,
      stats: this.stats,
      isPerformer: true,
      blockCountries: this.blockCountries,
      isOnline: this.isOnline,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      activateWelcomeVideo: this.activateWelcomeVideo,
      verifiedAccount: this.verifiedAccount,
      isSubscribed: this.isSubscribed,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      dateOfBirth: this.dateOfBirth
    };
    const privateInfo = {
      twitterConnected: this.twitterConnected,
      googleConnected: this.googleConnected,
      verifiedEmail: this.verifiedEmail,
      verifiedDocument: this.verifiedDocument,
      email: this.email,
      phone: this.phone,
      phoneCode: this.phoneCode,
      status: this.status,
      name: this.getName(),
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      idVerificationId: this.idVerificationId,
      idVerification: this.idVerification,
      documentVerificationId: this.documentVerificationId,
      documentVerification: this.documentVerification,
      schedule: this.schedule,
      timezone: this.timezone,
      noteForUser: this.noteForUser,
      height: this.height,
      weight: this.weight,
      hair: this.hair,
      pubicHair: this.pubicHair,
      bust: this.bust,
      ethnicity: this.ethnicity,
      bio: this.bio,
      eyes: this.eyes,
      bodyType: this.bodyType,
      sexualPreference: this.sexualPreference,
      isFreeSubscription: this.isFreeSubscription,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      publicChatPrice: this.publicChatPrice,
      privateChatPrice: this.privateChatPrice,
      bankingInformation: this.bankingInformation,
      welcomeVideoId: this.welcomeVideoId,
      maxParticipantsAllowed: this.maxParticipantsAllowed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo,
        ccbillSetting: this.ccbillSetting,
        commissionSetting: this.commissionSetting
      };
    }

    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ');
  }

  toSearchResponse() {
    return {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      country: this.country,
      username: this.username,
      gender: this.gender,
      languages: this.languages,
      stats: this.stats,
      score: this.score,
      isPerformer: true,
      isOnline: this.isOnline,
      isFreeSubscription: this.isFreeSubscription,
      verifiedAccount: this.verifiedAccount,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus
    };
  }

  toPublicDetailsResponse() {
    return {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      username: this.username,
      status: this.status,
      gender: this.gender,
      firstName: this.firstName,
      lastName: this.lastName,
      country: this.country,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      schedule: this.schedule,
      timezone: this.timezone,
      noteForUser: this.noteForUser,
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      hair: this.hair,
      pubicHair: this.pubicHair,
      bust: this.bust,
      ethnicity: this.ethnicity,
      sexualPreference: this.sexualPreference,
      isFreeSubscription: this.isFreeSubscription,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      publicChatPrice: this.publicChatPrice,
      privateChatPrice: this.privateChatPrice,
      stats: this.stats,
      isPerformer: true,
      score: this.score,
      blockCountries: this.blockCountries,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isOnline: this.isOnline,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      activateWelcomeVideo: this.activateWelcomeVideo,
      verifiedAccount: this.verifiedAccount,
      isBookMarked: this.isBookMarked,
      isSubscribed: this.isSubscribed,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      dateOfBirth: this.dateOfBirth,
      bodyType: this.bodyType
    };
  }
}
