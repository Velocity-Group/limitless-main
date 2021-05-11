import {
  Injectable, Inject, forwardRef, BadRequestException
} from '@nestjs/common';
import { CouponDto } from 'src/modules/coupon/dtos';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { CouponService } from 'src/modules/coupon/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { TokenPackageService } from 'src/modules/token-package/services';
import { PaymentDto } from 'src/modules/purchased-item/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import { PaymentTransactionModel } from '../models';
import {
  PurchaseTokenPayload
} from '../payloads';
import {
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_TARGET_TYPE,
  TRANSACTION_SUCCESS_CHANNEL
} from '../constants';
import {
  MissingConfigPaymentException
} from '../exceptions';
import { CCBillService } from './ccbill.service';
import { BitpayService } from './bitpay.service';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => CouponService))
    private readonly couponService: CouponService,
    @Inject(forwardRef(() => TokenPackageService))
    private readonly tokenPackageService: TokenPackageService,
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly TransactionModel: Model<PaymentTransactionModel>,
    private readonly ccbillService: CCBillService,
    private readonly bitpayService: BitpayService,
    private readonly queueEventService: QueueEventService,
    private readonly settingService: SettingService
  ) { }

  public async findById(id: string | ObjectId) {
    const data = await this.TransactionModel.findById(id);
    return data;
  }

  public async createTokenPaymentTransaction(
    products: any[],
    gateway,
    totalPrice: number,
    user: PerformerDto,
    couponInfo?: CouponDto
  ) {
    const paymentTransaction = new this.TransactionModel();
    paymentTransaction.originalPrice = totalPrice;
    paymentTransaction.paymentGateway = gateway || 'ccbill';
    paymentTransaction.source = 'performer';
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PAYMENT_TARGET_TYPE.TOKEN_PACKAGE;
    paymentTransaction.targetId = null;
    paymentTransaction.performerId = null;
    paymentTransaction.type = PAYMENT_TYPE.TOKEN_PACKAGE;
    paymentTransaction.totalPrice = couponInfo ? totalPrice - parseFloat((totalPrice * couponInfo.value).toFixed(2)) : totalPrice;
    paymentTransaction.products = products;
    paymentTransaction.paymentResponseInfo = {};
    paymentTransaction.status = PAYMENT_STATUS.SUCCESS;
    paymentTransaction.couponInfo = couponInfo;
    await paymentTransaction.save();
    return paymentTransaction;
  }

  public async buyTokens(tokenId: string | ObjectId, payload: PurchaseTokenPayload, user: PerformerDto) {
    const { gateway, couponCode, currency } = payload;

    let totalPrice = 0;
    const tokenPackage = await this.tokenPackageService.findById(tokenId);
    if (!tokenPackage) {
      throw new EntityNotFoundException('Token package not found');
    }
    totalPrice = parseFloat(tokenPackage.price.toFixed(2)) || 0;
    const products = [{
      price: totalPrice,
      quantity: 1,
      name: tokenPackage.name,
      description: tokenPackage.description,
      productId: tokenPackage._id,
      productType: PAYMENT_TARGET_TYPE.TOKEN_PACKAGE,
      performerId: null,
      tokens: tokenPackage.tokens
    }];

    let coupon = null;
    if (couponCode) {
      coupon = await this.couponService.applyCoupon(couponCode, user._id);
    }

    const transaction = await this.createTokenPaymentTransaction(
      products,
      gateway,
      totalPrice,
      user,
      coupon
    );

    if (gateway === 'ccbill') {
      // const [
      //   flexformId,
      //   subAccountNumber,
      //   salt
      // ] = await Promise.all([
      //   this.settingService.getKeyValue(SETTING_KEYS.CCBILL_FLEXFORM_ID),
      //   this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SUB_ACCOUNT_NUMBER),
      //   this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SALT)
      // ]);

      // if (!flexformId || !subAccountNumber || !salt) {
      //   throw new MissingConfigPaymentException();
      // }
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRANSACTION_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: transaction
        })
      );
      return { success: true };
      // return this.ccbillService.singlePurchase({
      //   salt,
      //   flexformId,
      //   subAccountNumber,
      //   price: coupon ? totalPrice - parseFloat((totalPrice * coupon.value).toFixed(2)) : totalPrice,
      //   transactionId: transaction._id
      // });
    }
    if (gateway === 'bitpay') {
      const [bitpayApiToken, bitpayProductionMode] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.BITPAY_API_TOKEN),
        this.settingService.getKeyValue(SETTING_KEYS.BITPAY_PRODUCTION_MODE)
      ]);
      if (!bitpayApiToken) {
        throw new MissingConfigPaymentException();
      }
      try {
        const resp = await this.bitpayService.createInvoice({
          bitpayApiToken,
          bitpayProductionMode,
          transaction: new PaymentDto(transaction),
          currency
        }) as any;
        if (resp.data && resp.data.data && resp.data.data.url) {
          return { paymentUrl: resp.data.data.url };
        }
        return { paymentUrl: process.env.USER_URL };
      } catch (e) {
        throw new MissingConfigPaymentException();
      }
    }

    throw new MissingConfigPaymentException();
  }

  public async ccbillSinglePaymentSuccessWebhook(payload: Record<string, any>) {
    const transactionId = payload['X-transactionId'] || payload.transactionId;
    if (!transactionId) {
      throw new BadRequestException();
    }
    const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
    if (!checkForHexRegExp.test(transactionId)) {
      return { ok: false };
    }
    const transaction = await this.TransactionModel.findById(transactionId);
    if (!transaction) {
      return { ok: false };
    }
    transaction.status = PAYMENT_STATUS.SUCCESS;
    transaction.paymentResponseInfo = payload;
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: transaction
      })
    );
    return { ok: true };
  }

  public async ccbillRenewalSuccessWebhook(payload: any) {
    const subscriptionId = payload.subscriptionId || payload.subscription_id;
    if (!subscriptionId) {
      throw new BadRequestException();
    }
    const transaction = await this.TransactionModel.findOne({
      'paymentResponseInfo.subscriptionId': subscriptionId
    });
    if (!transaction) {
      return { ok: false };
    }
    // const newTransaction = await this.createRenewalPaymentTransaction(transaction, payload);
    // await this.queueEventService.publish(
    //   new QueueEvent({
    //     channel: TRANSACTION_SUCCESS_CHANNEL,
    //     eventName: EVENT.CREATED,
    //     data: newTransaction
    //   })
    // );
    return { ok: true };
  }

  public async bitpaySuccessWebhook(payload: Record<string, any>) {
    const body = payload.data;
    const { event } = payload;
    const transactionId = body.orderId || body.posData;
    const { status } = body;
    if (event.name !== 'invoice_completed' || !transactionId || status !== 'complete') {
      return { ok: false };
    }
    const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
    if (!checkForHexRegExp.test(transactionId)) {
      return { ok: false };
    }
    const transaction = await this.TransactionModel.findById(transactionId);
    if (!transaction) {
      return { ok: false };
    }
    transaction.status = PAYMENT_STATUS.SUCCESS;
    transaction.paymentResponseInfo = payload;
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: transaction
      })
    );
    return { ok: true };
  }
}
