import { APIRequest } from './api-request';

class StreamRequestService extends APIRequest {
  _request(data: any) {
    return this.post('/streaming/private/request', data);
  }

  approve(id: any) {
    return this.post(`/streaming/private/request/${id}/approve`);
  }

  start(id: any, header?: any) {
    return this.post(`/streaming/private/request/${id}/start`, header);
  }

  edit(id: any, data: any, header?: any) {
    return this.post(`/streaming/private/request/${id}/edit`, data, header);
  }

  join(id: any, header?: any) {
    return this.post(`/streaming/private/request/${id}/join`, header);
  }

  reject(id: any) {
    return this.post(`/streaming/private/request/${id}/reject`);
  }

  delete(id: any) {
    return this.del(`/streaming/private/request/${id}`);
  }

  searchByUser(query: any) {
    return this.get(this.buildUrl('/streaming/private/request/search', query));
  }

  searchByPerformer(query: any) {
    return this.get(this.buildUrl('/streaming/private/request', query));
  }
}

export const streamRequestService = new StreamRequestService();
