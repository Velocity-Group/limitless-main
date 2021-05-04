import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PAYMENT_TYPE, TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PAYMENT_STATUS } from '../constants';

const UPDATE_USER_BALANCE_TOPIC = 'UPDATE_USER_BALANCE_TOPIC';

@Injectable()
export class UpdateUserBalanceListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly performerService: PerformerService
  ) {
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      UPDATE_USER_BALANCE_TOPIC,
      this.handleUpdateUser.bind(this)
    );
  }

  public async handleUpdateUser(event: QueueEvent) {
    try {
      if (![EVENT.CREATED, EVENT.DELETED].includes(event.eventName)) {
        return false;
      }
      const transaction = event.data;
      // TOTO handle more event transaction
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        return false;
      }
      if (transaction.type === PAYMENT_TYPE.TOKEN_PACKAGE) {
        await this.performerService.updatePerformerBalance(transaction.sourceId, transaction.products[0].tokens);
      }
      return true;
    } catch (e) {
      // TODO - log me
      return false;
    }
  }
}
