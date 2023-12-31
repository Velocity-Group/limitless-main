import { APIRequest } from './api-request';
import { getGlobalConfig } from './config';

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
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/admin/performers/documents/upload`;
  }

  getAvatarUploadUrl(performerId: string) {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/admin/performers/${performerId}/avatar/upload`;
  }

  getCoverUploadUrl(performerId: string) {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/admin/performers/${performerId}/cover/upload`;
  }

  uploadAvatar(file: File, performerId: string) {
    return this.upload(`/admin/performers/${performerId}/avatar/upload`, [
      { file, fieldname: 'avatar' }
    ]);
  }

  uploadCover(file: File, performerId: string) {
    return this.upload(`/admin/performers/${performerId}/cover/upload`, [
      { file, fieldname: 'cover' }
    ]);
  }

  getWelcomeVideoUploadUrl(performerId: string) {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/admin/performers/${performerId}/welcome-video/upload`;
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

  getDecision(performerId: string) {
    return this.get(`/veriff/${performerId}/decision`);
  }
}

export const performerService = new PerformerService();
