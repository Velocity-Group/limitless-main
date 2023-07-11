import { APIRequest } from './api-request';
import { getGlobalConfig } from './config';

export class MessageService extends APIRequest {
  getConversations(query?: Record<string, any>) {
    return this.get(this.buildUrl('/conversations', query));
  }

  searchConversations(query?: Record<string, any>) {
    return this.get(this.buildUrl('/conversations/search', query));
  }

  createConversation(data: Record<string, string>) {
    return this.post('/conversations', data);
  }

  getConversationDetail(id: string) {
    return this.get(`/conversations/${id}`);
  }

  getMessages(conversationId: string, query?: Record<string, any>) {
    return this.get(this.buildUrl(`/messages/conversations/${conversationId}`, query));
  }

  sendMessage(conversationId: string, data: Record<string, any>) {
    return this.post(`/messages/conversations/${conversationId}`, data);
  }

  sendMassMessages(data: Record<string, any>) {
    return this.post('/messages/mass-messages', data);
  }

  countTotalNotRead() {
    return this.get('/messages/counting-not-read-messages');
  }

  readAllInConversation(conversationId: string) {
    return this.post(`/messages/read-all/conversation/${conversationId}`);
  }

  getMessageUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/messages/private/file`;
  }

  getConversationByStreamId(streamId: string) {
    return this.get(`/conversations/stream/${streamId}`);
  }

  getPublicMessages(conversationId: string, query?: Record<string, any>) {
    return this.get(this.buildUrl(`/messages/conversations/public/${conversationId}`, query));
  }

  sendStreamMessage(conversationId: string, data: Record<string, any>) {
    return this.post(`/messages/stream/conversations/${conversationId}`, data);
  }

  sendPublicStreamMessage(conversationId: string, data: Record<string, any>) {
    return this.post(`/messages/stream/public/conversations/${conversationId}`, data);
  }

  findPublicConversationPerformer(performerId: string) {
    return this.get(`/conversations/stream/public/${performerId}`);
  }

  deleteMessage(id) {
    return this.del(`/messages/${id}`);
  }

  deleteAllMessageInConversation(conversationId) {
    return this.del(`/messages/${conversationId}/remove-all-message`);
  }

  updateConversationName(conversationId, data) {
    return this.put(`/conversations/${conversationId}/update`, data);
  }

  uploadPrivatePhoto(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/messages/private/file/photo',
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

  uploadPublicPhoto(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/messages/public/file/photo',
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
      '/messages/private/file/video',
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
      '/messages/public/file/video',
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

  uploadPublicThumbnail(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/messages/public/file/thumbnail',
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

  uploadAudio(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/messages/public/file/audio',
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

  getTranscodeVideoUrl(messageId: string, fileId: string) {
    return this.post(`/messages/${messageId}/videos/${fileId}/url`);
  }

  getVideoFileStatus(messageId: string, fileId: string) {
    return this.post(`/messages/${messageId}/videos/${fileId}/url`);
  }
}

export const messageService = new MessageService();
