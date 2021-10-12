import { ISearch } from './utils';

export interface IUser {
  _id: string;
  avatar: string;
  name: string;
  email: string;
  username: string;
  roles: string[];
  isPerformer: boolean;
  isOnline: number;
  verifiedEmail: boolean;
  verifiedAccount: boolean;
  twitterConnected: boolean;
  googleConnected: boolean;
  cover: string;
  dateOfBirth: Date;
  verifiedDocument: boolean;
  balance: number;
  stripeCardIds: string[];
  stripeCustomerId: string;
  stats: any;
}

export interface IUserFormData {
  avatar: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface IUserSearch extends ISearch {
  roles: string[];
}
