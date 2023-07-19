import {
  forwardRef, HttpException, Inject, Injectable
} from '@nestjs/common';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { UserService } from 'src/modules/user/services';
import { MissingConfigPaymentException } from '../exceptions';
import { PaymentTransactionModel } from '../models';

const coinbase = require('coinbase-commerce-node');

const { Client } = coinbase;
const { Charge } = coinbase.resources;

@Injectable()
export class CoinbaseService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) { }

  private async getCredentials() {
    const coinbaseApiKey = SettingService.getValueByKey(SETTING_KEYS.COINBASE_API_KEY);
    if (!coinbaseApiKey) {
      throw new MissingConfigPaymentException();
    }
    return {
      coinbaseApiKey
    };
  }

  public async singlePayment({ transaction }: { transaction: PaymentTransactionModel }) {
    const { coinbaseApiKey } = await this.getCredentials();
    Client.init(coinbaseApiKey);

    const chargeData = {
      name: transaction?.products[0]?.name,
      description: transaction?.products[0]?.description,
      local_price: {
        amount: transaction?.totalPrice?.toFixed(2),
        currency: 'USD'
      },
      pricing_type: 'fixed_price',
      redirect_url: `${process.env.USER_URL}/user/payment-history`,
      cancel_url: `${process.env.USER_URL}/payment/cancel`
    };
    let resp;
    await Charge.create(chargeData, (error, response) => {
      if (!response) {
        throw new HttpException('Error Paypal payment', 400);
      }
      resp = response;
    });
    return resp;
  }
}
