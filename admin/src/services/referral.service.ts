import { IReferralSearch } from 'src/interfaces';
import { APIRequest } from './api-request';

export class ReferralService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/referrals/admin/search', query)
    );
  }

  stats(query: IReferralSearch) {
    return this.get(this.buildUrl('/referral-earnings/admin/stats', query as any));
  }

  searchTableStats(query: IReferralSearch) {
    return this.get(this.buildUrl('/referral-earnings/admin/search', query as any));
  }
}

export const referralService = new ReferralService();
