import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_TYPE
} from 'src/modules/purchased-item/constants';
import { EVENT } from 'src/kernel/constants';
import * as moment from 'moment';
import { SubscriptionModel } from '../models/subscription.model';
import { SUBSCRIPTION_MODEL_PROVIDER } from '../providers/subscription.provider';
import { SubscriptionDto } from '../dtos/subscription.dto';
import {
  UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
  SUBSCRIPTION_TYPE, SUBSCRIPTION_STATUS
} from '../constants';

const UPDATE_SUBSCRIPTION_CHANNEL = 'UPDATE_SUBSCRIPTION_CHANNEL';

@Injectable()
export class TransactionSubscriptionListener {
  constructor(
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      PURCHASED_ITEM_SUCCESS_CHANNEL,
      UPDATE_SUBSCRIPTION_CHANNEL,
      this.handleListenSubscription.bind(this)
    );
  }

  public async handleListenSubscription(
    event: QueueEvent
    // transactionPayload: any, eventType?: string
  ): Promise<SubscriptionDto> {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return null;
    }
    // TODO check cancelation or expried date by event.deleted
    const transaction = event.data;
    if (
      ![
        PURCHASE_ITEM_TYPE.MONTHLY_SUBSCRIPTION,
        PURCHASE_ITEM_TYPE.YEARLY_SUBSCRIPTION,
        PURCHASE_ITEM_TYPE.FREE_SUBSCRIPTION
      ].includes(transaction.type)
    ) {
      return null;
    }
    const existSubscription = await this.subscriptionModel.findOne({
      userId: transaction.sourceId,
      performerId: transaction.performerId
    });
      // eslint-disable-next-line no-nested-ternary
    const expiredAt = transaction.type === PURCHASE_ITEM_TYPE.MONTHLY_SUBSCRIPTION
      ? moment().add(30, 'days').toDate()
      : transaction.type === PURCHASE_ITEM_TYPE.YEARLY_SUBSCRIPTION
        ? moment().add(365, 'days').toDate() : moment().add(99, 'years').toDate();
      // eslint-disable-next-line no-nested-ternary
    const subscriptionType = transaction.type === PURCHASE_ITEM_TYPE.MONTHLY_SUBSCRIPTION
      ? SUBSCRIPTION_TYPE.MONTHLY
      : transaction.type === PURCHASE_ITEM_TYPE.YEARLY_SUBSCRIPTION
        ? SUBSCRIPTION_TYPE.YEARLY : SUBSCRIPTION_TYPE.FREE;

    const startRecurringDate = expiredAt;
    const nextRecurringDate = expiredAt;
    if (existSubscription) {
      existSubscription.expiredAt = new Date(expiredAt);
      existSubscription.updatedAt = new Date();
      existSubscription.subscriptionType = subscriptionType;
      existSubscription.transactionId = transaction._id;
      existSubscription.nextRecurringDate = nextRecurringDate
        ? new Date(nextRecurringDate)
        : new Date(expiredAt);
      existSubscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      await existSubscription.save();
      return new SubscriptionDto(existSubscription);
    }
    const newSubscription = await this.subscriptionModel.create({
      performerId: transaction.performerId,
      userId: transaction.sourceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiredAt: new Date(expiredAt),
      subscriptionType,
      meta: { },
      startRecurringDate: startRecurringDate
        ? new Date(startRecurringDate)
        : new Date(),
      nextRecurringDate: nextRecurringDate
        ? new Date(nextRecurringDate)
        : new Date(expiredAt),
      transactionId: transaction._id,
      status: SUBSCRIPTION_STATUS.ACTIVE
    });
    await this.queueEventService.publish(
      new QueueEvent({
        channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
        eventName: event.eventName,
        data: new SubscriptionDto(newSubscription)
      })
    );
    return new SubscriptionDto(newSubscription);
  }
}
