import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { TOKEN_TRANSACTION_SUCCESS_CHANNEL, PURCHASE_ITEM_STATUS } from 'src/modules/token-transaction/constants';
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
      settingCommission, performer
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId)
    ]);

    const commission = performer.commissionPercentage || settingCommission;

    const netPrice = transaction.totalPrice - transaction.totalPrice * commission;

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', commission);
    newEarning.set('grossPrice', transaction.totalPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('paymentGateway', 'system');
    newEarning.set('isToken', true);
    await newEarning.save();
    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning);
    await this.notifyPerformerBalance(newEarning, netPrice);
  }

  public async handleListenEarningMoney(
    event: QueueEvent
  ): Promise<EarningDto> {
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
      settingCommission, performer
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId)
    ]);
    const commission = performer.commissionPercentage || settingCommission;
    const netPrice = transaction.totalPrice - transaction.totalPrice * commission;
    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', commission);
    newEarning.set('grossPrice', transaction.totalPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('updatedAt', transaction.updatedAt);
    newEarning.set('paymentGateway', transaction.paymentGateway);
    newEarning.set('isPaid', false);
    newEarning.set('isToken', false);
    await newEarning.save();
    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning);
    await this.notifyPerformerBalance(newEarning, netPrice);
  }

  private async updateBalance(userTokens, performerTokens, earning) {
    await Promise.all([
      this.performerService.updatePerformerBalance(earning.performerId, performerTokens),
      earning.isToken && this.userService.updateBalance(
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
