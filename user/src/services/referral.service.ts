import { APIRequest } from './api-request';

export class ReferralService extends APIRequest {
  getReferralCode() {
    return this.get('/referrals/user/code');
  }

  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/referrals/user/search', query)
    );
  }
}

export const referralService = new ReferralService();
