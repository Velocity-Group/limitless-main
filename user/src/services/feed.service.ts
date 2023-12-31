import { APIRequest } from './api-request';

export class FeedService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/feeds/performers', query)
    );
  }

  userSearch(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/feeds/users', query)
    );
  }

  searchPerformerFeeds(performerId: string, query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl(`/feeds/users/${performerId}/search`, query)
    );
  }

  userHomeFeeds(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/feeds/users/home-feeds', query)
    );
  }

  delete(id: string) {
    return this.del(`/feeds/performers/${id}`);
  }

  findById(id: string, headers?: { [key: string]: string }) {
    return this.get(`/feeds/performers/${id}`, headers);
  }

  findOne(id: string, headers?: { [key: string]: string }) {
    return this.get(`/feeds/users/${id}`, headers);
  }

  pinFeedProfile(id: string) {
    return this.put(`/feeds/performers/pin/${id}`);
  }

  update(id: string, payload: any) {
    return this.put(`/feeds/performers/${id}`, payload);
  }

  create(data) {
    return this.post('/feeds/performers', data);
  }

  uploadPhoto(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/feeds/performers/photo/upload',
      [
        {
          fieldname: 'file',
          file
        }
      ],
      {
        onProgress,
        customData: payload
      }
    );
  }

  uploadThumbnail(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/feeds/performers/thumbnail/upload',
      [
        {
          fieldname: 'file',
          file
        }
      ],
      {
        onProgress,
        customData: payload
      }
    );
  }

  uploadVideo(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/feeds/performers/video/upload',
      [
        {
          fieldname: 'file',
          file
        }
      ],
      {
        onProgress,
        customData: payload
      }
    );
  }

  uploadTeaser(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/feeds/performers/teaser/upload',
      [
        {
          fieldname: 'file',
          file
        }
      ],
      {
        onProgress,
        customData: payload
      }
    );
  }

  addPoll(payload) {
    return this.post('/feeds/performers/polls', payload);
  }

  votePoll(pollId: string) {
    return this.post(`/feeds/users/vote/${pollId}`);
  }

  views(feedId: string) {
    return this.post(`/feeds/users/view/${feedId}`);
  }

  getBookmark(payload) {
    return this.get(this.buildUrl('/reactions/feeds/bookmark', payload));
  }

  getTranscodeVideoUrl(feedId, fileId) {
    return this.post(`/feeds/file/${feedId}/videos/${fileId}/url`);
  }
}

export const feedService = new FeedService();
