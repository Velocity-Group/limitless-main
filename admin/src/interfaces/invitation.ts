import { ISearch } from './utils';

export interface IInvivationCode {
  _id: string;
  code: string;
  status: string;
  expiredDate: string | Date;
  numberOfUses: number;
  commissionToken: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IInvivationCodeCreate {
  code: string;
  status: string;
  expiredDate: string | Date;
  numberOfUses: number;
  commissionToken: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IInvivationCodeUpdate {
  _id: string;
  code: string;
  status: string;
  expiredDate: string | Date;
  numberOfUses: number;
  commissionToken: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IInvivationCodeSearch extends ISearch {
  status: string;
  sort: string;
  sortBy: string;
}
