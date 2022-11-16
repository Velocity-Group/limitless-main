/* eslint-disable no-nested-ternary */
import {
  Injectable, Inject, forwardRef, BadRequestException, HttpException, ForbiddenException
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
import { PerformerDto } from 'src/modules/performer/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import axios from 'axios';
import { UserDto } from 'src/modules/user/dtos';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
import { isObjectId } from 'src/kernel/helpers/string.helper';
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
import { StripeService } from './stripe.service';
import { PaymentDto } from '../dtos';

const ccbillCancelUrl = 'https://datalink.ccbill.com/utils/subscriptionManagement.cgi';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => CouponService))
    private readonly couponService: CouponService,
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly TransactionModel: Model<PaymentTransactionModel>,
    private readonly ccbillService: CCBillService,
    private readonly stripeService: StripeService,
    private readonly bitpayService: BitpayService,
    private readonly queueEventService: QueueEventService,
    private readonly settingService: SettingService,
    private readonly socketUserService: SocketUserService
  ) { }

  public async findById(id: string | ObjectId) {
    const data = await this.TransactionModel.findById(id);
    return data;
  }

  private async getCCbillPaymentGatewaySettings() {
    const flexformId = SettingService.getValueByKey(SETTING_KEYS.CCBILL_FLEXFORM_ID);
    const singleSubAccountNumber = SettingService.getValueByKey(SETTING_KEYS.CCBILL_SINGLE_SUB_ACCOUNT_NUMBER);
    const recurringSubAccountNumber = SettingService.getValueByKey(SETTING_KEYS.CCBILL_RECURRING_SUB_ACCOUNT_NUMBER);
    const salt = SettingService.getValueByKey(SETTING_KEYS.CCBILL_SALT);
    if (!flexformId || !singleSubAccountNumber || !recurringSubAccountNumber || !salt) {
      throw new MissingConfigPaymentException();
    }
    return {
      flexformId,
      singleSubAccountNumber,
      recurringSubAccountNumber,
      salt
    };
  }

  public async createSubscriptionPaymentTransaction(performer: PerformerDto, subscriptionType: string, user: UserDto, paymentGateway = 'stripe', couponInfo?: CouponDto) {
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
      source: 'user',
      sourceId: user._id,
      target: PAYMENT_TARGET_TYPE.PERFORMER,
      targetId: performer._id,
      performerId: performer._id,
      type: subscriptionType,
      originalPrice: price(),
      totalPrice,
      products: [
        {
          price: totalPrice,
          quantity: 1,
          name: `${subscriptionType} ${performer?.name || performer?.username}`,
          description: `${subscriptionType} ${performer?.name || performer?.username} ${subscriptionType === PAYMENT_TYPE.FREE_SUBSCRIPTION ? `in ${performer?.durationFreeSubscriptionDays} days` : ''}`,
          productId: performer._id,
          productType: PAYMENT_TARGET_TYPE.PERFORMER,
          performerId: performer._id
        }
      ],
      couponInfo,
      status: PAYMENT_STATUS.CREATED,
      paymentResponseInfo: null
    });
  }

  public async createCCbillRenewalSubscriptionPaymentTransaction(subscription: SubscriptionModel, payload: any) {
    const price = payload.billedAmount || payload.accountingAmount;
    const { userId, performerId, subscriptionType } = subscription;
    const performer = await this.performerService.findById(performerId);
    return this.TransactionModel.create({
      paymentGateway: 'ccbill',
      source: 'user',
      sourceId: userId,
      target: PAYMENT_TARGET_TYPE.PERFORMER,
      targetId: performerId,
      performerId,
      type: subscriptionType === SUBSCRIPTION_TYPE.MONTHLY ? PAYMENT_TYPE.MONTHLY_SUBSCRIPTION : PAYMENT_TYPE.YEARLY_SUBSCRIPTION,
      originalPrice: price,
      totalPrice: price,
      products: [{
        price,
        quantity: 1,
        name: `${subscriptionType} subscription ${performer?.name || performer?.username}`,
        description: `recurring ${subscriptionType} subscription ${performer?.name || performer?.username}`,
        productId: performerId,
        productType: PAYMENT_TARGET_TYPE.PERFORMER,
        performerId
      }],
      couponInfo: null,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo: payload
    });
  }

  public async subscribePerformer(payload: SubscribePerformerPayload, user: UserDto) {
    const {
      type, performerId
    } = payload;
    const paymentGateway = SettingService.getValueByKey(SETTING_KEYS.PAYMENT_GATEWAY) || 'stripe';
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    // eslint-disable-next-line no-nested-ternary
    const subscriptionType = type === SUBSCRIPTION_TYPE.FREE ? PAYMENT_TYPE.FREE_SUBSCRIPTION : type === SUBSCRIPTION_TYPE.MONTHLY ? PAYMENT_TYPE.MONTHLY_SUBSCRIPTION : PAYMENT_TYPE.YEARLY_SUBSCRIPTION;
    const transaction = await this.createSubscriptionPaymentTransaction(performer, subscriptionType, user, paymentGateway);
    if (paymentGateway === 'ccbill') {
      if (transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: TRANSACTION_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: new PaymentDto(transaction)
          })
        );
        await this.socketUserService.emitToUsers(
          transaction.sourceId,
          'payment_status_callback',
          { redirectUrl: `/payment/success?transactionId=${transaction._id.toString().slice(16, 24)}` }
        );
        return transaction;
      }
      const { flexformId, recurringSubAccountNumber, salt } = await this.getCCbillPaymentGatewaySettings();
      return this.ccbillService.subscription({
        transactionId: transaction._id,
        price: transaction.totalPrice,
        flexformId,
        salt,
        recurringSubAccountNumber,
        subscriptionType
      });
    }
    if (paymentGateway === 'stripe') {
      if (!user.stripeCustomerId || !user.stripeCardIds.length) {
        throw new HttpException('Please add a payment card', 422);
      }
      const plan = await this.stripeService.createSubscriptionPlan(transaction, performer, user);
      if (plan) {
        transaction.status = transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.CREATED;
        transaction.paymentResponseInfo = plan;
        transaction.stripeInvoiceId = plan.latest_invoice as any;
        await transaction.save();
        await this.subscriptionService.updateSubscriptionId({
          userId: transaction.sourceId,
          performerId: transaction.performerId,
          transactionId: transaction._id,
          paymentGateway: 'stripe'
        }, plan.id);
      }
      if (transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION) {
        await this.queueEventService.publish(
          new QueueEvent({
            channel: TRANSACTION_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: new PaymentDto(transaction)
          })
        );
        await this.socketUserService.emitToUsers(
          transaction.sourceId,
          'payment_status_callback',
          { redirectUrl: `/payment/success?transactionId=${transaction._id.toString().slice(16, 24)}` }
        );
      }
      return new PaymentDto(transaction).toResponse();
    }
    return new PaymentDto(transaction).toResponse();
  }

  public async createTokenPaymentTransaction(
    products: any[],
    paymentGateway: string,
    totalPrice: number,
    user: UserDto,
    couponInfo?: CouponDto
  ) {
    const paymentTransaction = new this.TransactionModel();
    paymentTransaction.originalPrice = totalPrice;
    paymentTransaction.paymentGateway = paymentGateway || 'stripe';
    paymentTransaction.source = 'user';
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PAYMENT_TARGET_TYPE.TOKEN_PACKAGE;
    paymentTransaction.targetId = products[0].productId;
    paymentTransaction.performerId = null;
    paymentTransaction.type = PAYMENT_TYPE.TOKEN_PACKAGE;
    paymentTransaction.totalPrice = couponInfo ? totalPrice - parseFloat((totalPrice * couponInfo.value).toFixed(2)) : totalPrice;
    paymentTransaction.products = products;
    paymentTransaction.paymentResponseInfo = null;
    paymentTransaction.status = PAYMENT_STATUS.CREATED;
    paymentTransaction.couponInfo = couponInfo;
    await paymentTransaction.save();
    return paymentTransaction;
  }

  public async buyTokens(payload: PurchaseTokenPayload, user: UserDto) {
    const {
      couponCode, currency, amount
    } = payload;
    const paymentGateway = SettingService.getValueByKey(SETTING_KEYS.PAYMENT_GATEWAY) || 'stripe';
    const totalPrice = amount;
    const products = [{
      price: totalPrice,
      quantity: 1,
      name: 'Wallet',
      description: `Top up Wallet $${amount}`,
      productId: null,
      productType: PAYMENT_TARGET_TYPE.TOKEN_PACKAGE,
      performerId: null,
      tokens: amount
    }];

    let coupon = null;
    if (couponCode) {
      coupon = await this.couponService.applyCoupon(couponCode, user._id);
    }

    const transaction = await this.createTokenPaymentTransaction(
      products,
      paymentGateway,
      totalPrice,
      user,
      coupon
    );

    if (paymentGateway === 'ccbill') {
      const { flexformId, singleSubAccountNumber, salt } = await this.getCCbillPaymentGatewaySettings();
      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        singleSubAccountNumber,
        price: coupon ? totalPrice - (totalPrice * coupon.value) : totalPrice,
        transactionId: transaction._id
      });
    }
    if (paymentGateway === 'bitpay') {
      const [bitpayApiToken, bitpayProductionMode] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.BITPAY_API_TOKEN),
        this.settingService.getKeyValue(SETTING_KEYS.BITPAY_PRODUCTION_MODE)
      ]);
      if (!bitpayApiToken) {
        throw new MissingConfigPaymentException();
      }
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
    }
    if (paymentGateway === 'stripe') {
      if (!user.stripeCustomerId || !user.stripeCardIds.length) {
        throw new HttpException('Please add a payment card', 422);
      }
      const data = await this.stripeService.createSingleCharge({
        transaction,
        item: {
          name: `Wallet - Top up $${amount}`
        },
        user,
        stripeCardId: user.stripeCardIds[0]
      });
      if (data) {
        transaction.stripeInvoiceId = data.id || (data.invoice && data.invoice.toString());
        await transaction.save();
      }
      return new PaymentDto(transaction).toResponse();
    }
    throw new MissingConfigPaymentException();
  }

  public async ccbillSinglePaymentSuccessWebhook(payload: Record<string, any>) {
    const transactionId = payload['X-transactionId'] || payload.transactionId;
    if (!transactionId) {
      throw new BadRequestException();
    }
    if (!isObjectId(transactionId)) {
      return { ok: false };
    }
    const transaction = await this.TransactionModel.findById(
      transactionId
    );
    if (!transaction) {
      return { ok: false };
    }
    transaction.status = PAYMENT_STATUS.SUCCESS;
    transaction.paymentResponseInfo = payload;
    transaction.updatedAt = new Date();
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: new PaymentDto(transaction)
      })
    );
    const redirectUrl = `/payment/success?transactionId=${transaction._id.toString().slice(16, 24)}`;
    redirectUrl && await this.socketUserService.emitToUsers(transaction.sourceId, 'payment_status_callback', { redirectUrl });
    return { ok: true };
  }

  public async ccbillRenewalSuccessWebhook(payload: any) {
    const subscriptionId = payload.subscriptionId || payload.subscription_id;
    if (!subscriptionId) {
      throw new BadRequestException();
    }
    const subscription = await this.subscriptionService.findBySubscriptionId(subscriptionId);
    if (!subscription) {
      return { ok: false };
    }
    const transaction = await this.createCCbillRenewalSubscriptionPaymentTransaction(subscription, payload);
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

  public async ccbillCancelSubscription(id: any, user: UserDto) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    if (!user.roles.includes('admin') && `${subscription.userId}` !== `${user._id}`) {
      throw new ForbiddenException();
    }
    if (!subscription.subscriptionId) {
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      await subscription.save();
      await Promise.all([
        this.performerService.updateSubscriptionStat(subscription.performerId, -1),
        this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
      ]);
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
    const resp = await axios.get(`${ccbillCancelUrl}?subscriptionId=${subscriptionId}&username=${ccbillDatalinkUsername}&password=${ccbillDatalinkPassword}&action=cancelSubscription&clientAccnum=${ccbillClientAccNo}`);
    // TODO tracking data response
    if (resp?.data && resp?.data.includes('"results"\n"1"\n')) {
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      subscription.updatedAt = new Date();
      await subscription.save();
      await Promise.all([
        this.performerService.updateSubscriptionStat(subscription.performerId, -1),
        this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
      ]);
      return { success: true };
    }
    if (resp?.data && resp?.data.includes('"results"\n"0"\n')) {
      throw new HttpException('The requested action failed.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-1"\n')) {
      throw new HttpException('The arguments provided to authenticate the merchant were invalid or missing.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-2"\n')) {
      throw new HttpException('The subscription id provided was invalid or the subscription type is not supported by the requested action.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-3"\n')) {
      throw new HttpException('No record was found for the given subscription.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-4"\n')) {
      throw new HttpException('The given subscription was not for the account the merchant was authenticated on.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-5"\n')) {
      throw new HttpException('The arguments provided for the requested action were invalid or missing.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-6"\n')) {
      throw new HttpException('The requested action was invalid', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-7"\n')) {
      throw new HttpException('There was an internal error or a database error and the requested action could not complete.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-8"\n')) {
      throw new HttpException('The IP Address the merchant was attempting to authenticate on was not in the valid range.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-9"\n')) {
      throw new HttpException('The merchant’s account has been deactivated for use on the Datalink system or the merchant is not permitted to perform the requested action', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-10"\n')) {
      throw new HttpException('The merchant has not been set up to use the Datalink system.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-11"\n')) {
      throw new HttpException('Subscription is not eligible for a discount, recurring price less than $5.00.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-12"\n')) {
      throw new HttpException('The merchant has unsuccessfully logged into the system 3 or more times in the last hour. The merchant should wait an hour before attempting to login again and is advised to review the login information.', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-15"\n')) {
      throw new HttpException('Merchant over refund threshold', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-16"\n')) {
      throw new HttpException('Merchant over void threshold', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-23"\n')) {
      throw new HttpException('Transaction limit reached', 400);
    }
    if (resp?.data && resp?.data.includes('"results"\n"-24"\n')) {
      throw new HttpException('Purchase limit reached', 400);
    }

    throw new HttpException('Cancel subscription has been fail, please try again later', 400);
  }

  public async ccbillUserReactivation(payload: any) {
    const { subscriptionId } = payload;
    const subscription = await this.subscriptionService.findBySubscriptionId(subscriptionId);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    subscription.updatedAt = new Date();
    await subscription.save();
    await Promise.all([
      this.performerService.updateSubscriptionStat(subscription.performerId, 1),
      this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': 1 })
    ]);
  }

  private async stripeCreateRenewalSubscription(transaction: PaymentTransactionModel, totalPrice: number, paymentResponseInfo: any) {
    const {
      paymentGateway, sourceId, targetId, target, type, originalPrice, products, couponInfo
    } = transaction;
    return this.TransactionModel.create({
      paymentGateway,
      source: 'user',
      sourceId,
      target,
      targetId,
      performerId: targetId,
      type: type === PAYMENT_TYPE.FREE_SUBSCRIPTION ? PAYMENT_TYPE.MONTHLY_SUBSCRIPTION : type,
      originalPrice,
      totalPrice,
      products,
      couponInfo,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo
    });
  }

  public async stripeSubscriptionWebhook(payload: Record<string, any>) {
    const { data } = payload;
    const subscriptionId = data?.object?.id;
    const transactionId = data?.object?.metadata?.transactionId;
    if (!subscriptionId && !transactionId) {
      throw new HttpException('Missing subscriptionId or transactionId', 404);
    }
    const subscription = await this.subscriptionService.findBySubscriptionId(subscriptionId);
    if (!subscription) throw new HttpException('Subscription was not found', 404);
    if (data?.object?.status !== 'active') {
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      await subscription.save();
    }
    const existedTransaction = transactionId && await this.TransactionModel.findById(transactionId);
    if (existedTransaction) {
      existedTransaction.stripeInvoiceId = data?.object?.latest_invoice;
      existedTransaction.updatedAt = new Date();
      await existedTransaction.save();
    }
    return { success: true };
  }

  public async stripePaymentWebhook(payload: Record<string, any>) {
    const { type, data, livemode } = payload;
    if (type === 'payment_intent.created') return { ok: true };
    const transactionId = data?.object?.metadata?.transactionId;
    const stripeInvoiceId = data?.object?.invoice || data?.object?.id;
    if (!stripeInvoiceId && !transactionId) {
      throw new HttpException('Missing invoiceId or transactionId', 404);
    }
    let transaction = transactionId && await this.TransactionModel.findOne({ _id: transactionId });
    if (!transaction) {
      transaction = stripeInvoiceId && await this.TransactionModel.findOne({ stripeInvoiceId });
    }
    if (!transaction) throw new HttpException('Transaction was not found', 404);

    let redirectUrl = '';
    switch (type) {
      case 'payment_intent.processing':
        transaction.status = PAYMENT_STATUS.PROCESSING;
        break;
      case 'payment_intent.canceled':
        redirectUrl = `/payment/cancel?transactionId=${transaction._id.toString().slice(16, 24)}`;
        transaction.status = PAYMENT_STATUS.CANCELED;
        break;
      case 'payment_intent.payment_failed':
        redirectUrl = `/payment/cancel?transactionId=${transaction._id.toString().slice(16, 24)}`;
        transaction.status = PAYMENT_STATUS.FAIL;
        break;
      case 'payment_intent.requires_action':
        transaction.status = PAYMENT_STATUS.REQUIRE_AUTHENTICATION;
        redirectUrl = data?.object?.next_action?.use_stripe_sdk?.stripe_js || data?.object?.next_action?.redirect_to_url?.url || '/user/payment-history';
        transaction.stripeConfirmUrl = redirectUrl;
        break;
      case 'payment_intent.succeeded':
        // create new record for renewal
        if ([PAYMENT_TYPE.FREE_SUBSCRIPTION, PAYMENT_TYPE.MONTHLY_SUBSCRIPTION, PAYMENT_TYPE.YEARLY_SUBSCRIPTION].includes(transaction.type) && transaction.status === PAYMENT_STATUS.SUCCESS) {
          const totalP = data?.object?.amount / 100 || data?.object?.amount_received / 100 || 0;
          const renewalTransaction = await this.stripeCreateRenewalSubscription(transaction, totalP, payload);
          await this.queueEventService.publish(
            new QueueEvent({
              channel: TRANSACTION_SUCCESS_CHANNEL,
              eventName: EVENT.CREATED,
              data: new PaymentDto(renewalTransaction)
            })
          );
          return { success: true };
        }
        transaction.status = PAYMENT_STATUS.SUCCESS;
        await this.queueEventService.publish(
          new QueueEvent({
            channel: TRANSACTION_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: new PaymentDto(transaction)
          })
        );
        redirectUrl = `/payment/success?transactionId=${transaction._id.toString().slice(16, 24)}`;
        break;
      default: break;
    }
    transaction.paymentResponseInfo = payload;
    transaction.updatedAt = new Date();
    transaction.liveMode = livemode;
    await transaction.save();
    redirectUrl && await this.socketUserService.emitToUsers(transaction.sourceId, 'payment_status_callback', { redirectUrl });
    return { success: true };
  }

  public async stripeCancelSubscription(id: any, user: UserDto) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    if (!user.roles.includes('admin') && `${subscription.userId}` !== `${user._id}`) {
      throw new ForbiddenException();
    }
    if (!subscription.subscriptionId) {
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      await subscription.save();
      await Promise.all([
        this.performerService.updateSubscriptionStat(subscription.performerId, -1),
        this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
      ]);
      return { success: true };
    }
    await this.stripeService.deleteSubscriptionPlan(subscription);
    subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
    subscription.updatedAt = new Date();
    await subscription.save();
    await Promise.all([
      this.performerService.updateSubscriptionStat(subscription.performerId, -1),
      this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
    ]);
    return { success: true };
  }
}
