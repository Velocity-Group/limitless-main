// import { IGalleryCreate } from 'src/interfaces';
import { APIRequest } from './api-request';

export class PaymentService extends APIRequest {
  subscribe(payload: any) {
    return this.post('/payment/subscribe/performers', payload);
  }

  getListTransactions(payload) {
    return this.get(this.buildUrl('/payment/transactions', payload));
  }

  userSearchTransactions(payload) {
    return this.get(this.buildUrl('/transactions/user/search', payload));
  }

  purchaseVideo(payload) {
    return this.post('/payment/purchase-video', payload);
  }

  purchaseTokenPackage(id: string, payload: any) {
    return this.post(`/payment/purchase-tokens/${id}`, payload);
  }

  purchaseProducts(products: any) {
    return this.post('/payment/purchase-products', products);
  }

  tipPerformer(data) {
    return this.post('/payment/send-tip', data);
  }

  purchaseFeed(payload) {
    return this.post('/payment/purchase-feed', payload);
  }

  purchaseStream(payload) {
    return this.post('/payment/purchase-stream', payload);
  }

  authoriseCard() {
    return this.post('/payment/authorise-card');
  }

  applyCoupon(code: any) {
    return this.post(`/coupons/${code}/apply-coupon`);
  }

  cancelSubscription(subscriptionId: string) {
    return this.post(`/subscriptions/cancel/${subscriptionId}`);
  }
}

export const paymentService = new PaymentService();
