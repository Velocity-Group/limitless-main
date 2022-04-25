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
import { TokenPackageService } from 'src/modules/token-package/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import axios from 'axios';
import { UserDto } from 'src/modules/user/dtos';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
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
    @Inject(forwardRef(() => TokenPackageService))
    private readonly tokenPackageService: TokenPackageService,
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

  private async getPerformerSubscriptionPaymentGateway(performerId, paymentGateway = 'stripe') {
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

  public async createSubscriptionPaymentTransaction(performer: PerformerDto, subscriptionType: string, user: UserDto, couponInfo?: CouponDto, paymentGateway = 'stripe') {
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
          description: `${subscriptionType} ${performer?.name || performer?.username} ${subscriptionType === PAYMENT_TYPE.FREE_SUBSCRIPTION ? `in ${performer?.durationFreeSubscriptionDays} days` : null}`,
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
    if (!performer) return null;
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
        productId: performer._id,
        productType: PAYMENT_TARGET_TYPE.PERFORMER,
        performerId: performer._id
      }],
      couponInfo: null,
      status: PAYMENT_STATUS.SUCCESS,
      paymentResponseInfo: payload
    });
  }

  public async subscribePerformer(payload: SubscribePerformerPayload, user: UserDto) {
    const {
      type, performerId, paymentGateway, stripeCardId
    } = payload;
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    // eslint-disable-next-line no-nested-ternary
    const subscriptionType = type === SUBSCRIPTION_TYPE.FREE ? PAYMENT_TYPE.FREE_SUBSCRIPTION : type === SUBSCRIPTION_TYPE.MONTHLY ? PAYMENT_TYPE.MONTHLY_SUBSCRIPTION : PAYMENT_TYPE.YEARLY_SUBSCRIPTION;
    const transaction = await this.createSubscriptionPaymentTransaction(performer, subscriptionType, user);
    if (paymentGateway === 'ccbill') {
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
    if (paymentGateway === 'stripe') {
      if (!user.stripeCustomerId || !stripeCardId) {
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
          transactionId: transaction._id
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
    paymentTransaction.paymentResponseInfo = {};
    paymentTransaction.status = PAYMENT_STATUS.CREATED;
    paymentTransaction.couponInfo = couponInfo;
    await paymentTransaction.save();
    return paymentTransaction;
  }

  public async buyTokens(tokenId: string | ObjectId, payload: PurchaseTokenPayload, user: UserDto) {
    const {
      paymentGateway, couponCode, currency, stripeCardId
    } = payload;
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
      description: `purchase token package ${tokenPackage.name || tokenPackage.description}`,
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
      paymentGateway,
      totalPrice,
      user,
      coupon
    );

    if (paymentGateway === 'ccbill') {
      const { flexformId, subAccountNumber, salt } = await this.getCCbillPaymentGatewaySettings();
      return this.ccbillService.singlePurchase({
        salt,
        flexformId,
        subAccountNumber,
        price: coupon ? totalPrice - parseFloat((totalPrice * coupon.value).toFixed(2)) : totalPrice,
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
      if (!user.stripeCustomerId || !stripeCardId) {
        throw new HttpException('Please add a payment card', 422);
      }
      const data = await this.stripeService.createSingleCharge({
        transaction,
        item: {
          name: tokenPackage.name
        },
        user,
        stripeCardId
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
    if (subscription.subscriptionType === SUBSCRIPTION_TYPE.FREE || !subscription.subscriptionId) {
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
    try {
      const resp = await axios.get(`${ccbillCancelUrl}?subscriptionId=${subscriptionId}&username=${ccbillDatalinkUsername}&password=${ccbillDatalinkPassword}&action=cancelSubscription&clientAccnum=${ccbillClientAccNo}`);
      // TODO tracking data response
      if (resp.data && resp.data.includes('"results"\n"1"\n')) {
        subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
        subscription.updatedAt = new Date();
        await subscription.save();
        await Promise.all([
          this.performerService.updateSubscriptionStat(subscription.performerId, -1),
          this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
        ]);
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      throw new HttpException(e, 500);
    }
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
    transaction.paymentResponseInfo = payload;
    transaction.updatedAt = new Date();
    transaction.liveMode = livemode;
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
        transaction.status = PAYMENT_STATUS.SUCCESS;
        if (transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION) {
          transaction.type = PAYMENT_TYPE.MONTHLY_SUBSCRIPTION;
          // save total price for free subscription, renew to month subscription
          // convert from cent to usd
          transaction.totalPrice = data?.object?.amount / 100 || data?.object?.amount_received / 100 || 0;
          transaction.originalPrice = data?.object?.amount / 100 || data?.object?.amount_received / 100 || 0;
        }
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
