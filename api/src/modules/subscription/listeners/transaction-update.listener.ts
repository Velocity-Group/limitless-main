import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  TRANSACTION_SUCCESS_CHANNEL, PAYMENT_TYPE
} from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import * as moment from 'moment';
import { PaymentDto } from 'src/modules/payment/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { SubscriptionModel } from '../models/subscription.model';
import { SUBSCRIPTION_MODEL_PROVIDER } from '../providers/subscription.provider';
import { SubscriptionDto } from '../dtos/subscription.dto';
import {
  SUBSCRIPTION_TYPE, SUBSCRIPTION_STATUS
} from '../constants';

const UPDATE_SUBSCRIPTION_TOPIC = 'UPDATE_SUBSCRIPTION_TOPIC';

@Injectable()
export class TransactionSubscriptionListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      UPDATE_SUBSCRIPTION_TOPIC,
      this.handleListenSubscription.bind(this)
    );
  }

  public async handleListenSubscription(
    event: QueueEvent
  ): Promise<SubscriptionDto> {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) return;
    const transaction = event.data as PaymentDto;
    if (![
      PAYMENT_TYPE.MONTHLY_SUBSCRIPTION,
      PAYMENT_TYPE.YEARLY_SUBSCRIPTION,
      PAYMENT_TYPE.FREE_SUBSCRIPTION
    ].includes(transaction.type)) return;

    const existSubscription = await this.subscriptionModel.findOne({
      userId: transaction.sourceId,
      performerId: transaction.performerId
    });
    const performer = await this.performerService.findById(transaction.performerId);
    if (!performer) return;
    // do not pass subscriptionId to existed subscription because Stripe already have subscriptionId
    const subscriptionId = transaction?.paymentResponseInfo?.subscriptionId || transaction?.paymentResponseInfo?.subscription_id;
    // eslint-disable-next-line no-nested-ternary
    let expiredAt = moment().toDate();
    // eslint-disable-next-line no-nested-ternary
    const subscriptionType = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
      ? SUBSCRIPTION_TYPE.MONTHLY
      : transaction.type === PAYMENT_TYPE.YEARLY_SUBSCRIPTION
        ? SUBSCRIPTION_TYPE.YEARLY : SUBSCRIPTION_TYPE.FREE;

    if (existSubscription) {
      if (existSubscription.status === SUBSCRIPTION_STATUS.DEACTIVATED) {
        await Promise.all([
          this.performerService.updateSubscriptionStat(existSubscription.performerId, 1),
          this.userService.updateStats(existSubscription.userId, { 'stats.totalSubscriptions': 1 })
        ]);
      }
      // eslint-disable-next-line no-nested-ternary
      expiredAt = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
        ? moment(existSubscription.expiredAt).add(30, 'days').toDate()
        : transaction.type === PAYMENT_TYPE.YEARLY_SUBSCRIPTION
          ? moment(existSubscription.expiredAt).add(365, 'days').toDate() : moment(existSubscription.expiredAt).add(performer.durationFreeSubscriptionDays, 'days').toDate();
      const nextRecurringDate = expiredAt;
      existSubscription.paymentGateway = transaction.paymentGateway;
      existSubscription.expiredAt = expiredAt;
      existSubscription.updatedAt = new Date();
      existSubscription.subscriptionType = subscriptionType;
      existSubscription.transactionId = transaction._id;
      existSubscription.nextRecurringDate = nextRecurringDate;
      existSubscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      existSubscription.usedFreeSubscription = transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION;
      await existSubscription.save();
      return;
    }
    // eslint-disable-next-line no-nested-ternary
    expiredAt = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
      ? moment().add(30, 'days').toDate()
      : transaction.type === PAYMENT_TYPE.YEARLY_SUBSCRIPTION
        ? moment().add(365, 'days').toDate() : moment().add(performer.durationFreeSubscriptionDays, 'days').toDate();
    const newSubscription = await this.subscriptionModel.create({
      performerId: transaction.performerId,
      userId: transaction.sourceId,
      paymentGateway: transaction.paymentGateway,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiredAt: new Date(expiredAt),
      subscriptionType,
      subscriptionId,
      meta: {},
      startRecurringDate: new Date(),
      nextRecurringDate: expiredAt,
      transactionId: transaction._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      usedFreeSubscription: transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION
    });
    await Promise.all([
      this.performerService.updateSubscriptionStat(newSubscription.performerId, 1),
      this.userService.updateStats(newSubscription.userId, { 'stats.totalSubscriptions': 1 })
    ]);
  }
}
