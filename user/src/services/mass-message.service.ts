import { APIRequest } from './api-request';

export class MassMessageService extends APIRequest {
  sendMassMessages(data: Record<string, any>) {
    return this.post('/mass-messages', data);
  }

  searchMassMessages(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/mass-messages', query)
    );
  }

  findOne(id: string) {
    return this.get(`/mass-messages/${id}`);
  }

  update(id: string, payload: any) {
    return this.put(`/mass-messages/${id}`, payload);
  }

  delete(id: string) {
    return this.del(`/mass-messages/${id}`);
  }
}

export const massMessageService = new MassMessageService();
