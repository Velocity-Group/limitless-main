/* eslint-disable linebreak-style */
/* eslint-disable indent */
import { APIRequest } from './api-request';

export class TokenService extends APIRequest {
    create(payload) {
        return this.post('/admin/package/token', payload);
    }

    search(query) {
        return this.get(this.buildUrl('/admin/package/token/search', query as any));
    }

    findById(id: string) {
        return this.get(`/admin/package/token/${id}/view`);
    }

    update(id: string, payload) {
        return this.put(`/admin/package/token/${id}`, payload);
    }

    delete(id: string) {
        return this.del(`/admin/package/token/${id}`);
    }
}

export const tokenService = new TokenService();
