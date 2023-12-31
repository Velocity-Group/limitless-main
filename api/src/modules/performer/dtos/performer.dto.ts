import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';

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
  categoryIds?: ObjectId[];
  height?: string;
  weight?: string;
  bio?: string;
  eyes?: string;
  hair?: string;
  butt?: string;
  ethnicity?: string;
  sexualOrientation?: string;
  isFreeSubscription?: boolean;
  durationFreeSubscriptionDays?: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  publicChatPrice?: number;
  groupChatPrice?: number;
  privateChatPrice?: number;
  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos?: number;
    totalPhotos?: number;
    totalGalleries?: number;
    totalProducts?: number;
    totalStreamTime?: number;
    followers?: number;
  };
  verifiedEmail?: boolean;
  verifiedAccount?: boolean;
  verifiedDocument?: boolean;
  score?: number;
  bankingInformation?: any;
  paypalSetting?: any;
  commissionSetting?: any;
  blockCountries?: any;
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isOnline?: boolean;
  activateWelcomeVideo?: boolean;
  lastStreamingTime?: Date;
  maxParticipantsAllowed?: number;
  live?: number;
  streamingStatus?: string;
  twitterConnected?: boolean;
  googleConnected?: boolean;
  dateOfBirth?: Date;
  bodyType?: string;
  balance?: number;
  stripeAccount?: any;
  isFollowed?: boolean;
  commissionPercentage?: number;
  defaultMessageText?: string;
  defaultMessagePhotoId?: ObjectId;
  messagePhoto?: any;
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

  categoryIds?: ObjectId[];

  height?: string;

  weight?: string;

  bio?: string;

  eyes?: string;

  hair?: string;

  butt?: string;

  ethnicity?: string;

  sexualOrientation?: string;

  isFreeSubscription?: boolean;

  durationFreeSubscriptionDays?: number;

  monthlyPrice?: number;

  yearlyPrice?: number;

  publicChatPrice?: number;

  groupChatPrice?: number;

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
    followers: number;
    totalStreamTime: number;
  };

  score?: number;

  bankingInformation?: any;

  paypalSetting?: any;

  stripeAccount?: any;

  commissionSetting?: any;

  blockCountries?: any;

  createdBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  isOnline?: boolean;

  welcomeVideoId?: ObjectId;

  welcomeVideoPath?: string;

  welcomeVideoName?: string;

  activateWelcomeVideo?: boolean;

  isBookMarked?: boolean;

  isSubscribed?: boolean;

  lastStreamingTime?: Date;

  maxParticipantsAllowed?: number;

  live?: number;

  streamingStatus?: string;

  dateOfBirth?: Date;

  bodyType?: string;

  balance: number;

  isFollowed?: boolean;

  commissionPercentage?: number;

  defaultMessageText?: string;

  defaultMessagePhotoId?: ObjectId;

  messagePhoto?: any;

  constructor(data?: Partial<any>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'firstName',
        'lastName',
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
        'categoryIds',
        'height',
        'weight',
        'bio',
        'eyes',
        'hair',
        'butt',
        'ethnicity',
        'sexualOrientation',
        'isFreeSubscription',
        'durationFreeSubscriptionDays',
        'monthlyPrice',
        'yearlyPrice',
        'publicChatPrice',
        'groupChatPrice',
        'privateChatPrice',
        'stats',
        'score',
        'bankingInformation',
        'stripeAccount',
        'paypalSetting',
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
        'welcomeVideoName',
        'activateWelcomeVideo',
        'isBookMarked',
        'isSubscribed',
        'lastStreamingTime',
        'maxParticipantsAllowed',
        'live',
        'streamingStatus',
        'dateOfBirth',
        'bodyType',
        'balance',
        'isFollowed',
        'commissionPercentage',
        'defaultMessageText',
        'defaultMessagePhotoId',
        'messagePhoto'
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
      country: this.country,
      stats: this.stats,
      isOnline: this.isOnline,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      welcomeVideoName: this.welcomeVideoName,
      activateWelcomeVideo: this.activateWelcomeVideo,
      verifiedAccount: this.verifiedAccount,
      isSubscribed: this.isSubscribed,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      dateOfBirth: this.dateOfBirth,
      isFreeSubscription: this.isFreeSubscription,
      durationFreeSubscriptionDays: this.durationFreeSubscriptionDays,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      publicChatPrice: this.publicChatPrice,
      groupChatPrice: this.groupChatPrice,
      privateChatPrice: this.privateChatPrice,
      maxParticipantsAllowed: this.maxParticipantsAllowed,
      height: this.height,
      weight: this.weight,
      hair: this.hair,
      butt: this.butt,
      ethnicity: this.ethnicity,
      bio: this.bio,
      eyes: this.eyes,
      bodyType: this.bodyType,
      sexualOrientation: this.sexualOrientation,
      isPerformer: true,
      isFollowed: this.isFollowed
    };
    const privateInfo = {
      firstName: this.firstName,
      lastName: this.lastName,
      balance: this.balance,
      twitterConnected: this.twitterConnected,
      googleConnected: this.googleConnected,
      verifiedEmail: this.verifiedEmail,
      verifiedDocument: this.verifiedDocument,
      email: this.email,
      phone: this.phone,
      phoneCode: this.phoneCode,
      status: this.status,
      blockCountries: this.blockCountries,
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
      bankingInformation: this.bankingInformation,
      stripeAccount: this.stripeAccount,
      welcomeVideoId: this.welcomeVideoId,
      paypalSetting: this.paypalSetting,
      defaultMessageText: this.defaultMessageText,
      defaultMessagePhotoId: this.defaultMessagePhotoId,
      messagePhoto: this.messagePhoto,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo,
        commissionPercentage: this.commissionPercentage
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
      stats: this.stats,
      score: this.score,
      isOnline: this.isOnline,
      isFreeSubscription: this.isFreeSubscription,
      durationFreeSubscriptionDays: this.durationFreeSubscriptionDays,
      verifiedAccount: this.verifiedAccount,
      live: this.live,
      streamingStatus: this.streamingStatus,
      isFollowed: this.isFollowed,
      dateOfBirth: this.dateOfBirth
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
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      hair: this.hair,
      butt: this.butt,
      ethnicity: this.ethnicity,
      sexualOrientation: this.sexualOrientation,
      isFreeSubscription: this.isFreeSubscription,
      durationFreeSubscriptionDays: this.durationFreeSubscriptionDays,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      publicChatPrice: this.publicChatPrice,
      groupChatPrice: this.groupChatPrice,
      privateChatPrice: this.privateChatPrice,
      stats: this.stats,
      score: this.score,
      blockCountries: this.blockCountries,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isOnline: this.isOnline,
      welcomeVideoId: this.welcomeVideoId,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      activateWelcomeVideo: this.activateWelcomeVideo,
      verifiedAccount: this.verifiedAccount,
      isBookMarked: this.isBookMarked,
      isSubscribed: this.isSubscribed,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      dateOfBirth: this.dateOfBirth,
      bodyType: this.bodyType,
      isPerformer: true,
      isFollowed: this.isFollowed
    };
  }
}
