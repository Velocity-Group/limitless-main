import { Injectable, Inject } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { SETTING_CHANNEL, SETTING_KEYS } from 'src/modules/settings/constants';
import { SettingDto } from 'src/modules/settings/dtos';
import { StripeConnectAccountModel, StripeProductModel } from '../models';
import { STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER, STRIPE_PRODUCT_MODEL_PROVIDER } from '../providers';

const STRIPE_UPDATE_TOPIC = 'STRIPE_UPDATE_TOPIC';

@Injectable()
export class StripeSettingsUpdatedListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    @Inject(STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER)
    private readonly stripeConnectAccountModel: Model<StripeConnectAccountModel>,
    @Inject(STRIPE_PRODUCT_MODEL_PROVIDER)
    private readonly stripeProductModel: Model<StripeProductModel>
  ) {
    this.queueEventService.subscribe(
      SETTING_CHANNEL,
      STRIPE_UPDATE_TOPIC,
      this.updateUserStripe.bind(this)
    );
  }

  private async updateUserStripe(event: QueueEvent): Promise<void> {
    const { key, value, oldValue } = event.data as SettingDto;
    if (event.eventName !== 'update') return;
    if (![SETTING_KEYS.STRIPE_PUBLISHABLE_KEY, SETTING_KEYS.STRIPE_SECRET_KEY].includes(key)) {
      return;
    }
    if (`${value}` === `${oldValue}`) return;
    // update stripe info
    await this.stripeConnectAccountModel.deleteMany({ });
    await this.stripeProductModel.deleteMany({ });
  }
}
