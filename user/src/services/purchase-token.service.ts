import { APIRequest } from './api-request';

export class PurchaseTokenService extends APIRequest {
  sendTip(performerId: string, payload: any) {
    return this.post(`/purchase-items/tip/${performerId}`, payload);
  }

  purchaseFeed(id, payload) {
    return this.post(`/purchase-items/feed/${id}`, payload);
  }

  purchaseProduct(id, payload) {
    return this.post(`/purchase-items/product/${id}`, payload);
  }

  purchaseVideo(id, payload) {
    return this.post(`/purchase-items/video/${id}`, payload);
  }

  purchaseGallery(id, payload) {
    return this.post(`/purchase-items/gallery/${id}`, payload);
  }

  purchaseMessage(id, payload) {
    return this.post(`/purchase-items/message/${id}`, payload);
  }

  purchaseStream(id) {
    return this.post(`/purchase-items/stream/${id}`);
  }

  userSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/purchased-items/user/search', query));
  }
}

export const purchaseTokenService = new PurchaseTokenService();
