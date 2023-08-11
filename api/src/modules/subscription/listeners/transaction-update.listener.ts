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
import { NOTIFY_SUBSCRIBER_MESSAGE_CHANNEL } from 'src/modules/message/constants';
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
    if (transaction.status !== 'success') return;
    if (![
      PAYMENT_TYPE.MONTHLY_SUBSCRIPTION,
      PAYMENT_TYPE.YEARLY_SUBSCRIPTION,
      PAYMENT_TYPE.FREE_SUBSCRIPTION
    ].includes(transaction.type)) return;

    const subscription = await this.subscriptionModel.findOne({
      userId: transaction.sourceId,
      performerId: transaction.performerId
    });
    const performer = await this.performerService.findById(transaction.performerId);
    if (!performer) return;
    await this.queueEventService.publish({
      channel: NOTIFY_SUBSCRIBER_MESSAGE_CHANNEL,
      eventName: EVENT.CREATED,
      data: {
        sender: {
          source: 'performer',
          sourceId: performer._id
        },
        recipient: {
          source: 'user',
          sourceId: transaction.sourceId
        }
      }
    });
    // do not pass subscriptionId to existed subscription because Stripe already have subscriptionId
    const subscriptionId = transaction?.paymentResponseInfo?.subscriptionId || transaction?.paymentResponseInfo?.subscription_id;
    // eslint-disable-next-line no-nested-ternary
    let expiredAt = moment().toDate();
    // eslint-disable-next-line no-nested-ternary
    const subscriptionType = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION
      ? SUBSCRIPTION_TYPE.MONTHLY
      : transaction.type === PAYMENT_TYPE.YEARLY_SUBSCRIPTION
        ? SUBSCRIPTION_TYPE.YEARLY : SUBSCRIPTION_TYPE.FREE;

    if (subscription) {
      if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
        await Promise.all([
          this.performerService.updateSubscriptionStat(subscription.performerId, 1),
          this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': 1 })
        ]);
      }
      switch (transaction.type) {
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
          expiredAt = moment().isBefore(subscription.expiredAt) ? moment(subscription.expiredAt).add(30, 'days').toDate() : moment().add(30, 'days').toDate();
          break;
        case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
          expiredAt = moment().isBefore(subscription.expiredAt) ? moment(subscription.expiredAt).add(365, 'days').toDate() : moment().add(365, 'days').toDate();
          break;
        case PAYMENT_TYPE.FREE_SUBSCRIPTION:
          expiredAt = moment().add(performer.durationFreeSubscriptionDays, 'days').toDate();
          break;
        default: break;
      }
      const nextRecurringDate = expiredAt;
      subscription.paymentGateway = transaction.paymentGateway;
      subscription.expiredAt = expiredAt;
      subscription.updatedAt = new Date();
      subscription.subscriptionType = subscriptionType;
      subscription.transactionId = transaction._id;
      subscription.nextRecurringDate = nextRecurringDate;
      subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      subscription.usedFreeSubscription = transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION;
      await subscription.save();
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
