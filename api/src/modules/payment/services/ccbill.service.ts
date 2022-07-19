import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { SUBSCRIPTION_TYPE } from '../../subscription/constants';

const crypto = require('crypto');

interface CCBillSubscription {
  salt: string;
  flexformId: string;
  subAccountNumber: string;
  price: number;
  transactionId: ObjectId;
  subscriptionType: string;
}

interface CCBillSinglePurchase {
  salt: string;
  flexformId: string;
  subAccountNumber: string;
  transactionId: ObjectId;
  price: number;
  currencyCode?: string;
}

@Injectable()
export class CCBillService {
  public subscription(options: CCBillSubscription) {
    const {
      transactionId, price, flexformId, salt, subAccountNumber, subscriptionType
    } = options;
    const initialPrice = price.toFixed(2);
    const initialPeriod = [SUBSCRIPTION_TYPE.MONTHLY, 'monthly_subscription'].includes(subscriptionType) ? 30 : 365;
    const currencyCode = '840'; // usd
    const numRebills = '99';
    if (!salt || !flexformId || !subAccountNumber || !transactionId || !initialPrice) {
      throw new EntityNotFoundException();
    }
    const formDigest = crypto.createHash('md5')
      .update(`${initialPrice}${initialPeriod}${initialPrice}${initialPeriod}${numRebills}${currencyCode}${salt}`).digest('hex');
    return {
      paymentUrl: `https://api.ccbill.com/wap-frontflex/flexforms/${flexformId}?transactionId=${transactionId}&initialPrice=${initialPrice}&initialPeriod=${initialPeriod}&recurringPrice=${initialPrice}&recurringPeriod=${initialPeriod}&numRebills=${numRebills}&clientSubacc=${subAccountNumber}&currencyCode=${currencyCode}&formDigest=${formDigest}`
    };
  }

  public singlePurchase(options: CCBillSinglePurchase) {
    const {
      transactionId, price, salt, flexformId, subAccountNumber, currencyCode: currency
    } = options;
    const initialPrice = price.toFixed(2);
    const currencyCode = currency || '840';
    const initialPeriod = 30;
    if (!salt || !flexformId || !subAccountNumber || !transactionId || !initialPrice) {
      throw new EntityNotFoundException();
    }
    const formDigest = crypto.createHash('md5')
      .update(`${initialPrice}${initialPeriod}${currencyCode}${salt}`)
      .digest('hex');
    return {
      paymentUrl: `https://api.ccbill.com/wap-frontflex/flexforms/${flexformId}?transactionId=${transactionId}&initialPrice=${initialPrice}&initialPeriod=${initialPeriod}&clientSubacc=${subAccountNumber}&currencyCode=${currencyCode}&formDigest=${formDigest}`
    };
  }
}
