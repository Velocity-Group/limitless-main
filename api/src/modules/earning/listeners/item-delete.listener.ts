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
  PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARTGET_TYPE
} from 'src/modules/token-transaction/constants';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from 'src/modules/token-transaction/providers';
import { TokenTransactionModel } from 'src/modules/token-transaction/models';
import { MESSAGE_CHANNEL } from 'src/modules/message/constants';
import { MessageModel } from 'src/modules/message/models';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { USER_MODEL_PROVIDER } from 'src/modules/user/providers';
import { UserModel } from 'src/modules/user/models';
import { ORDER_STATUS, REFUND_ORDER_CHANNEL } from 'src/modules/order/constants';
import { OrderDto } from 'src/modules/order/dtos';
import { ORDER_MODEL_PROVIDER } from 'src/modules/order/providers';
import { OrderModel } from 'src/modules/order/models';
import { ObjectId } from 'mongodb';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';

const HANDLE_DELETE_FEED_TOPIC = 'HANDLE_DELETE_FEED_TOPIC';
const HANDLE_DELETE_MESSAGE_TOPIC = 'HANDLE_DELETE_MESSAGE_TOPIC';
const HANDLE_REFUND_ORDER_EARNING_TOPIC = 'HANDLE_REFUND_ORDER_EARNING_TOPIC';

@Injectable()
export class HandleDeleteItemListener {
  constructor(
    @Inject(ORDER_MODEL_PROVIDER)
    private readonly orderModel: Model<OrderModel>,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    @Inject(USER_MODEL_PROVIDER)
    private readonly userModel: Model<UserModel>,
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly tokenTransactionModel: Model<TokenTransactionModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService
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
    this.queueEventService.subscribe(
      REFUND_ORDER_CHANNEL,
      HANDLE_REFUND_ORDER_EARNING_TOPIC,
      this.handleRefundOrder.bind(this)
    );
  }

  private async handleDeleteFeed(event: QueueEvent) {
    if (![EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { _id }: FeedDto = event.data;
    const total = await this.tokenTransactionModel.countDocuments({
      target: PURCHASE_ITEM_TARTGET_TYPE.FEED,
      targetId: _id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    for (let i = 0; i <= total / 90; i += 1) {
      const transactions = await this.tokenTransactionModel.find({
        target: PURCHASE_ITEM_TARTGET_TYPE.FEED,
        targetId: _id,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }).limit(99).skip(i * 99).lean();
      const transactionIds = transactions.map((t) => t._id);
      const earnings = await this.earningModel.find({
        transactionId: { $in: transactionIds }
      });
      await this.tokenTransactionModel.updateMany({ _id: { $in: transactionIds } }, { status: PURCHASE_ITEM_STATUS.REFUNDED });
      await Promise.all(earnings.map((earning) => {
        this.userModel.updateOne({ _id: earning.userId }, { $inc: { balance: earning.grossPrice } });
        this.performerModel.updateOne({ _id: earning.performerId }, { $inc: { balance: -earning.grossPrice } });
        this.notifyPerformerBalance(earning.performerId, -earning.grossPrice);
        this.notifyUserBalance(earning);
        return earning.remove();
      }));
    }
  }

  private async handleDeleteMessage(event: QueueEvent) {
    if (![EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const { _id }: MessageModel = event.data;
    const total = await this.tokenTransactionModel.countDocuments({
      target: PURCHASE_ITEM_TARTGET_TYPE.MESSAGE,
      targetId: _id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    for (let i = 0; i <= total / 90; i += 1) {
      const transactions = await this.tokenTransactionModel.find({
        target: PURCHASE_ITEM_TARTGET_TYPE.MESSAGE,
        targetId: _id,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }).limit(99).skip(i * 99).lean();
      const transactionIds = transactions.map((t) => t._id);
      const earnings = await this.earningModel.find({
        transactionId: { $in: transactionIds }
      });
      await this.tokenTransactionModel.updateMany({ _id: { $in: transactionIds } }, { status: PURCHASE_ITEM_STATUS.REFUNDED });
      await Promise.all(earnings.map(async (earning) => {
        this.userModel.updateOne({ _id: earning.userId }, { $inc: { balance: earning.grossPrice } });
        this.notifyPerformerBalance(earning.performerId, -earning.grossPrice);
        this.performerModel.updateOne({ _id: earning.performerId }, { $inc: { balance: -earning.grossPrice } });
        this.notifyUserBalance(earning);
        return earning.remove();
      }));
    }
  }

  private async handleRefundOrder(event: QueueEvent) {
    if (![EVENT.CREATED].includes(event.eventName)) {
      return;
    }
    const { transactionId }: OrderDto = event.data;
    const earning = await this.earningModel.findOne({
      transactionId
    });
    if (!earning) return;
    await Promise.all([
      this.orderModel.updateOne({ transactionId }, { deliveryStatus: ORDER_STATUS.REFUNDED }),
      this.tokenTransactionModel.updateOne({ _id: transactionId }, { status: PURCHASE_ITEM_STATUS.REFUNDED }),
      this.userModel.updateOne({ _id: earning.userId }, { $inc: { balance: earning.grossPrice } }),
      this.performerModel.updateOne({ _id: earning.performerId }, { $inc: { balance: -earning.grossPrice } }),
      this.notifyUserBalance(earning),
      this.notifyPerformerBalance(earning.performerId, -earning.grossPrice),
      earning.remove()
    ]);
  }

  private async notifyPerformerBalance(performerId: ObjectId, token: number) {
    this.socketUserService.emitToUsers(performerId, 'update_balance', {
      token
    });
  }

  private async notifyUserBalance(earning: EarningModel) {
    this.socketUserService.emitToUsers(earning.userId, 'update_balance', {
      token: earning.grossPrice
    });
  }
}
