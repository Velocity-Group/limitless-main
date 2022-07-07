import { SearchRequest } from 'src/kernel/common';

export class FollowSearchRequestPayload extends SearchRequest {
  followerId: string;

  followingId: string;
}
