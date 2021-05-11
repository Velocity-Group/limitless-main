import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDto } from 'src/modules/user/dtos';
import { PaymentTokenModel } from '../models/purchase-item.model';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from '../providers';
import {
  PURCHASE_ITEM_STATUS,
  PurchaseItemType
} from '../constants';

@Injectable()
export class PaymentTokenService {
  constructor(
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly paymentTokenModel: Model<PaymentTokenModel>
  ) {}

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
