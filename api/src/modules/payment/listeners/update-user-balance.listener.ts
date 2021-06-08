import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PAYMENT_TYPE, TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { UserService } from 'src/modules/user/services';
import { PAYMENT_STATUS } from '../constants';

const UPDATE_USER_BALANCE_TOPIC = 'UPDATE_USER_BALANCE_TOPIC';

@Injectable()
export class UpdateUserBalanceListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly userService: UserService
  ) {
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      UPDATE_USER_BALANCE_TOPIC,
      this.handleUpdateUser.bind(this)
    );
  }

  public async handleUpdateUser(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
      return;
    }
    const transaction = event.data;
    // TOTO handle more event transaction
    if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
      return;
    }
    if (transaction.type === PAYMENT_TYPE.TOKEN_PACKAGE) {
      await this.userService.updateBalance(transaction.sourceId, transaction.products[0].tokens);
    }
  }
}
