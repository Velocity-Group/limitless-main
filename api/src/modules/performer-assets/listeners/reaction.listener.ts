import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { REACTION_CHANNEL, REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { EVENT } from 'src/kernel/constants';
import { TRENDING_CHANNEL } from 'src/modules/trending/trending.listener';
import { TRENDING_SOURCES } from 'src/modules/trending/constants';
import { VideoService } from '../services/video.service';
import { GalleryService, ProductService } from '../services';

const REACTION_ASSETS_TOPIC = 'REACTION_ASSETS_TOPIC';

@Injectable()
export class ReactionAssetsListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly videoService: VideoService,
    private readonly galleryService: GalleryService,
    private readonly productService: ProductService
  ) {
    this.queueEventService.subscribe(
      REACTION_CHANNEL,
      REACTION_ASSETS_TOPIC,
      this.handleReaction.bind(this)
    );
  }

  public async handleReaction(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const {
      objectId, objectType, action
    } = event.data;
    if (objectType === REACTION_TYPE.VIDEO) {
      const video = await this.videoService.findById(objectId);
      if (!video) return;
      switch (action) {
        case REACTION.LIKE:
          await this.videoService.increaseLike(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRENDING_CHANNEL,
              eventName: event.eventName,
              data: {
                source: TRENDING_SOURCES.VIDEO,
                type: 'totalLikes',
                sourceId: objectId,
                performerId: video.performerId
              }
            })
          );
          break;
        case REACTION.BOOK_MARK:
          await this.videoService.increaseFavourite(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRENDING_CHANNEL,
              eventName: event.eventName,
              data: {
                source: TRENDING_SOURCES.VIDEO,
                type: 'totalBookmarks',
                sourceId: objectId,
                performerId: video.performerId
              }
            })
          );
          break;
        default: break;
      }
    }
    if (objectType === REACTION_TYPE.GALLERY) {
      const gallery = await this.galleryService.findById(objectId);
      if (!gallery) return;
      switch (action) {
        case REACTION.LIKE:
          await this.galleryService.updateLikeStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRENDING_CHANNEL,
              eventName: event.eventName,
              data: {
                source: TRENDING_SOURCES.GALLERY,
                type: 'totalLikes',
                sourceId: objectId,
                performerId: gallery.performerId
              }
            })
          );
          break;
        case REACTION.BOOK_MARK:
          await this.galleryService.updateBookmarkStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRENDING_CHANNEL,
              eventName: event.eventName,
              data: {
                source: TRENDING_SOURCES.GALLERY,
                type: 'totalBookmarks',
                sourceId: objectId,
                performerId: gallery.performerId
              }
            })
          );
          break;
        default: break;
      }
    }
    if (objectType === REACTION_TYPE.PRODUCT) {
      const product = await this.productService.findById(objectId);
      if (!product) return;
      switch (action) {
        case REACTION.LIKE:
          await this.productService.updateLikeStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRENDING_CHANNEL,
              eventName: event.eventName,
              data: {
                source: TRENDING_SOURCES.PRODUCT,
                type: 'totalLikes',
                sourceId: objectId,
                performerId: product.performerId
              }
            })
          );
          break;
        case REACTION.BOOK_MARK:
          await this.productService.updateBookmarkStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );

          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRENDING_CHANNEL,
              eventName: event.eventName,
              data: {
                source: TRENDING_SOURCES.PRODUCT,
                type: 'totalBookmarks',
                sourceId: objectId,
                performerId: product.performerId
              }
            })
          );
          break;
        default: break;
      }
    }
  }
}
