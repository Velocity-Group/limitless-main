import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { MailerService } from 'src/modules/mailer/services';
import { SettingService } from 'src/modules/settings';
import { UserService } from 'src/modules/user/services';
import { PAYMENT_STATUS } from '../constants';

const MAILER_TRANSACTION = 'MAILER_TRANSACTION';

@Injectable()
export class TransactionMailerListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
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
        return;
      }
      const transaction = event.data;
      // TOTO handle more event transaction
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        return;
      }
      const adminEmail = SettingService.getByKey('adminEmail').value || process.env.ADMIN_EMAIL;
      const user = await this.userService.findById(transaction.sourceId);
      // mail to admin
      if (adminEmail) {
        await this.mailService.send({
          subject: 'New payment success',
          to: adminEmail,
          data: {
            user,
            transactionId: transaction._id.slice(16, 24).toString().toUpperCase(),
            products: transaction.products
          },
          template: 'admin-payment-success'
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
          template: 'user-payment-success'
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('payment_success-listener_error', e);
    }
  }
}
