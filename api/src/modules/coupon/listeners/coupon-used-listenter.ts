import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { TRANSACTION_SUCCESS_CHANNEL, PAYMENT_STATUS } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { CouponService } from '../services/coupon.service';

const UPDATE_COUPON_USED_TOPIC = 'UPDATE_COUPON_USED_TOPIC';

@Injectable()
export class UpdateCouponUsesListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly couponService: CouponService
  ) {
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      UPDATE_COUPON_USED_TOPIC,
      this.handleUpdateCoupon.bind(this)
    );
  }

  public async handleUpdateCoupon(event: QueueEvent) {
    try {
      if (![EVENT.CREATED].includes(event.eventName)) {
        return false;
      }
      const { transaction } = event.data;
      // TOTO handle more event transaction
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        return false;
      }
      if (!transaction.couponInfo || !transaction.couponInfo._id) {
        return false;
      }
      await this.couponService.updateNumberOfUses(transaction.couponInfo._id);
      return true;
    } catch (e) {
      // TODO - log me
      return false;
    }
  }
}
