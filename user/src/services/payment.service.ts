// import { IGalleryCreate } from 'src/interfaces';
import { APIRequest } from './api-request';

export class PaymentService extends APIRequest {
  subscribePerformer(payload: { performerId: string, type: string }) {
    return this.post('/payment/subscribe/performers', payload);
  }

  userSearch(payload) {
    return this.get(this.buildUrl('/transactions/user/search', payload));
  }

  purchaseTokenPackage(id: string, payload: any) {
    return this.post(`/payment/purchase-tokens/${id}`, payload);
  }

  applyCoupon(code: any) {
    return this.post(`/coupons/${code}/apply-coupon`);
  }
}

export const paymentService = new PaymentService();
