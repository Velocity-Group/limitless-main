import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { REACTION_CHANNEL, REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { EVENT } from 'src/kernel/constants';
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
      switch (action) {
        case REACTION.LIKE:
          await this.videoService.increaseLike(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          break;
        case REACTION.BOOK_MARK:
          await this.videoService.increaseFavourite(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          break;
        default: break;
      }
    }
    if (objectType === REACTION_TYPE.GALLERY) {
      switch (action) {
        case REACTION.LIKE:
          await this.galleryService.updateLikeStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          break;
        case REACTION.BOOK_MARK:
          await this.galleryService.updateBookmarkStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          break;
        default: break;
      }
    }
    if (objectType === REACTION_TYPE.PRODUCT) {
      switch (action) {
        case REACTION.LIKE:
          await this.productService.updateLikeStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          break;
        case REACTION.BOOK_MARK:
          await this.productService.updateBookmarkStats(
            objectId,
            event.eventName === EVENT.CREATED ? 1 : -1
          );
          break;
        default: break;
      }
    }
  }
}
