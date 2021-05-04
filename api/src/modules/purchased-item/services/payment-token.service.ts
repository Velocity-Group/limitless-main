import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { VideoDto } from 'src/modules/performer-assets/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { PaymentTokenModel } from '../models/purchase-item.model';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from '../providers';
import {
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_STATUS,
  PurchaseItemType
} from '../constants';

@Injectable()
export class PaymentTokenService {
  constructor(
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly paymentTokenModel: Model<PaymentTokenModel>
  ) {}

  public async checkBoughtVideo(
    video: VideoDto,
    user: UserDto
  ): Promise<boolean> {
    if (!user) return false;
    if (`${user._id}` === `${video.performerId}`) return true;
    const transaction = await this.paymentTokenModel.findOne({
      targetId: video._id,
      sourceId: user._id,
      type: PURCHASE_ITEM_TYPE.SALE_VIDEO,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    return !!transaction;
  }

  public async checkBought(
    item: any,
    type: PurchaseItemType,
    user: UserDto
  ) {
    if (!user) return false;
    if (`${user._id}` === `${item.performerId}` || `${user._id}` === `${item.fromSourceId}`) return true;
    const transaction = await this.paymentTokenModel.findOne({
      type,
      targetId: item._id,
      sourceId: user._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    return !!transaction;
  }
}
