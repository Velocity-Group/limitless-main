import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { COMMENT_CHANNEL, OBJECT_TYPE } from 'src/modules/comment/contants';
import { EVENT } from 'src/kernel/constants';
import { TRENDING_CHANNEL } from 'src/modules/trending/trending.listener';
import { TRENDING_SOURCES } from 'src/modules/trending/constants';
import { VideoService } from '../services/video.service';
import { GalleryService, ProductService } from '../services';

const COMMENT_ASSETS_TOPIC = 'COMMENT_ASSETS_TOPIC';

@Injectable()
export class CommentAssetsListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly videoService: VideoService,
    private readonly productService: ProductService,
    private readonly galleryService: GalleryService
  ) {
    this.queueEventService.subscribe(
      COMMENT_CHANNEL,
      COMMENT_ASSETS_TOPIC,
      this.handleComment.bind(this)
    );
  }

  public async handleComment(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { objectId, objectType } = event.data;
    if (objectType === OBJECT_TYPE.VIDEO) {
      const video = await this.videoService.findById(objectId);
      if (!video) return;
      await this.videoService.increaseComment(
        objectId,
        event.eventName === EVENT.CREATED ? 1 : -1
      );
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRENDING_CHANNEL,
          eventName: event.eventName,
          data: {
            source: TRENDING_SOURCES.VIDEO,
            type: 'totalComments',
            sourceId: objectId,
            performerId: video.performerId
          }
        })
      );
    }
    if (objectType === OBJECT_TYPE.PRODUCT) {
      const product = await this.productService.findById(objectId);
      if (!product) return;
      await this.productService.updateCommentStats(
        objectId,
        event.eventName === EVENT.CREATED ? 1 : -1
      );
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRENDING_CHANNEL,
          eventName: event.eventName,
          data: {
            source: TRENDING_SOURCES.PRODUCT,
            type: 'totalComments',
            sourceId: objectId,
            performerId: product.performerId
          }
        })
      );
    }
    if (objectType === OBJECT_TYPE.GALLERY) {
      const gallery = await this.galleryService.findById(objectId);
      if (!gallery) return;
      await this.galleryService.updateCommentStats(
        objectId,
        event.eventName === EVENT.CREATED ? 1 : -1
      );
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRENDING_CHANNEL,
          eventName: event.eventName,
          data: {
            source: TRENDING_SOURCES.GALLERY,
            type: 'totalComments',
            sourceId: objectId,
            performerId: gallery.performerId
          }
        })
      );
    }
  }
}
