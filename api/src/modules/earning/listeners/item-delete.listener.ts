/* eslint-disable no-await-in-loop */
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable, Inject } from '@nestjs/common';
import { EVENT } from 'src/kernel/constants';
import { PERFORMER_FEED_CHANNEL } from 'src/modules/feed/constants';
import { FeedDto } from 'src/modules/feed/dtos';
import { Model } from 'mongoose';
import { PERFORMER_MODEL_PROVIDER } from 'src/modules/performer/providers';
import { PerformerModel } from 'src/modules/performer/models';
import {
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TARTGET_TYPE
} from 'src/modules/purchased-item/constants';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from 'src/modules/purchased-item/providers';
import { PaymentTokenModel } from 'src/modules/purchased-item/models';
// import { MailerService } from 'src/modules/mailer';
import { MESSAGE_CHANNEL } from 'src/modules/message/constants';
import { MessageModel } from 'src/modules/message/models';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';

const HANDLE_DELETE_FEED_TOPIC = 'HANDLE_DELETE_FEED_TOPIC';
const HANDLE_DELETE_MESSAGE_TOPIC = 'HANDLE_DELETE_MESSAGE_TOPIC';

@Injectable()
export class HandleDeleteItemListener {
  constructor(
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly paymentTokenModel: Model<PaymentTokenModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService
    // private readonly mailerService: MailerService
  ) {
    this.queueEventService.subscribe(
      PERFORMER_FEED_CHANNEL,
      HANDLE_DELETE_FEED_TOPIC,
      this.handleDeleteFeed.bind(this)
    );
    this.queueEventService.subscribe(
      MESSAGE_CHANNEL,
      HANDLE_DELETE_MESSAGE_TOPIC,
      this.handleDeleteMessage.bind(this)
    );
  }

  public async handleDeleteFeed(event: QueueEvent) {
    if (![EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { _id }: FeedDto = event.data;
    const total = await this.paymentTokenModel.countDocuments({
      target: PURCHASE_ITEM_TARTGET_TYPE.FEED,
      targetId: _id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    for (let i = 0; i <= total / 90; i += 1) {
      const transactions = await this.paymentTokenModel.find({
        target: PURCHASE_ITEM_TARTGET_TYPE.FEED,
        targetId: _id,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }).limit(99).skip(i * 99).lean();
      const transactionIds = transactions.map((t) => t._id);
      const earnings = await this.earningModel.find({
        _id: { $in: transactionIds }
      });
      await Promise.all([
        this.paymentTokenModel.updateMany({ _id: { $in: transactionIds } }, { status: PURCHASE_ITEM_STATUS.REFUNDED }),
        earnings.length > 0 && earnings.forEach(async (earning) => {
          // refund token to user
          await this.performerModel.updateOne({ _id: earning.userId }, { $inc: { balance: earning.grossPrice } });
          // reduce performer balance
          await this.performerModel.updateOne({ _id: earning.performerId }, { $inc: { balance: -earning.netPrice } });
          // remove earning;
          await earning.remove();
        })
      ]);
      // TODO mailer
    }
  }

  public async handleDeleteMessage(event: QueueEvent) {
    if (![EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { _id }: MessageModel = event.data;
    const total = await this.paymentTokenModel.countDocuments({
      target: PURCHASE_ITEM_TARTGET_TYPE.MESSAGE,
      targetId: _id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    for (let i = 0; i <= total / 90; i += 1) {
      const transactions = await this.paymentTokenModel.find({
        target: PURCHASE_ITEM_TARTGET_TYPE.MESSAGE,
        targetId: _id,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }).limit(99).skip(i * 99).lean();
      const transactionIds = transactions.map((t) => t._id);
      const earnings = await this.earningModel.find({
        transactionId: { $in: transactionIds }
      });
      await Promise.all([
        this.paymentTokenModel.updateMany({ _id: { $in: transactionIds } }, { status: PURCHASE_ITEM_STATUS.REFUNDED }),
        earnings.length > 0 && earnings.forEach(async (earning) => {
          // refund token to user
          await this.performerModel.updateOne({ _id: earning.userId }, { $inc: { balance: earning.grossPrice } }, { new: true });
          await this.notifyPerformerBalance(earning);
          // reduce performer balance
          await this.performerModel.updateOne({ _id: earning.performerId }, { $inc: { balance: -earning.netPrice } }, { new: true });
          await this.notifyUserBalance(earning);
          // remove earning;
          await earning.remove();
        })
      ]);
      // TODO mailer
    }
  }

  private async notifyPerformerBalance(earning: EarningModel) {
    this.socketUserService.emitToUsers([earning.performerId], 'update_balance', {
      token: -earning.netPrice
    });
  }

  private async notifyUserBalance(earning: EarningModel) {
    this.socketUserService.emitToUsers([earning.userId], 'update_balance', {
      token: earning.grossPrice
    });
  }
}
