import { SearchRequest } from 'src/kernel/common';

export class ReferralEarningSearchRequestPayload extends SearchRequest {
  registerId: string;

  referralId: string;

  type: string;

  isPaid: string;

  isToken: string;

  fromDate: string;

  toDate: string;
}
