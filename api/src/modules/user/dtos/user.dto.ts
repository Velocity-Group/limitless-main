import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';

export interface IUserResponse {
  _id?: ObjectId;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  avatar?: string;
  status?: string;
  pathsAllow?: string[];
  gender?: string;
  balance?: number;
  country?: string;
  verifiedEmail?: boolean;
  twitterConnected?: boolean;
  googleConnected?: boolean;
  isOnline?: boolean;
  stats: {
    totalSubscriptions: number;
    following: number;
  }
  isBlocked?: boolean;
  stripeCardIds?: string[];
  stripeCustomerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paypalSetting?: any;
  bankingInformation?: any;
}

export class UserDto {
  _id: ObjectId;

  name?: string;

  firstName?: string;

  lastName?: string;

  email?: string;

  phone?: string;

  roles: string[] = ['user'];

  avatarId?: ObjectId;

  stats: {
    totalSubscriptions: number;
    following: number;
  }

  avatarPath?: string;

  status?: string;

  pathsAllow?: string[];

  username?: string;

  gender?: string;

  balance?: number;

  country?: string; // iso code

  verifiedEmail?: boolean;

  isOnline?: boolean;

  twitterConnected?: boolean;

  googleConnected?: boolean;

  isPerformer?: boolean;

  isBlocked?: boolean;

  stripeCardIds?: string[];

  stripeCustomerId?: string;

  verifiedAccount?: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  paypalSetting?: any;

  bankingInformation?: any;

  constructor(data?: Partial<UserDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'name',
          'firstName',
          'lastName',
          'email',
          'phone',
          'roles',
          'avatarId',
          'avatarPath',
          'status',
          'pathsAllow',
          'username',
          'gender',
          'balance',
          'country',
          'verifiedEmail',
          'verifiedAccount',
          'isOnline',
          'stats',
          'twitterConnected',
          'googleConnected',
          'isPerformer',
          'isBlocked',
          'stripeCardIds',
          'stripeCustomerId',
          'createdAt',
          'updatedAt',
          'paypalSetting',
          'bankingInformation'
        ])
      );
  }

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ');
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean): IUserResponse {
    const publicInfo = {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      isOnline: this.isOnline,
      stats: this.stats,
      isPerformer: false,
      country: this.country,
      isBlocked: this.isBlocked,
      verifiedAccount: this.verifiedAccount,
      twitterConnected: this.twitterConnected,
      googleConnected: this.googleConnected,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    const privateInfo = {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      status: this.status,
      pathsAllow: this.pathsAllow,
      gender: this.gender,
      balance: this.balance,
      roles: this.roles,
      verifiedEmail: this.verifiedEmail,
      stripeCardIds: this.stripeCardIds,
      stripeCustomerId: this.stripeCustomerId,
      paypalSetting: this.paypalSetting,
      bankingInformation: this.bankingInformation
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo
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
}
