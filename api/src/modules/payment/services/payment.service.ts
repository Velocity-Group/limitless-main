import {
  Injectable, Inject, forwardRef, BadRequestException, HttpException
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
import { PerformerService } from 'src/modules/performer/services';
import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE, UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL } from 'src/modules/subscription/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import axios from 'axios';
import { SubscriptionDto } from 'src/modules/subscription/dtos/subscription.dto';
import { PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import { PaymentTransactionModel } from '../models';
import {
  PurchaseTokenPayload, SubscribePerformerPayload
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

const ccbillCancelUrl = 'https://datalink.ccbill.com/utils/subscriptionManagement.cgi';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
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

  private async getPerformerSubscriptionPaymentGateway(performerId, paymentGateway = 'ccbill') {
    // get performer information and do transaction
    const performerPaymentSetting = await this.performerService.getPaymentSetting(
      performerId,
      paymentGateway
    );
    if (!performerPaymentSetting) {
      throw new MissingConfigPaymentException();
    }
    const flexformId = performerPaymentSetting?.value?.flexformId || await this.settingService.getKeyValue(SETTING_KEYS.CCBILL_FLEXFORM_ID);
    const subAccountNumber = performerPaymentSetting?.value?.subscriptionSubAccountNumber;
    const salt = performerPaymentSetting?.value?.salt;
    if (!flexformId || !subAccountNumber || !salt) {
      throw new MissingConfigPaymentException();
    }
    return {
      flexformId,
      subAccountNumber,
      salt
    };
  }

  private async getCCbillPaymentGatewaySettings() {
    const flexformId = await this.settingService.getKeyValue(SETTING_KEYS.CCBILL_FLEXFORM_ID);
    const subAccountNumber = await this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SUB_ACCOUNT_NUMBER);
    const salt = await this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SALT);
    if (!flexformId || !subAccountNumber || !salt) {
      throw new MissingConfigPaymentException();
    }

    return {
      flexformId,
      subAccountNumber,
      salt
    };
  }

  public async createSubscriptionPaymentTransaction(performer: PerformerDto, subscriptionType: string, user: PerformerDto, couponInfo?: CouponDto, paymentGateway = 'ccbill') {
    const price = () => {
      switch (subscriptionType) {
        case PAYMENT_TYPE.FREE_SUBSCRIPTION: return 0;
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION: return performer.monthlyPrice;
        case PAYMENT_TYPE.YEARLY_SUBSCRIPTION: return performer.yearlyPrice;
        default: return performer.monthlyPrice;
      }
    };
    const totalPrice = couponInfo ? price() - parseFloat((price() * couponInfo.value).toFixed(2)) : price();
    return this.TransactionModel.create({
      paymentGateway,
      source: 'performer',
      sourceId: user._id,
      target: PAYMENT_TARGET_TYPE.PERFORMER,
      targetId: performer._id,
      performerId: performer._id,
      type: subscriptionType,
      originalPrice: price(),
      totalPrice,
      products: [],
      couponInfo,
      status: PAYMENT_STATUS.PENDING,
      paymentResponseInfo: null
    });
  }

  public async createRenewalSubscriptionPaymentTransaction(subscription: SubscriptionModel, payload: any, paymentGateway = 'ccbill') {
    const price = payload.billedAmount || payload.accountingAmount;
    const { userId, performerId, subscriptionType } = subscription;
    return this.TransactionModel.create({
      paymentGateway,
      source: 'performer',
      sourceId: userId,
      target: PAYMENT_TARGET_TYPE.PERFORMER,
      targetId: performerId,
      performerId,
      type: subscriptionType,
      originalPrice: price,
      totalPrice: price,
      products: [],
      couponInfo: null,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo: payload
    });
  }

  public async subscribePerformer(payload: SubscribePerformerPayload, user: PerformerDto) {
    const { type, performerId } = payload;
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    // eslint-disable-next-line no-nested-ternary
    const subscriptionType = type === SUBSCRIPTION_TYPE.FREE ? PAYMENT_TYPE.FREE_SUBSCRIPTION : type === SUBSCRIPTION_TYPE.MONTHLY ? PAYMENT_TYPE.MONTHLY_SUBSCRIPTION : PAYMENT_TYPE.YEARLY_SUBSCRIPTION;
    const transaction = await this.createSubscriptionPaymentTransaction(performer, subscriptionType, user);
    if (subscriptionType === PAYMENT_TYPE.FREE_SUBSCRIPTION) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRANSACTION_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: new PaymentDto(transaction)
        })
      );
      return { success: true };
    }
    const { flexformId, subAccountNumber, salt } = await this.getPerformerSubscriptionPaymentGateway(performer._id);
    return this.ccbillService.subscription({
      transactionId: transaction._id,
      price: transaction.totalPrice,
      flexformId,
      salt,
      subAccountNumber,
      subscriptionType
    });
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
    paymentTransaction.source = 'user';
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
      const { flexformId, subAccountNumber, salt } = await this.getCCbillPaymentGatewaySettings();
      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: coupon ? totalPrice - parseFloat((totalPrice * coupon.value).toFixed(2)) : totalPrice,
        transactionId: transaction._id
      });
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
        return { paymentUrl: `${process.env.USER_URL}/payment/cancel` };
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
        data: new PaymentDto(transaction)
      })
    );
    return { ok: true };
  }

  public async ccbillRenewalSuccessWebhook(payload: any) {
    const subscriptionId = payload.subscriptionId || payload.subscription_id;
    if (!subscriptionId) {
      throw new BadRequestException();
    }
    const subscription = await this.subscriptionService.findBySubscriptionId(subscriptionId);
    if (!subscription || subscription.status === SUBSCRIPTION_STATUS.DEACTIVATED) {
      return { ok: false };
    }
    const transaction = await this.createRenewalSubscriptionPaymentTransaction(subscription, payload);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(transaction)
      })
    );
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
        data: new PaymentDto(transaction)
      })
    );
    return { ok: true };
  }

  public async cancelSubscription(performerId: any, user: PerformerDto) {
    const subscription = await this.subscriptionService.findOneSubscription(performerId, user._id);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    if (subscription.subscriptionType === SUBSCRIPTION_TYPE.FREE || !subscription.subscriptionId) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
          eventName: EVENT.DELETED,
          data: new SubscriptionDto(subscription)
        })
      );
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      await subscription.save();
      return { success: true };
    }
    const { subscriptionId } = subscription;
    const [ccbillClientAccNo, ccbillDatalinkUsername, ccbillDatalinkPassword] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CLIENT_ACCOUNT_NUMBER),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_DATALINK_USERNAME),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_DATALINK_PASSWORD)
    ]);
    if (!ccbillClientAccNo || !ccbillDatalinkUsername || !ccbillDatalinkPassword) {
      throw new MissingConfigPaymentException();
    }
    try {
      const resp = await axios.get(`${ccbillCancelUrl}?subscriptionId=${subscriptionId}&username=${ccbillDatalinkUsername}&password=${ccbillDatalinkPassword}&action=cancelSubscription&clientAccnum=${ccbillClientAccNo}`);
      // TODO tracking data response
      if (resp.data && resp.data.includes('"results"\n"1"\n')) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
            eventName: EVENT.DELETED,
            data: new SubscriptionDto(subscription)
          })
        );
        subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
        subscription.updatedAt = new Date();
        await subscription.save();
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      throw new HttpException(e, 500);
    }
  }

  public async adminCancelSubscription(id: string) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    if (subscription.subscriptionType === SUBSCRIPTION_TYPE.FREE || !subscription.subscriptionId) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
          eventName: EVENT.DELETED,
          data: new SubscriptionDto(subscription)
        })
      );
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      await subscription.save();
      return { success: true };
    }
    const { subscriptionId } = subscription;
    const [ccbillClientAccNo, ccbillDatalinkUsername, ccbillDatalinkPassword] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CLIENT_ACCOUNT_NUMBER),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_DATALINK_USERNAME),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_DATALINK_PASSWORD)
    ]);
    if (!ccbillClientAccNo || !ccbillDatalinkUsername || !ccbillDatalinkPassword) {
      throw new MissingConfigPaymentException();
    }
    try {
      const resp = await axios.get(`${ccbillCancelUrl}?subscriptionId=${subscriptionId}&username=${ccbillDatalinkUsername}&password=${ccbillDatalinkPassword}&action=cancelSubscription&clientAccnum=${ccbillClientAccNo}`);
      // TODO tracking data response
      if (resp.data && resp.data.includes('"results"\n"1"\n')) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
            eventName: EVENT.DELETED,
            data: new SubscriptionDto(subscription)
          })
        );
        subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
        subscription.updatedAt = new Date();
        await subscription.save();
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      throw new HttpException(e, 500);
    }
  }
}
