import { QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable, Inject } from '@nestjs/common';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { TRENDING_MODEL_PROVIDER } from './provider';
import { TrendingModel } from './trending.model';

export const TRENDING_CHANNEL = 'TRENDING_CHANNEL';
const TRENDING_TOPIC = 'TRENDING_TOPIC';

@Injectable()
export class TrendingListener {
  constructor(
    @Inject(TRENDING_MODEL_PROVIDER)
  private readonly trendingModel: Model<TrendingModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      TRENDING_CHANNEL,
      TRENDING_TOPIC,
      this.handleCreate.bind(this)
    );
  }

  public async handleCreate(event: QueueEvent) {
    if (![EVENT.CREATED].includes(event.eventName)) {
      return;
    }
    const {
      sourceId, source, type, performerId
    } = event.data;
    const trending = await this.trendingModel.findOne({
      source, sourceId
    });
    trending && await this.trendingModel.updateOne({
      source, sourceId
    }, {
      updatedAt: new Date(),
      $inc: {
        [type]: 1
      }
    });
    !trending && await this.trendingModel.create({
      sourceId,
      source,
      type,
      performerId,
      [type]: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
