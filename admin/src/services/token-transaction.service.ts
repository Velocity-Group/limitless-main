import { APIRequest } from './api-request';

export class TokenTransactionService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/token-transactions/admin/search', query)
    );
  }
}

export const tokenTransactionService = new TokenTransactionService();
