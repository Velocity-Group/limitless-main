import { APIRequest } from './api-request';

export class TokenTransctionService extends APIRequest {
  sendTip(performerId: string, payload: any) {
    return this.post(`/token-transactions/tip/${performerId}`, payload);
  }

  purchaseFeed(id, payload) {
    return this.post(`/token-transactions/feed/${id}`, payload);
  }

  purchaseProduct(id, payload) {
    return this.post(`/token-transactions/product/${id}`, payload);
  }

  purchaseVideo(id, payload) {
    return this.post(`/token-transactions/video/${id}`, payload);
  }

  purchaseGallery(id, payload) {
    return this.post(`/token-transactions/gallery/${id}`, payload);
  }

  purchaseMessage(id, payload) {
    return this.post(`/token-transactions/message/${id}`, payload);
  }

  purchaseStream(id) {
    return this.post(`/token-transactions/stream/${id}`);
  }

  userSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/token-transactions/user/search', query));
  }
}

export const tokenTransctionService = new TokenTransctionService();
