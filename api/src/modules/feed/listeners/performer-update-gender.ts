import { Injectable, Inject } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PERFORMER_UPDATE_GENDER_CHANNEL } from 'src/modules/performer/constants';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { FEED_PROVIDER } from '../providers';
import { FeedModel } from '../models';

const PERFORMER_GENDER_TOPIC = 'PERFORMER_GENDER_TOPIC';

@Injectable()
export class UpdatePerformerGenderListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    @Inject(FEED_PROVIDER)
    private readonly feedModel: Model<FeedModel>
  ) {
    this.queueEventService.subscribe(
      PERFORMER_UPDATE_GENDER_CHANNEL,
      PERFORMER_GENDER_TOPIC,
      this.handleUpdateOrientation.bind(this)
    );
  }

  public async handleUpdateOrientation(event: QueueEvent) {
    if (![EVENT.UPDATED].includes(event.eventName)) {
      return false;
    }
    const {
      oldGender, gender, _id
    } = event.data;
    if (oldGender === gender) {
      return false;
    }
    await this.feedModel.updateMany({
      fromSourceId: _id
    }, {
      orientation: gender
    });
    return true;
  }
}
