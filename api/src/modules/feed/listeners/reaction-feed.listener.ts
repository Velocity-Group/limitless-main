import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { REACTION_CHANNEL, REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import { TRENDING_CHANNEL } from 'src/modules/trending/trending.listener';
import { TRENDING_SOURCES } from 'src/modules/trending/constants';
import { FEED_PROVIDER } from '../providers';
import { FeedModel } from '../models/feed.model';

const REACTION_FEED_CHANNEL = 'REACTION_FEED_CHANNEL';

@Injectable()
export class ReactionFeedListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    private readonly queueEventService: QueueEventService,
    @Inject(FEED_PROVIDER)
    private readonly feedModel: Model<FeedModel>
  ) {
    this.queueEventService.subscribe(
      REACTION_CHANNEL,
      REACTION_FEED_CHANNEL,
      this.handleReactFeed.bind(this)
    );
  }

  public async handleReactFeed(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { objectId, objectType, action } = event.data;
    if (![REACTION_TYPE.FEED].includes(objectType)) {
      return;
    }
    const feed = await this.feedModel.findById(objectId);
    if (!feed) return;
    if (action === REACTION.LIKE) {
      await this.feedModel.updateOne({ _id: objectId }, { $inc: { totalLike: event.eventName === EVENT.CREATED ? 1 : -1 } });
      await this.performerService.updateLikeStat(feed.fromSourceId, event.eventName === EVENT.CREATED ? 1 : -1);
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRENDING_CHANNEL,
          eventName: event.eventName,
          data: {
            source: TRENDING_SOURCES.FEED,
            type: 'totalLikes',
            sourceId: objectId,
            performerId: feed.fromSourceId
          }
        })
      );
    }
    if (action === REACTION.BOOK_MARK) {
      await this.feedModel.updateOne({ _id: objectId }, { $inc: { totalBookmark: event.eventName === EVENT.CREATED ? 1 : -1 } });
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRENDING_CHANNEL,
          eventName: event.eventName,
          data: {
            source: TRENDING_SOURCES.FEED,
            type: 'totalBookmarks',
            sourceId: objectId,
            performerId: feed.fromSourceId
          }
        })
      );
    }
  }
}
