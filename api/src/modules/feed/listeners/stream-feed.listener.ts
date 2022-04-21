import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { ConversationModel } from 'src/modules/message/models';
import { StreamModel } from 'src/modules/stream/models';
import { STREAM_FEED_CHANNEL } from '../constants';
import { FeedModel } from '../models';
import { FEED_PROVIDER } from '../providers';

@Injectable()
export class StreamFeedListener {
  private logger = new Logger(StreamFeedListener.name);

  constructor(
    @Inject(FEED_PROVIDER) private readonly feedModel: Model<FeedModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      STREAM_FEED_CHANNEL,
      'handlestreamfeed',
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    return;

    // eslint-disable-next-line no-unreachable
    try {
      const { eventName, data } = event;

      const conversation = data.conversation as ConversationModel;
      const stream = data.stream as StreamModel;

      if (eventName === EVENT.CREATED) {
        await this.feedModel.create({
          type: 'stream',
          fromSource: 'performer',
          fromSourceId: conversation.performerId,
          targetId: conversation._id,
          isSale: !stream.isFree
        });
      }

      if (eventName === EVENT.DELETED) {
        await this.feedModel.deleteOne({
          type: 'stream',
          targetId: conversation._id
        });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}
