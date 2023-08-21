import { APIRequest } from './api-request';

export class TrendingService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/trending', query));
  }
}

export const trendingService = new TrendingService();
