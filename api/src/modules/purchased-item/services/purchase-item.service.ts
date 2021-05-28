/* eslint-disable no-nested-ternary */
/* eslint-disable no-await-in-loop */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  VideoService,
  ProductService,
  GalleryService
} from 'src/modules/performer-assets/services';
import { GalleryDto, VideoDto } from 'src/modules/performer-assets/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { PRODUCT_TYPE } from 'src/modules/performer-assets/constants';
import { FeedService } from 'src/modules/feed/services';
import { FeedDto } from 'src/modules/feed/dtos';
import { SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { toObjectId, generateUuid } from 'src/kernel/helpers/string.helper';
// import { ConversationService } from 'src/modules/message/services';
import { StreamService } from 'src/modules/stream/services';
import { StreamModel } from 'src/modules/stream/models';
import { GROUP_CHAT, PRIVATE_CHAT, PUBLIC_CHAT } from 'src/modules/stream/constant';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
// import { FileService } from 'src/modules/file/services';
import { UserDto } from 'src/modules/user/dtos';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from '../providers';
import { PaymentTokenModel } from '../models';
import {
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_TARTGET_TYPE,
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS,
  ROLE, PURCHASE_ITEM_TARGET_SOURCE
} from '../constants';
import {
  NotEnoughMoneyException,
  OverProductStockException
} from '../exceptions';
import {
  PurchaseProductsPayload,
  SendTipsPayload
} from '../payloads';
import { PaymentDto } from '../dtos';

@Injectable()
export class PurchaseItemService {
  constructor(
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly TokenPaymentModel: Model<PaymentTokenModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketService: SocketUserService,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => FeedService))
    private readonly feedService: FeedService,
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService
    // @Inject(forwardRef(() => ConversationService))
    // private readonly conversationService: ConversationService,
    // @Inject(forwardRef(() => MessageService))
    // private readonly messageService: MessageService,
    // @Inject(forwardRef(() => FileService))
    // private readonly fileService: FileService
  ) { }

  public async findById(id: string | ObjectId) {
    return this.TokenPaymentModel.findById(id);
  }

  public async createSubscriptionPaymentTransaction(type: string, performer: any, user: UserDto) {
    const paymentTransaction = new this.TokenPaymentModel({
      source: PURCHASE_ITEM_TARGET_SOURCE.USER,
      sourceId: user._id,
      target: PURCHASE_ITEM_TARTGET_TYPE.PERFORMER,
      targetId: performer._id,
      performerId: performer._id,
      type: type === SUBSCRIPTION_TYPE.MONTHLY
        ? PURCHASE_ITEM_TYPE.MONTHLY_SUBSCRIPTION
        : type === SUBSCRIPTION_TYPE.YEARLY
          ? PURCHASE_ITEM_TYPE.YEARLY_SUBSCRIPTION
          : PURCHASE_ITEM_TYPE.FREE_SUBSCRIPTION,
      totalPrice: type === SUBSCRIPTION_TYPE.MONTHLY
        ? performer.monthlyPrice.toFixed(2)
        : type === SUBSCRIPTION_TYPE.YEARLY
          ? performer.yearlyPrice.toFixed(2)
          : 0,
      originalPrice: type === SUBSCRIPTION_TYPE.MONTHLY
        ? performer.monthlyPrice.toFixed(2)
        : type === SUBSCRIPTION_TYPE.YEARLY
          ? performer.yearlyPrice.toFixed(2)
          : 0,

      products: {
        name: `${performer.name} @${performer.username}`,
        description: `${type}_subscription ${performer.name}`,
        price:
          type === SUBSCRIPTION_TYPE.MONTHLY
            ? performer.monthlyPrice.toFixed(2)
            : type === SUBSCRIPTION_TYPE.YEARLY
              ? performer.yearlyPrice.toFixed(2)
              : 0,
        productId: performer._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.PERFORMER,
        performerId: performer._id,
        quantity: 1
      },
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });

    await paymentTransaction.save();
    return paymentTransaction;
  }

  public async purchaseProduct(
    id: string | ObjectId,
    user: PerformerDto,
    payload: PurchaseProductsPayload
  ) {
    const product = await this.productService.findById(id);
    if (!product) throw new EntityNotFoundException();
    if (user.balance < product.price) throw new NotEnoughMoneyException();
    const quantity = payload.quantity || 1;
    if (product.type === PRODUCT_TYPE.PHYSICAL && quantity > product.stock) {
      throw new OverProductStockException();
    }
    const storeProducts = [];
    let totalPrice = 0;
    totalPrice += quantity * product.price;
    storeProducts.push({
      quantity,
      price: quantity * product.price,
      name: product.name,
      description: `purchase product ${product.name} x${quantity}`,
      productId: product._id,
      productType: product.type,
      performerId: product.performerId
    });
    const transaction = await this.createPaymentTokenProduct(
      storeProducts,
      totalPrice,
      user
    );
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: { ...new PaymentDto(transaction), ...{ shippingInfo: payload } }
      })
    );
    return transaction;
  }

  public async createPaymentTokenProduct(
    products: any[],
    totalPrice: number,
    user: PerformerDto
  ) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = totalPrice;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.PRODUCT;
    paymentTransaction.targetId = products[0] && products[0].productId;
    paymentTransaction.performerId = products[0] && products[0].performerId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.PRODUCT;
    paymentTransaction.totalPrice = totalPrice;
    paymentTransaction.products = products;
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseStream(streamId: string, user: UserDto) {
    const stream = await this.streamService.findOne({ _id: streamId });
    if (stream.isFree) {
      return { success: true };
    }
    const performer = await this.performerService.findById(stream.performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    let price = 0;
    let purchaseItemType = '';
    switch (stream.type) {
      case PUBLIC_CHAT:
        price = performer.publicChatPrice;
        purchaseItemType = PURCHASE_ITEM_TYPE.PUBLIC_CHAT;
        break;
      case GROUP_CHAT:
        price = performer.groupChatPrice;
        purchaseItemType = PURCHASE_ITEM_TYPE.GROUP_CHAT;
        break;
      case PRIVATE_CHAT:
        price = performer.privateChatPrice;
        purchaseItemType = PURCHASE_ITEM_TYPE.PRIVATE_CHAT;
        break;
      default: break;
    }

    if (user.balance < price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenStream(stream, purchaseItemType, price, performer, user);
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(transaction)
      })
    );
    return transaction;
  }

  public async createPaymentTokenStream(stream: StreamModel, purchaseItemType: string, price: number, performer: any, user: UserDto) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.STREAM;
    paymentTransaction.targetId = stream._id;
    paymentTransaction.performerId = stream.performerId;
    paymentTransaction.type = purchaseItemType;
    paymentTransaction.totalPrice = price;
    paymentTransaction.products = [
      {
        name: `${purchaseItemType} ${performer?.name || performer?.username || 'N/A'}`,
        description: `${purchaseItemType} ${performer?.name || performer?.username || 'N/A'}`,
        price,
        productId: stream._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
        performerId: stream.performerId,
        quantity: 1
      }
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseVideo(id: string | ObjectId, user: PerformerDto) {
    const video = await this.videoService.findById(id);
    if (!video || (video && !video.isSale) || (video && !video.price)) {
      throw new EntityNotFoundException();
    }
    if (user.balance < video.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenVideo(video, user);
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(transaction)
      })
    );
    return transaction;
  }

  public async createPaymentTokenVideo(video: VideoDto, user: PerformerDto) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = video.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.VIDEO;
    paymentTransaction.targetId = video._id;
    paymentTransaction.performerId = video.performerId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.VIDEO;
    paymentTransaction.totalPrice = video.price;
    paymentTransaction.products = [
      {
        name: video.title,
        description: `purchase video ${video.title}`,
        price: video.price,
        productId: video._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.VIDEO,
        performerId: video.performerId,
        quantity: 1
      }
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseGallery(id: string | ObjectId, user: PerformerDto) {
    const gallery = await this.galleryService.findById(id);
    if (!gallery || (gallery && !gallery.price)) {
      throw new EntityNotFoundException();
    }
    if (user.balance < gallery.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenPhotoGallery(
      gallery,
      user
    );
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(transaction)
      })
    );
    return transaction;
  }

  public async createPaymentTokenPhotoGallery(
    gallery: GalleryDto,
    user: PerformerDto
  ) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = gallery.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.GALLERY;
    paymentTransaction.targetId = gallery._id;
    paymentTransaction.performerId = gallery.performerId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.GALLERY;
    paymentTransaction.totalPrice = gallery.price;
    paymentTransaction.products = [
      {
        name: gallery.title,
        description: `purchase gallery ${gallery.title}`,
        price: gallery.price,
        productId: gallery._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.GALLERY,
        performerId: gallery.performerId,
        quantity: 1
      }
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  async sendTips(user: PerformerDto, performerId: string, payload: SendTipsPayload) {
    const { price, conversationId, streamType } = payload;
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    if (!price || user.balance < price) {
      throw new NotEnoughMoneyException();
    }

    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = price;
    paymentTransaction.totalPrice = price;
    paymentTransaction.source = ROLE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.PERFORMER;
    paymentTransaction.performerId = performer._id;
    paymentTransaction.targetId = performer._id;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.TIP;
    paymentTransaction.products = [
      {
        name: `Tip to ${performer.name || performer.username || performer._id}`,
        description: `Tip ${price} tokens to ${performer.name || performer.username || performer._id}`,
        price,
        productId: performer._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.PERFORMER,
        performerId: performer._id,
        quantity: 1
      }
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(paymentTransaction)
      })
    );
    if (conversationId && streamType) {
      // send notification to room chat
      const roomName = this.streamService.getRoomName(conversationId, streamType);
      await this.socketService.emitToRoom(
        roomName,
        `message_created_conversation_${conversationId}`,
        {
          text: `${user?.name || user?.username} tip ${price} tokens`,
          _id: generateUuid(),
          conversationId: payload.conversationId,
          isTip: true
        }
      );
    }
    if (conversationId && !streamType) {
      // send notification to conversation
      await this.socketService.emitToUsers(
        performerId,
        'message_created',
        {
          text: `${user?.name || user?.username} tipped ${price.toFixed(2)} tokens to you`,
          _id: generateUuid(),
          isSystem: true
        }
      );
    }
    return paymentTransaction;
  }

  // async sendGift(user: PerformerDto, giftId: string, payload: SendGiftPayload) {
  //   const { performerId, conversationId } = payload;
  //   const performer = await this.performerService.findById(performerId);
  //   if (!performer) {
  //     throw new EntityNotFoundException();
  //   }
  //   const gift = await this.giftService.findById(giftId);
  //   if (!gift) {
  //     throw new EntityNotFoundException();
  //   }
  //   if (!gift || user.balance < gift.price) {
  //     throw new NotEnoughMoneyException();
  //   }

  //   const paymentTransaction = new this.TokenPaymentModel();
  //   paymentTransaction.originalPrice = gift.price;
  //   paymentTransaction.totalPrice = gift.price;
  //   paymentTransaction.source = ROLE.PERFORMER;
  //   paymentTransaction.sourceId = user._id;
  //   paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.PERFORMER;
  //   paymentTransaction.performerId = performer._id;
  //   paymentTransaction.targetId = performer._id;
  //   paymentTransaction.type = PURCHASE_ITEM_TYPE.GIFT;
  //   paymentTransaction.products = [
  //     {
  //       name: `Send ${gift.title} to ${performer?.name || performer?.username || 'N/A'}`,
  //       description: `Send a ${gift.price.toFixed(2)} tokens gift to ${performer?.name || performer?.username || 'N/A'}`,
  //       price: gift.price,
  //       productId: performer._id,
  //       productType: PURCHASE_ITEM_TARTGET_TYPE.PERFORMER,
  //       performerId: performer._id,
  //       quantity: 1
  //     }
  //   ];
  //   paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
  //   await paymentTransaction.save();
  //   await this.queueEventService.publish(
  //     new QueueEvent({
  //       channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
  //       eventName: EVENT.CREATED,
  //       data: new PaymentDto(paymentTransaction)
  //     })
  //   );
  //   if (conversationId) {
  //     const conversation = await this.conversationService.findById(conversationId);
  //     const stream = conversation.streamId && await this.streamService.findOne({ _id: conversation.streamId });
  //     // send notification to room chat
  //     if (stream) {
  //       const roomName = this.streamService.getRoomName(conversationId, `stream_${stream.type}`);
  //       const file = gift.fileId && await this.fileService.findById(gift.fileId);
  //       if (file) {
  //         const thumbs = new FileDto(file).getThumbnails();
  //         await this.socketService.emitToRoom(
  //           roomName,
  //           `message_created_conversation_${conversationId}`,
  //           {
  //             text: `${user?.name || user?.username} send a ${gift.title.toUpperCase()} <img src="${thumbs[0]}" alt="gift-img" />`,
  //             _id: generateUuid(),
  //             conversationId,
  //             isGift: true
  //           }
  //         );
  //       } else {
  //         await this.socketService.emitToRoom(
  //           roomName,
  //           `message_created_conversation_${conversationId}`,
  //           {
  //             text: `${user?.name || user?.username} send a ${gift.title} ${gift.price.toFixed(2)}`,
  //             _id: generateUuid(),
  //             conversationId,
  //             isGift: true
  //           }
  //         );
  //       }
  //     }
  //   }
  //   return paymentTransaction;
  // }

  public async purchasePostFeed(id: string | ObjectId, user: PerformerDto) {
    const feed = await this.feedService.findById(id);
    if (!feed || (feed && !feed.price)) {
      throw new EntityNotFoundException();
    }
    if (user.balance < feed.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenFeed(
      new FeedDto(feed),
      user
    );
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(transaction)
      })
    );
    return transaction;
  }

  public async createPaymentTokenFeed(
    feed: FeedDto,
    user: PerformerDto
  ) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = feed.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.FEED;
    paymentTransaction.targetId = toObjectId(feed._id);
    paymentTransaction.performerId = toObjectId(feed.fromSourceId);
    paymentTransaction.type = PURCHASE_ITEM_TYPE.FEED;
    paymentTransaction.totalPrice = feed.price;
    paymentTransaction.products = [
      {
        name: 'Purchase post feed',
        description: feed.text,
        price: feed.price,
        productId: toObjectId(feed._id),
        productType: PURCHASE_ITEM_TARTGET_TYPE.FEED,
        performerId: toObjectId(feed.fromSourceId),
        quantity: 1
      }
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  // public async purchaseMessage(messageId: string | ObjectId, user: PerformerDto) {
  //   const message = await this.messageService.findById(messageId);
  //   if (!message || !message.isSale) {
  //     throw new EntityNotFoundException();
  //   }
  //   if (user.balance < message.price) throw new NotEnoughMoneyException();
  //   const transaction = await this.createPaymentTokenMessage(
  //     message,
  //     user
  //   );
  //   // TODO - earning listener, order listener
  //   await this.queueEventService.publish(
  //     new QueueEvent({
  //       channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
  //       eventName: EVENT.CREATED,
  //       data: new PaymentDto(transaction)
  //     })
  //   );
  //   return transaction;
  // }

  // public async createPaymentTokenMessage(
  //   message,
  //   user
  // ) {
  //   const paymentTransaction = new this.TokenPaymentModel();
  //   paymentTransaction.originalPrice = message.price;
  //   paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
  //   paymentTransaction.sourceId = user._id;
  //   paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.MESSAGE;
  //   paymentTransaction.targetId = message._id;
  //   paymentTransaction.performerId = message.senderId;
  //   paymentTransaction.type = PURCHASE_ITEM_TYPE.MESSAGE;
  //   paymentTransaction.totalPrice = message.price;
  //   paymentTransaction.products = [
  //     {
  //       name: 'Unlock message',
  //       description: message.text,
  //       price: message.price,
  //       productId: message._id,
  //       productType: PURCHASE_ITEM_TARTGET_TYPE.MESSAGE,
  //       performerId: message.senderId,
  //       quantity: 1
  //     }
  //   ];
  //   paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
  //   return paymentTransaction.save();
  // }
}
