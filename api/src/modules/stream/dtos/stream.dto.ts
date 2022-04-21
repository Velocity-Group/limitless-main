import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

export declare type StreamType = 'public' | 'group' | 'private';

export interface IStream {
  _id?: ObjectId
  performerId?: ObjectId;
  type?: string;
  title?: string;
  description?: string;
  sessionId?: string;
  isStreaming?: number;
  streamingTime?: number;
  lastStreamingTime?: Date;
  price?: number;
  createdAt?: Date;
  updatedAt?: Date;
  stats?: {
    members: number;
    likes: number;
  }
  isSubscribed?: boolean;
  hasPurchased: boolean;
}

export class StreamDto {
  _id: ObjectId

  performerId: ObjectId;

  performerInfo: any;

  title: string;

  description: string;

  type: string;

  sessionId: string;

  isStreaming: number;

  streamingTime: number;

  lastStreamingTime: Date;

  isFree: boolean;

  price: number;

  createdAt: Date;

  updatedAt: Date;

  conversationId: string;

  stats: {
    members: number;
    likes: number;
  }

  isSubscribed: boolean;

  hasPurchased: boolean;

  constructor(data: Partial<IStream>) {
    Object.assign(
      this,
      _.pick(data, [
        '_id',
        'performerId',
        'performerInfo',
        'title',
        'description',
        'type',
        'sessionId',
        'isStreaming',
        'streamingTime',
        'lastStreamingTime',
        'isFree',
        'price',
        'createdAt',
        'updatedAt',
        'stats',
        'isSubscribed',
        'conversationId',
        'hasPurchased'
      ])
    );
  }

  toResponse(includePrivateInfo = false) {
    const publicInfo = {
      _id: this._id,
      title: this.title,
      description: this.description,
      isStreaming: this.isStreaming,
      isFree: this.isFree,
      price: this.price,
      performerId: this.performerId,
      performerInfo: this.performerInfo,
      type: this.type,
      sessionId: this.sessionId,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isSubscribed: this.isSubscribed,
      conversationId: this.conversationId,
      hasPurchased: this.hasPurchased
    };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      streamingTime: this.streamingTime,
      lastStreamingTime: this.lastStreamingTime
    };
  }
}
