/* eslint-disable no-console */
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import {
  PerformerService
} from 'src/modules/performer/services';
import { EVENT } from 'src/kernel/constants';
import { MailerService } from 'src/modules/mailer';
import { SettingService } from 'src/modules/settings/services';
import { UserService } from 'src/modules/user/services';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TYPE
} from '../constants';

const HANDLE_MAILER_TOPIC = 'HANDLE_MAILER_TOPIC';

@Injectable()
export class PaymentTokenListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly mailService: MailerService,
    private readonly queueEventService: QueueEventService
  ) {
    this.queueEventService.subscribe(
      PURCHASED_ITEM_SUCCESS_CHANNEL,
      HANDLE_MAILER_TOPIC,
      this.handleMailerTransaction.bind(this)
    );
  }

  public async handleMailerTransaction(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const transaction = event.data;
    // TOTO handle more event transaction
    if (transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS) {
      return;
    }
    if ([PURCHASE_ITEM_TYPE.PRIVATE_CHAT, PURCHASE_ITEM_TYPE.PUBLIC_CHAT, PURCHASE_ITEM_TYPE.GROUP_CHAT, PURCHASE_ITEM_TYPE.INVITATION_REGISTER].includes(transaction.type)) {
      return;
    }
    const adminEmail = await SettingService.getByKey('adminEmail').value || process.env.ADMIN_EMAIL;
    const performer = await this.performerService.findById(transaction.performerId);
    const user = await this.userService.findById(transaction.sourceId);
    // mail to performer
    if (performer && performer.email) {
      if ([PURCHASE_ITEM_TYPE.FREE_SUBSCRIPTION, PURCHASE_ITEM_TYPE.MONTHLY_SUBSCRIPTION, PURCHASE_ITEM_TYPE.YEARLY_SUBSCRIPTION].includes(transaction.type)) {
        await this.mailService.send({
          subject: 'New subscription',
          to: performer.email,
          data: {
            performer,
            user,
            transactionId: transaction._id.slice(16, 24).toString().toUpperCase(),
            products: transaction.products
          },
          template: 'performer-new-subscriber.html'
        });
      } else {
        await this.mailService.send({
          subject: 'New payment success',
          to: performer.email,
          data: {
            performer,
            user,
            transactionId: transaction._id.slice(16, 24).toString().toUpperCase(),
            products: transaction.products
          },
          template: 'performer-payment-success.html'
        });
      }
    }
    // mail to admin
    if (adminEmail) {
      await this.mailService.send({
        subject: 'New payment success',
        to: adminEmail,
        data: {
          performer,
          user,
          transactionId: transaction._id.slice(16, 24).toString().toUpperCase(),
          products: transaction.products
        },
        template: 'admin-payment-success.html'
      });
    }
    // mail to user
    if (user && user.email) {
      await this.mailService.send({
        subject: 'New payment success',
        to: user.email,
        data: {
          user,
          transactionId: transaction._id.slice(16, 24).toString().toUpperCase(),
          products: transaction.products
        },
        template: 'user-payment-success.html'
      });
    }
  }
}
