import { APIRequest } from './api-request';

class StreamService extends APIRequest {
  updateStreamInfo(payload) {
    return this.put('/streaming/update', payload);
  }

  updateStreamDuration(payload) {
    return this.put('/streaming/set-duration', payload);
  }

  goLive(data) {
    return this.post('/streaming/live', data);
  }

  joinPublicChat(performerId: string) {
    return this.post(`/streaming/join/${performerId}`);
  }

  fetchAgoraAppToken(data) {
    return this.post('/streaming/agora/token', data);
  }

  search(query: { [key: string]: any }) {
    return this.get(this.buildUrl('/streaming/user/search', query));
  }
}

export const streamService = new StreamService();
