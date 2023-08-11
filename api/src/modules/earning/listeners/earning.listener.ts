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
import * as moment from 'moment';
import { ReferralService } from 'src/modules/auth/services';
import { ObjectId } from 'mongodb';
import { EarningDto } from '../dtos/earning.dto';
import { EARNING_MODEL_PROVIDER, REFERRAL_EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel, ReferralEarningModel } from '../models';
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
    @Inject(REFERRAL_EARNING_MODEL_PROVIDER)
    private readonly referralEarningModel: Model<ReferralEarningModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService,
    private readonly referralService: ReferralService
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

    const earning = new this.PerformerEarningModel();
    earning.set('siteCommission', commission);
    earning.set('grossPrice', transaction.totalPrice);
    earning.set('netPrice', netPrice);
    earning.set('performerId', transaction.performerId);
    earning.set('userId', transaction.sourceId);
    earning.set('transactionId', transaction._id);
    earning.set('sourceType', transaction.target);
    earning.set('type', transaction.type);
    earning.set('createdAt', transaction.createdAt);
    earning.set('isPaid', false);
    earning.set('paymentGateway', 'system');
    earning.set('transactionStatus', transaction.status);
    earning.set('isToken', true);
    await earning.save();
    // update balance
    this.updateBalance(earning.grossPrice, netPrice, earning);
    this.notifyUserBalance(earning.performerId, netPrice);
    this.createPerformerReferralEarning(earning);
    this.createUserReferralEarning(earning);
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
    if (transaction.type === PAYMENT_TYPE.TOKEN_PACKAGE) {
      this.createUserReferralEarning(new EarningModel({
        _id: null,
        userId: transaction.sourceId,
        grossPrice: transaction.totalPrice,
        netPrice: transaction.totalPrice,
        transactionStatus: PURCHASE_ITEM_STATUS.SUCCESS,
        isToken: false,
        type: transaction.type
      }));
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
    const earning = new this.PerformerEarningModel();
    earning.set('siteCommission', commission);
    earning.set('grossPrice', transaction.totalPrice);
    earning.set('netPrice', netPrice);
    earning.set('performerId', transaction.performerId);
    earning.set('userId', transaction.sourceId);
    earning.set('transactionId', transaction._id);
    earning.set('sourceType', transaction.target);
    earning.set('type', transaction.type);
    earning.set('createdAt', transaction.createdAt);
    earning.set('updatedAt', transaction.updatedAt);
    earning.set('paymentGateway', transaction.paymentGateway);
    earning.set('isPaid', false);
    earning.set('isToken', false);
    earning.set('transactionStatus', transaction.status);
    await earning.save();
    // update balance
    this.updateBalance(earning.grossPrice, netPrice, earning);
    this.notifyUserBalance(earning.performerId, netPrice);
    this.createPerformerReferralEarning(earning);
    this.createUserReferralEarning(earning);
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

  private async notifyUserBalance(userId: ObjectId, token: number) {
    await this.socketUserService.emitToUsers(userId, 'update_balance', {
      token
    });
  }

  private async createPerformerReferralEarning(earning: EarningModel) {
    const [referralPerformer] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.performerId
      })
    ]);
    if (referralPerformer) {
      // earns for 1y
      if (moment().isBefore(moment(referralPerformer.createdAt).subtract(1, 'year'))) return;
      const referralCommission = SettingService.getValueByKey(SETTING_KEYS.PERFORMER_REFERRAL_COMMISSION) || 0.05;
      const referralEarning = await this.referralEarningModel.create({
        registerSource: referralPerformer.registerSource,
        registerId: earning.performerId,
        referralSource: referralPerformer.referralSource,
        referralId: referralPerformer.referralId,
        earningId: earning._id,
        type: earning.type,
        grossPrice: earning.netPrice,
        netPrice: earning.netPrice * referralCommission,
        referralCommission,
        isPaid: false,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isToken: earning.isToken,
        transactionStatus: earning.transactionStatus
      });

      // update referral balance
      referralEarning.referralSource === 'performer' && this.performerService.updatePerformerBalance(referralEarning.referralId, referralEarning.netPrice);
      referralEarning.referralSource === 'user' && this.userService.updateBalance(referralEarning.referralId, referralEarning.netPrice);
      this.notifyUserBalance(referralEarning.referralId, referralEarning.netPrice);
    }
  }

  private async createUserReferralEarning(earning: EarningModel) {
    const [referralUser] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.userId
      })
    ]);
    if (referralUser) {
      const referralCommission = SettingService.getValueByKey(SETTING_KEYS.USER_REFERRAL_COMMISSION) || 0.01;
      const referralEarning = await this.referralEarningModel.create({
        registerSource: referralUser.registerSource,
        registerId: earning.userId,
        referralSource: referralUser.referralSource,
        referralId: referralUser.referralId,
        earningId: earning._id,
        type: earning.type,
        grossPrice: earning.grossPrice,
        netPrice: earning.grossPrice * referralCommission,
        referralCommission,
        isPaid: false,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isToken: earning.isToken,
        transactionStatus: earning.transactionStatus
      });

      // update referral balance
      referralEarning.referralSource === 'performer' && this.performerService.updatePerformerBalance(referralEarning.referralId, referralEarning.netPrice);
      referralEarning.referralSource === 'user' && this.userService.updateBalance(referralEarning.referralId, referralEarning.netPrice);
      this.notifyUserBalance(referralEarning.referralId, referralEarning.netPrice);
    }
  }
}
