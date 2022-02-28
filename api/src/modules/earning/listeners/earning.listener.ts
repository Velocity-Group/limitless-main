import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { TOKEN_TRANSACTION_SUCCESS_CHANNEL, PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TYPE } from 'src/modules/token-transaction/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
import { PaymentDto } from 'src/modules/payment/dtos';
import { PAYMENT_TYPE, TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { EarningDto } from '../dtos/earning.dto';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';
import { SETTING_KEYS } from '../../settings/constants';

const EARNING_TOKEN_TOPIC = 'EARNING_TOKEN_TOPIC';
const EARNING_MONEY_TOPIC = 'EARNING_MONEY_TOPIC';

@Injectable()
export class TransactionEarningListener {
  constructor(
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly PerformerEarningModel: Model<EarningModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService
  ) {
    this.queueEventService.subscribe(
      TOKEN_TRANSACTION_SUCCESS_CHANNEL,
      EARNING_TOKEN_TOPIC,
      this.handleListenEarningToken.bind(this)
    );
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      EARNING_MONEY_TOPIC,
      this.handleListenEarningMoney.bind(this)
    );
  }

  public async handleListenEarningToken(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }

    const [
      performerCommissions,
      settingFeedCommission,
      settingProductCommission,
      settingTipCommission,
      settingVideoCommission,
      settingGalleryCommission,
      settingStreamCommission
    ] = await Promise.all([
      this.performerService.getCommissions(transaction.performerId),
      this.settingService.getKeyValue(SETTING_KEYS.FEED_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.PRODUCT_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.TIP_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.VIDEO_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.GALLERY_SALE_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.STREAM_COMMISSION)
    ]);

    let commission = 0.2;
    switch (transaction.type) {
      case PURCHASE_ITEM_TYPE.FEED:
        commission = performerCommissions?.feedSaleCommission || settingFeedCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.PRODUCT:
        commission = performerCommissions?.productSaleCommission || settingProductCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.TIP:
        commission = performerCommissions?.tipCommission || settingTipCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.VIDEO:
        commission = performerCommissions?.videoSaleCommission || settingVideoCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.GALLERY:
        commission = performerCommissions?.gallerySaleCommission || settingGalleryCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.PUBLIC_CHAT:
        commission = performerCommissions?.streamCommission || settingStreamCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.GROUP_CHAT:
        commission = performerCommissions?.streamCommission || settingStreamCommission || 0.2;
        break;
      case PURCHASE_ITEM_TYPE.PRIVATE_CHAT:
        commission = performerCommissions?.streamCommission || settingStreamCommission || 0.2;
        break;
      default: commission = 0.2;
    }

    const netPrice = transaction.totalPrice - transaction.totalPrice * commission;

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', commission);
    newEarning.set('grossPrice', transaction.totalPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction?.sourceId || null);
    newEarning.set('transactionId', transaction?._id || null);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('transactionStatus', transaction.status);
    newEarning.set('isToken', true);
    await newEarning.save();
    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning);
    await this.notifyPerformerBalance(newEarning, netPrice);
  }

  public async handleListenEarningMoney(
    event: QueueEvent
  ): Promise<EarningDto> {
    try {
      if (event.eventName !== EVENT.CREATED) {
        return;
      }
      const transaction = event.data as PaymentDto;
      if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
        return;
      }
      if (![PAYMENT_TYPE.MONTHLY_SUBSCRIPTION, PAYMENT_TYPE.YEARLY_SUBSCRIPTION].includes(transaction.type)) {
        return;
      }
      const [
        performerCommissions,
        settingMonthlyCommission,
        settingYearlyCommission
      ] = await Promise.all([
        this.performerService.getCommissions(transaction.performerId),
        this.settingService.getKeyValue(SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION)
      ]);

      let commission = 0.2;
      switch (transaction.type) {
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
          commission = performerCommissions?.monthlySubscriptionCommission || settingMonthlyCommission || 0.2;
          break;
        case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
          commission = performerCommissions?.yearlySubscriptionCommission || settingYearlyCommission || 0.2;
          break;
        default: commission = 0.2;
      }
      const netPrice = transaction.totalPrice - transaction.totalPrice * commission;
      const newEarning = new this.PerformerEarningModel();
      newEarning.set('siteCommission', commission);
      newEarning.set('grossPrice', transaction.totalPrice);
      newEarning.set('netPrice', netPrice);
      newEarning.set('performerId', transaction.performerId);
      newEarning.set('userId', transaction?.sourceId || null);
      newEarning.set('transactionId', transaction?._id || null);
      newEarning.set('sourceType', transaction.target);
      newEarning.set('type', transaction.type);
      newEarning.set('createdAt', transaction.createdAt);
      newEarning.set('updatedAt', transaction.updatedAt);
      newEarning.set('transactionStatus', transaction.status);
      newEarning.set('isPaid', true);
      newEarning.set('isToken', false);
      await newEarning.save();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  private async updateBalance(userTokens, performerTokens, earning) {
    await Promise.all([
      this.performerService.updatePerformerBalance(earning.performerId, performerTokens),
      this.userService.updateBalance(
        earning.userId,
        -userTokens
      )
    ]);
  }

  private async notifyPerformerBalance(earning, performerTokens) {
    await this.socketUserService.emitToUsers(earning.performerId.toString(), 'update_balance', {
      token: performerTokens
    });
  }
}
