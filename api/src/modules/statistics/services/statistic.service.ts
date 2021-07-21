import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { FEED_PROVIDER } from 'src/modules/feed/providers';
import { FeedModel } from 'src/modules/feed/models';
import {
  PERFORMER_GALLERY_MODEL_PROVIDER, PERFORMER_PHOTO_MODEL_PROVIDER,
  PERFORMER_PRODUCT_MODEL_PROVIDER, PERFORMER_VIDEO_MODEL_PROVIDER
} from 'src/modules/performer-assets/providers';
import {
  GalleryModel, PhotoModel, ProductModel, VideoModel
} from 'src/modules/performer-assets/models';
import { USER_MODEL_PROVIDER } from 'src/modules/user/providers';
import { UserModel } from 'src/modules/user/models';
import { PERFORMER_MODEL_PROVIDER } from 'src/modules/performer/providers';
import { PerformerModel } from 'src/modules/performer/models';
import { SUBSCRIPTION_MODEL_PROVIDER } from 'src/modules/subscription/providers/subscription.provider';
import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { ORDER_MODEL_PROVIDER } from 'src/modules/order/providers';
import { OrderModel } from 'src/modules/order/models';
import { EARNING_MODEL_PROVIDER } from 'src/modules/earning/providers/earning.provider';
import { EarningModel } from 'src/modules/earning/models/earning.model';
import { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_PENDING_EMAIL_CONFIRMATION } from 'src/modules/user/constants';
import { ORDER_STATUS } from 'src/modules/order/constants';

@Injectable()
export class StatisticService {
  constructor(
    @Inject(PERFORMER_GALLERY_MODEL_PROVIDER)
    private readonly galleryModel: Model<GalleryModel>,
    @Inject(PERFORMER_PHOTO_MODEL_PROVIDER)
    private readonly photoModel: Model<PhotoModel>,
    @Inject(PERFORMER_PRODUCT_MODEL_PROVIDER)
    private readonly productModel: Model<ProductModel>,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly videoModel: Model<VideoModel>,
    @Inject(FEED_PROVIDER)
    private readonly feedModel: Model<FeedModel>,
    @Inject(USER_MODEL_PROVIDER)
    private readonly userModel: Model<UserModel>,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>,
    @Inject(ORDER_MODEL_PROVIDER)
    private readonly orderModel: Model<OrderModel>,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>
  ) { }

  public async stats(): Promise<any> {
    const totalActiveUsers = await this.userModel.countDocuments({ status: STATUS_ACTIVE });
    const totalInactiveUsers = await this.userModel.countDocuments({ status: STATUS_INACTIVE });
    const totalPendingUsers = await this.userModel.countDocuments({ status: STATUS_PENDING_EMAIL_CONFIRMATION });
    const totalActivePerformers = await this.performerModel.countDocuments({ status: STATUS_ACTIVE });
    const totalInactivePerformers = await this.performerModel.countDocuments({ status: STATUS_INACTIVE });
    const totalPendingPerformers = await this.performerModel.countDocuments({ verifiedDocument: false });
    const totalGalleries = await this.galleryModel.countDocuments({ });
    const totalPhotos = await this.photoModel.countDocuments({ });
    const totalVideos = await this.videoModel.countDocuments({});
    const totalPosts = await this.feedModel.countDocuments({ });
    // const totalActiveSubscribers = await this.subscriptionModel.countDocuments({ expiredAt: { $gte: new Date() }, status: SUBSCRIPTION_STATUS.ACTIVE });
    const totalSubscribers = await this.subscriptionModel.countDocuments({ });
    const totalDeliveredOrders = await this.orderModel.countDocuments({ deliveryStatus: ORDER_STATUS.DELIVERED });
    const totalShippingdOrders = await this.orderModel.countDocuments({ deliveryStatus: ORDER_STATUS.SHIPPING });
    const totalRefundedOrders = await this.orderModel.countDocuments({ deliveryStatus: ORDER_STATUS.REFUNDED });
    const totalProducts = await this.productModel.countDocuments({});
    const [totalGrossPrice, totalNetPrice, totalGrossToken, totalNetToken] = await Promise.all([
      this.earningModel.aggregate([
        {
          $match: {
            isToken: false
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$grossPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            isToken: false
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            isToken: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$grossPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            isToken: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ])
    ]);
    return {
      totalActiveUsers,
      totalInactiveUsers,
      totalPendingUsers,
      totalActivePerformers,
      totalInactivePerformers,
      totalPendingPerformers,
      totalPosts,
      totalGalleries,
      totalPhotos,
      totalVideos,
      totalProducts,
      totalSubscribers,
      // totalActiveSubscribers,
      // totalInactiveSubscribers: totalSubscribers - totalActiveSubscribers,
      totalDeliveredOrders,
      totalShippingdOrders,
      totalRefundedOrders,
      totalGrossPrice: totalGrossPrice[0]?.total || 0,
      totalNetPrice: totalNetPrice[0]?.total || 0,
      totalPriceCommission: (totalGrossPrice[0]?.total - totalNetPrice[0]?.total) || 0,
      totalGrossToken: totalGrossToken[0]?.total || 0,
      totalNetToken: totalNetToken[0]?.total || 0,
      totalTokenCommission: (totalGrossToken[0]?.total - totalNetToken[0]?.total) || 0
    };
  }
}
