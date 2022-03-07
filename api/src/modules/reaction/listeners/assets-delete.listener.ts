import { Injectable, Inject } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { EVENT } from 'src/kernel/constants';
import { DELETED_ASSETS_CHANNEL } from 'src/modules/performer-assets/constants';
import { REACT_MODEL_PROVIDER } from '../providers/reaction.provider';
import { ReactionModel } from '../models/reaction.model';

const DELETE_ASSETS_REACTION_TOPIC = 'DELETE_ASSETS_REACTION_TOPIC';

@Injectable()
export class DeleteAssetsListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    @Inject(REACT_MODEL_PROVIDER)
    private readonly reactionModel: Model<ReactionModel>
  ) {
    this.queueEventService.subscribe(
      DELETED_ASSETS_CHANNEL,
      DELETE_ASSETS_REACTION_TOPIC,
      this.handleDeleteData.bind(this)
    );
  }

  private async handleDeleteData(event: QueueEvent): Promise<void> {
    if (event.eventName !== EVENT.DELETED) return;
    const { _id } = event.data;
    await this.reactionModel.deleteMany({
      objectId: _id
    });
  }
}
