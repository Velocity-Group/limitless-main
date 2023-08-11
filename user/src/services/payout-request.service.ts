import { APIRequest } from './api-request';

class PayoutRequestService extends APIRequest {
  calculate() {
    return this.post('/payout-requests/user/calculate');
  }

  search(query: { [key: string]: any }) {
    return this.get(this.buildUrl('/payout-requests/user/search', query));
  }

  create(body: any) {
    return this.post('/payout-requests', body);
  }

  update(id: string, body: any) {
    return this.put(`/payout-requests/${id}`, body);
  }

  detail(
    id: string,
    headers: {
      [key: string]: string;
    }
  ): Promise<any> {
    return this.get(`/payout-requests/${id}/view`, headers);
  }

  updatePayoutMethod(key: string, payload: any) {
    return this.post(`/payout-methods/${key}`, payload);
  }
}

export const payoutRequestService = new PayoutRequestService();
