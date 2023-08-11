import { ISearch } from './utils';

export interface IReferralSearch extends ISearch {
  fromDate?: Date;
  toDate?: Date;
  registerId?: string;
}
