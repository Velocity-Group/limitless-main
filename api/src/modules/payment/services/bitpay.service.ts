import { HttpException, Injectable } from '@nestjs/common';
import { getConfig } from 'src/kernel';
import axios from 'axios';
import { PaymentDto } from '../dtos';

interface BitpaySinglePurchase {
  bitpayApiToken: string;
  bitpayProductionMode: boolean;
  transaction: PaymentDto;
  currency: string
}

@Injectable()
export class BitpayService {
  constructor(
  ) { }

  public async createInvoice(options: BitpaySinglePurchase) {
    try {
      const {
        bitpayApiToken, bitpayProductionMode, transaction, currency
      } = options;
      const webHookLink = new URL('payment/bitpay/callhook', getConfig('app').baseUrl).href;
      const redirectUrl = `${process.env.USER_URL}/home`;
      let resourceUrl = '';
      switch (bitpayProductionMode) {
        case true: resourceUrl = 'https://bitpay.com/invoices';
          break;
        case false: resourceUrl = 'https://test.bitpay.com/invoices';
          break;
        default: resourceUrl = `${process.env.BITPAY_API_URL}invoices`;
      }

      const postData = {
        token: bitpayApiToken || process.env.BITPAY_API_TOKEN,
        currency: currency || process.env.SITE_CURRENCY || 'USD',
        price: transaction.totalPrice,
        notificationURL: webHookLink, // 'https://webhook.site/#!/bd4d1a67-3cab-4299-a0b6-43e0bdd2d54f', //webHookLink
        redirectURL: redirectUrl,
        orderId: transaction._id,
        itemDesc: transaction.products[0].description || 'Purchase token package',
        transactionSpeed: 'medium',
        fullNotifications: true,
        extendedNotifications: true,
        posData: transaction._id
      };
      const headers = {
        'x-accept-version': '2.0.0',
        'Content-type': 'application/json'
      };
      return new Promise((resolver, reject) => {
        axios.post(resourceUrl, postData, { headers })
          .then((response) => {
            resolver(response);
          })
          .catch((e) => reject(e));
      });
    } catch (e) {
      throw new HttpException(JSON.stringify(e), 400);
    }
  }
}
