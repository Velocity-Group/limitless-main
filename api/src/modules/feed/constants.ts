/* eslint-disable no-shadow */
export const FEED_TYPES = ['text', 'video', 'photo', 'audio'];

export enum FEED_TYPE {
  TEXT = 'text',
  VIDEO = 'video',
  PHOTO = 'photo',
  AUDIO = 'audio'
}

export const FEED_SOURCE = {
  PERFORMER: 'performer'
};

export const POLL_TARGET_SOURCE = {
  FEED: 'feed'
};

export const VOTE_TARGET_SOURCE = {
  POLL_FEED: 'POLL_FEED'
};

export const PERFORMER_FEED_CHANNEL = 'PERFORMER_FEED_CHANNEL';

export const VOTE_FEED_CHANNEL = 'VOTE_FEED_CHANNEL';

export const FEED_VIDEO_CHANNEL = 'FEED_VIDEO_CHANNEL';

export const FEED_TEASER_CHANNEL = 'FEED_TEASER_CHANNEL';

export const FEED_AUDIO_CHANNEL = 'FEED_AUDIO_CHANNEL';

export const SCHEDULE_FEED_AGENDA = 'SCHEDULE_FEED_AGENDA';

export const STREAM_FEED_CHANNEL = 'STREAM_FEED_CHANNEL';
