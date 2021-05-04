import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PAYMENT_TYPE, TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { MailerService } from 'src/modules/mailer/services';
import { SettingService } from 'src/modules/settings';
import { PerformerService } from 'src/modules/performer/services';
import { PAYMENT_STATUS } from '../constants';

const MAILER_TRANSACTION = 'MAILER_TRANSACTION';

@Injectable()
export class TransactionMailerListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) {
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      MAILER_TRANSACTION,
      this.handleMailerTransaction.bind(this)
    );
  }

  public async handleMailerTransaction(event: QueueEvent) {
    try {
      if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
        return false;
      }
      const transaction = event.data;
      // TOTO handle more event transaction
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        return false;
      }
      const adminEmail = SettingService.getByKey('adminEmail').value || process.env.ADMIN_EMAIL;
      const performer = await this.performerService.findById(transaction.performerId);
      const user = await this.performerService.findById(transaction.sourceId);
      if (!user) {
        return false;
      }
      // mail to performer
      if (performer && performer.email) {
        if ([PAYMENT_TYPE.FREE_SUBSCRIPTION, PAYMENT_TYPE.MONTHLY_SUBSCRIPTION, PAYMENT_TYPE.YEARLY_SUBSCRIPTION].includes(transaction.type)) {
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
      if (user.email) {
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
      return true;
    } catch (e) {
      // TODO - log me
      return false;
    }
  }
}
