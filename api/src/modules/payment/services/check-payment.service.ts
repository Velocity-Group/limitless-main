import { Injectable, Inject } from '@nestjs/common';
import { EntityNotFoundException } from 'src/kernel';
import { Model } from 'mongoose';
import { ProductDto, VideoDto } from 'src/modules/performer-assets/dtos';
import { FeedDto } from 'src/modules/feed/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import { PaymentTransactionModel } from '../models';
import {
  PAYMENT_STATUS,
  PAYMENT_TYPE
} from '../constants';

@Injectable()
export class CheckPaymentService {
  constructor(
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly paymentTransactionModel: Model<PaymentTransactionModel>
  ) { }

  public checkBoughtVideo = async (video: VideoDto, user: PerformerDto) => {
    if (!video || (video && !video.isSale) || (video && !video.price)) {
      throw new EntityNotFoundException();
    }
    if (video.performerId.toString() === user._id.toString()) {
      return 1;
    }
    return this.paymentTransactionModel.countDocuments({
      type: PAYMENT_TYPE.SALE_VIDEO,
      targetId: video._id,
      sourceId: user._id,
      status: PAYMENT_STATUS.SUCCESS
    });
  }

  public async checkBoughtProduct(product: ProductDto, user: PerformerDto) {
    if (!product || (product && !product.price)) {
      throw new EntityNotFoundException();
    }
    if (product.performerId.toString() === user._id.toString()) {
      return 1;
    }
    return this.paymentTransactionModel.countDocuments({
      type: PAYMENT_TYPE.PRODUCT,
      targetId: product._id,
      sourceId: user._id,
      status: PAYMENT_STATUS.SUCCESS
    });
  }

  public checkBoughtFeed = async (feed: FeedDto, user: PerformerDto) => {
    if (!feed || (feed && !feed.isSale) || (feed && !feed.price)) {
      throw new EntityNotFoundException();
    }
    if (feed.fromSourceId.toString() === user._id.toString()) {
      return 1;
    }
    return this.paymentTransactionModel.countDocuments({
      type: PAYMENT_TYPE.FEED,
      targetId: feed._id,
      sourceId: user._id,
      status: PAYMENT_STATUS.SUCCESS
    });
  }
}
