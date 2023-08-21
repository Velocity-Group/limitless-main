import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { COMMENT_CHANNEL, OBJECT_TYPE } from 'src/modules/comment/contants';
import { EVENT } from 'src/kernel/constants';
import { TRENDING_CHANNEL } from 'src/modules/trending/trending.listener';
import { TRENDING_SOURCES } from 'src/modules/trending/constants';
import { FeedService } from '../services/feed.service';

const COMMENT_FEED_CHANNEL = 'COMMENT_FEED_CHANNEL';

@Injectable()
export class CommentFeedListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly feedService: FeedService
  ) {
    this.queueEventService.subscribe(
      COMMENT_CHANNEL,
      COMMENT_FEED_CHANNEL,
      this.handleCommentFeed.bind(this)
    );
  }

  public async handleCommentFeed(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { objectId: feedId, objectType } = event.data;
    if (objectType !== OBJECT_TYPE.FEED) {
      return;
    }
    await this.feedService.handleCommentStat(
      feedId,
      event.eventName === EVENT.CREATED ? 1 : -1
    );
    const feed = await this.feedService.findById(feedId);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRENDING_CHANNEL,
        eventName: event.eventName,
        data: {
          source: TRENDING_SOURCES.FEED,
          type: 'totalComments',
          sourceId: feedId,
          performerId: feed.fromSourceId
        }
      })
    );
  }
}
