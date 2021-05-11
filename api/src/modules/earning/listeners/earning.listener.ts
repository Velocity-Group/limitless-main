import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PURCHASED_ITEM_SUCCESS_CHANNEL, PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TYPE } from 'src/modules/purchased-item/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
import { EarningDto } from '../dtos/earning.dto';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';
import { SETTING_KEYS } from '../../settings/constants';

const UPDATE_EARNING_TOKEN_CHANNEL = 'EARNING_TOKEN_CHANNEL';

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
      PURCHASED_ITEM_SUCCESS_CHANNEL,
      UPDATE_EARNING_TOKEN_CHANNEL,
      this.handleListenEarningToken.bind(this)
    );
  }

  public async handleListenEarningToken(
    event: QueueEvent
  ): Promise<EarningDto> {
    try {
      if (event.eventName !== EVENT.CREATED) {
        return;
      }
      const transaction = event.data;
      if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
        return;
      }
      if ([PURCHASE_ITEM_TYPE.FREE_SUBSCRIPTION].includes(transaction.type)) return;

      const [
        performerCommissions,
        settingFeedCommission,
        settingMessageCommission,
        settingTipCommission,
        settingMonthlyCommission,
        settingYearlyCommission,
        settingVideoCommission,
        settingGalleryCommission,
        settingStreamCommission
      ] = await Promise.all([
        this.performerService.getCommissions(transaction.performerId),
        this.settingService.getKeyValue(SETTING_KEYS.FEED_SALE_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.MESSAGE_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.TIP_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.VIDEO_SALE_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.GALLERY_SALE_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.STREAM_COMMISSION)
      ]);

      let commission = 0.2;
      switch (transaction.type) {
        case PURCHASE_ITEM_TYPE.MONTHLY_SUBSCRIPTION:
          commission = performerCommissions?.monthlySubscriptionCommission || settingMonthlyCommission || 0.2;
          break;
        case PURCHASE_ITEM_TYPE.YEARLY_SUBSCRIPTION:
          commission = performerCommissions?.yearlySubscriptionCommission || settingYearlyCommission || 0.2;
          break;
        case PURCHASE_ITEM_TYPE.FEED:
          commission = performerCommissions?.feedSaleCommission || settingFeedCommission || 0.2;
          break;
        case PURCHASE_ITEM_TYPE.MESSAGE:
          commission = performerCommissions?.messageSaleCommission || settingMessageCommission || 0.2;
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
