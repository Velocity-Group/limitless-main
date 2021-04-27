import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  ORDER_PAID_SUCCESS_CHANNEL,
  ORDER_STATUS,
  PAYMENT_TYPE,
  PRODUCT_TYPE,
  SELLER_SOURCE
} from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings';
import { EarningDto } from '../dtos/earning.dto';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';
import { PAYMENT_STATUS, PAYMENT_TARTGET_TYPE } from '../../payment/constants';
import { SETTING_KEYS } from '../../settings/constants';

const UPDATE_EARNING_CHANNEL = 'EARNING_CHANNEL';

@Injectable()
export class TransactionEarningListener {
  constructor(
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      ORDER_PAID_SUCCESS_CHANNEL,
      UPDATE_EARNING_CHANNEL,
      this.handleListenEarning.bind(this)
    );
  }

  public async handleListenEarning(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const { orderDetails, transaction } = event.data;
    if (transaction?.status !== PAYMENT_STATUS.SUCCESS || [PAYMENT_TYPE.FREE_SUBSCRIPTION, PAYMENT_TYPE.AUTHORISE_CARD].includes(transaction?.type)) {
      return;
    }
    const [
      settingMonthlyCommission,
      settingYearlyCommission,
      settingProductCommission,
      settingVideoCommission,
      settingTipCommission,
      settingFeedCommission,
      settingPublicChatCommission,
      settingPrivateChatCommission
    ] = await Promise.all([
      this.settingService.getKeyValue(
        SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION
      ),
      this.settingService.getKeyValue(
        SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION
      ),
      this.settingService.getKeyValue(SETTING_KEYS.PRODUCT_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.VIDEO_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.TIP_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.FEED_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.PUBLIC_CHAT_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.PRIVATE_CHAT_COMMISSION)
    ]);

    // eslint-disable-next-line no-restricted-syntax
    for (const orderDetail of orderDetails) {
      if (orderDetail.sellerSource === SELLER_SOURCE.PERFORMER && orderDetail.status === ORDER_STATUS.PAID) {
        // eslint-disable-next-line no-await-in-loop
        const performerCommissions = await this.performerService.getCommissions(transaction.performerId);

        // default commission
        let commission = 0.2;
        let sourceType = 'n/a';
        const defaultCommission = 0.2;
        switch (orderDetail.productType) {
          case PRODUCT_TYPE.DIGITAL_PRODUCT:
          case PRODUCT_TYPE.PHYSICAL_PRODUCT:
            commission = performerCommissions?.productSaleCommission || settingProductCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PERFORMER_PRODUCT;
            break;
          case PRODUCT_TYPE.SALE_VIDEO:
            commission = performerCommissions?.videoSaleCommission || settingVideoCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PERFORMER_VIDEO;
            break;
          case PRODUCT_TYPE.SALE_POST:
            commission = performerCommissions?.feedSaleCommission || settingFeedCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PERFORMER_POST;
            break;
          case PRODUCT_TYPE.TIP_PERFORMER:
            commission = performerCommissions?.tipCommission || settingTipCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PERFORMER;
            break;
          case PRODUCT_TYPE.YEARLY_SUBSCRIPTION:
            commission = performerCommissions?.yearlySubscriptionCommission || settingYearlyCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PERFORMER;
            break;
          case PRODUCT_TYPE.MONTHLY_SUBSCRIPTION:
            commission = performerCommissions?.monthlySubscriptionCommission || settingMonthlyCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PERFORMER;
            break;
          case PRODUCT_TYPE.PUBLIC_CHAT:
            commission = performerCommissions?.publicChatCommission || settingPublicChatCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PUBLIC_CHAT;
            break;
          case PRODUCT_TYPE.PRIVATE_CHAT:
            commission = performerCommissions?.privateChatCommission || settingPrivateChatCommission || defaultCommission;
            sourceType = PAYMENT_TARTGET_TYPE.PRIVATE_CHAT;
            break;
          default: break;
        }

        const netPrice = (orderDetail.totalPrice - (orderDetail.totalPrice * commission)).toFixed(2);
        // eslint-disable-next-line new-cap
        const newEarning = new this.earningModel();
        newEarning.set('commission', commission);
        newEarning.set('grossPrice', orderDetail.totalPrice);
        newEarning.set('netPrice', netPrice);
        newEarning.set('performerId', orderDetail.sellerId);
        newEarning.set('userId', orderDetail.buyerId);
        newEarning.set('transactionId', transaction._id);
        newEarning.set('orderId', orderDetail._id);
        newEarning.set('type', orderDetail.productType);
        newEarning.set('sourceType', sourceType);
        newEarning.set('createdAt', new Date(transaction.createdAt));
        newEarning.set('isPaid', true);
        newEarning.set('transactionStatus', transaction.status);
        // eslint-disable-next-line no-await-in-loop
        await newEarning.save();
      }
    }
  }
}
