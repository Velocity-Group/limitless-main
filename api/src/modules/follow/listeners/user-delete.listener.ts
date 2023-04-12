import { Injectable, Inject } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { EVENT } from 'src/kernel/constants';
import { DELETE_PERFORMER_CHANNEL } from 'src/modules/performer/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FOLLOW_MODEL_PROVIDER } from '../providers';
import { FollowModel } from '../models/follow.model';

const DELETE_PERFORMER_FOLLOW_TOPIC = 'DELETE_PERFORMER_FOLLOW_TOPIC';

@Injectable()
export class DeletePerformerFollowListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    @Inject(FOLLOW_MODEL_PROVIDER)
    private readonly followModel: Model<FollowModel>
  ) {
    this.queueEventService.subscribe(
      DELETE_PERFORMER_CHANNEL,
      DELETE_PERFORMER_FOLLOW_TOPIC,
      this.handleDeleteData.bind(this)
    );
  }

  private async handleDeleteData(event: QueueEvent): Promise<void> {
    if (event.eventName !== EVENT.DELETED) return;
    const performer = event.data as PerformerDto;
    await this.followModel.deleteMany({
      followingId: performer._id
    });
  }
}
