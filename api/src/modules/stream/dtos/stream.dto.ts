import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

export declare type StreamType = 'public' | 'group' | 'private';

export interface IStream {
  _id?: ObjectId
  performerId?: string | ObjectId;
  type?: string;
  userIds?: ObjectId[];
  sessionId?: string;
  isStreaming?: number;
  streamingTime?: number;
  lastStreamingTime?: Date;
  price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StreamDto {
  _id: ObjectId

  performerId: string | ObjectId;

  performerInfo: any;

  userIds: ObjectId[];

  streamIds: string[];

  type: string;

  sessionId: string;

  isStreaming: number;

  streamingTime: number;

  lastStreamingTime: Date;

  isFree: boolean;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<IStream>) {
    Object.assign(
      this,
      _.pick(data, [
        '_id',
        'performerId',
        'performerInfo',
        'userIds',
        'type',
        'streamIds',
        'sessionId',
        'isStreaming',
        'streamingTime',
        'lastStreamingTime',
        'isFree',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse(includePrivateInfo = false) {
    const publicInfo = {
      _id: this._id,
      isStreaming: this.isStreaming,
      streamingTime: this.streamingTime,
      lastStreamingTime: this.lastStreamingTime,
      isFree: this.isFree,
      performerId: this.performerId,
      performerInfo: this.performerInfo
    };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      userIds: this.userIds,
      type: this.type,
      streamIds: this.streamIds,
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
