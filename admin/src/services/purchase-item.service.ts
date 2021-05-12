import { APIRequest } from './api-request';

export class PurchaseItemService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/purchased-items/admin/search', query)
    );
  }
}

export const purchaseItemService = new PurchaseItemService();
