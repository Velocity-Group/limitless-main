import { APIRequest } from './api-request';

export class EarningService extends APIRequest {
  performerStarts(param?: any) {
    return this.get(this.buildUrl('/earning/performer/stats', param));
  }

  performerSearch(param?: any) {
    return this.get(this.buildUrl('/earning/performer/search', param));
  }

  referralStats() {
    return this.get('/referral-earnings/stats');
  }

  referralSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/referral-earnings/search', query));
  }
}

export const earningService = new EarningService();
