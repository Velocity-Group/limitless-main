import { APIRequest } from './api-request';
import env from '../env';

export class PerformerService extends APIRequest {
  create(payload: any) {
    return this.post('/admin/performers', payload);
  }

  update(id: string, payload: any) {
    return this.put(`/admin/performers/${id}`, payload);
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/admin/performers/search', query));
  }

  findById(id: string) {
    return this.get(`/admin/performers/${id}/view`);
  }

  delete(id: string) {
    return this.del(`/admin/performers/${id}/delete`);
  }

  getUploadDocumentUrl() {
    return `${env.apiEndpoint}/admin/performers/documents/upload`;
  }

  getAvatarUploadUrl() {
    return `${env.apiEndpoint}/admin/performers/avatar/upload`;
  }

  getCoverUploadUrl() {
    return `${env.apiEndpoint}/admin/performers/cover/upload`;
  }

  updatePaymentGatewaySetting(id: string, payload: any) {
    return this.put(`/admin/performers/${id}/payment-gateway-settings`, payload);
  }

  updateCommissionSetting(id: string, payload: any) {
    return this.put(`/admin/performers/${id}/commission-settings`, payload);
  }

  updateBankingSetting(id: string, payload: any) {
    return this.put(`/admin/performers/${id}/banking-settings`, payload);
  }

  trendingProfiles(query) {
    return this.get(this.buildUrl('/performers-trending/search', query));
  }

  trendingUpdate(payload) {
    return this.post('/performers-trending/update-ordering', payload);
  }

  trendingRemove(id: string) {
    return this.del(`/performers-trending/${id}`);
  }

  trendingCreate(payload: any) {
    return this.post('/performers-trending/create', payload);
  }
}

export const performerService = new PerformerService();
