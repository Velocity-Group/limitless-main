import {
  Injectable, Inject, forwardRef, HttpException
} from '@nestjs/common';
import { EntityNotFoundException } from 'src/kernel';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import Stripe from 'stripe';
import { UserService } from 'src/modules/user/services';
// import { SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import * as moment from 'moment';
import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PayoutRequestModel } from 'src/modules/payout-request/models/payout-request.model';
import { STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER } from '../providers';
import { PaymentTransactionModel, StripeConnectAccountModel } from '../models';
import { AuthoriseCardPayload } from '../payloads/authorise-card.payload';
import { PAYMENT_TYPE } from '../constants';

@Injectable()
export class StripeService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER)
    private readonly ConnectAccountModel: Model<StripeConnectAccountModel>,
    private readonly settingService: SettingService
  ) { }

  public async getConnectAccount(sourceId: string | ObjectId) {
    return this.ConnectAccountModel.findOne({ sourceId });
  }

  public async authoriseCard(user: UserDto, payload: AuthoriseCardPayload) {
    try {
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      // find & update customer Id
      const customer = user.stripeCustomerId ? await stripe.customers.retrieve(user.stripeCustomerId)
        : await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          description: `Create customer ${user.name || user.username}`
        });
      if (!customer) throw new HttpException('Could not retrieve customer on Stripe', 404);
      !user.stripeCustomerId && await this.userService.updateStripeCustomerId(user._id, customer.id);
      // add card
      const card = await stripe.customers.createSource(customer.id, {
        source: payload.sourceToken
      });
      card && !user.stripeCardIds.includes(card.id) && await this.userService.updateStripeCardIds(user._id, card.id);
      const cards = await stripe.customers.listSources(
        customer.id,
        { limit: 100 }
      );
      return cards;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Authorise card on Stripe error, please try again later', 400);
    }
  }

  public async removeCard(user: UserDto, cardId: string) {
    try {
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      // find & update customer Id
      const customer = user.stripeCustomerId ? await stripe.customers.retrieve(user.stripeCustomerId)
        : await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          description: `Create customer ${user.name || user.username}`
        });
      if (!customer) throw new HttpException('Could not retrieve customer on Stripe', 404);
      !user.stripeCustomerId && await this.userService.updateStripeCustomerId(user._id, customer.id);
      // add card
      const card = await stripe.customers.retrieveSource(customer.id, cardId);
      if (!card) throw new EntityNotFoundException();
      card && user.stripeCardIds.includes(card.id) && await this.userService.updateStripeCardIds(user._id, card.id, false);
      const deleted = await stripe.customers.deleteSource(customer.id, cardId);
      return deleted;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Remove card on Stripe error, please try again later', 400);
    }
  }

  public async getListCards(user: UserDto) {
    try {
      const secretKey = SettingService.getValueByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      // find & update customer Id
      const customer = user.stripeCustomerId ? await stripe.customers.retrieve(user.stripeCustomerId)
        : await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : `${user?.name || user?.username}`,
          description: `Create customer ${user.name || user.username}`,
          metadata: {
            userId: user._id.toString()
          }
        });
      if (!customer) throw new HttpException('Could not retrieve customer on Stripe', 404);
      !user.stripeCustomerId && await this.userService.updateStripeCustomerId(user._id, customer.id);
      const cards = await stripe.customers.listSources(
        customer.id,
        { limit: 100 }
      );
      return cards;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Get list cards on Stripe error, please try again later', 400);
    }
  }

  public async createSubscriptionPlan(transaction: PaymentTransactionModel, performer: PerformerDto, user: UserDto) {
    try {
      const connectAccount = await this.ConnectAccountModel.findOne({ sourceId: transaction.performerId });
      if (!connectAccount) throw new HttpException('This model hasn\'t connect with Stripe', 404);
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const performerCommissions = await this.performerService.getCommissions(transaction.performerId);
      const settingCommission = transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION ? await this.settingService.getKeyValue(SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION) : await this.settingService.getKeyValue(SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION);
      let commission = 0.2;
      switch (transaction.type) {
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
          commission = performerCommissions?.monthlySubscriptionCommission || settingCommission;
          break;
        case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
          commission = performerCommissions?.yearlySubscriptionCommission || settingCommission;
          break;
        default: commission = performerCommissions?.monthlySubscriptionCommission || settingCommission;
      }
      const product = await stripe.products.create({
        name: `Subcription ${performer?.name || performer?.username || `${performer?.firstName} ${performer?.lastName}`}`,
        description: `${user?.name || user?.username || `${user?.firstName} ${user?.lastName}`} ${transaction.type} ${performer?.name || performer?.username || `${performer?.firstName} ${performer?.lastName}`}`
      });
      if (!product) throw new HttpException('Stripe configuration error, please try again later', 400);
      // monthly subscription will be used once free trial end
      const price = transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION ? performer.monthlyPrice : transaction.totalPrice;
      const plan = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: 100 * price,
              product: product.id,
              recurring: {
                interval: 'day',
                interval_count: transaction.type === PAYMENT_TYPE.YEARLY_SUBSCRIPTION ? 365 : 30
              }
            }
          }
        ],
        metadata: {
          transactionId: transaction._id.toString()
        },
        transfer_data: {
          destination: connectAccount.accountId,
          amount_percent: 100 - commission * 100 // % percentage
        },
        trial_period_days: transaction.type === PAYMENT_TYPE.FREE_SUBSCRIPTION ? performer.durationFreeSubscriptionDays : 0
      });
      return plan;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Create a subscription plan on Stripe error, please try again later', 400);
    }
  }

  public async deleteSubscriptionPlan(subscription: SubscriptionModel) {
    try {
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const plan = await stripe.subscriptions.retrieve(subscription.subscriptionId);
      plan && await stripe.subscriptions.del(plan.id);
      return true;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Delete a subscription plan on Stripe error, please try again later', 400);
    }
  }

  public async createConnectAccount(user: UserDto) {
    try {
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      // create a connected account for model
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          transfers: { requested: true }
        }
      });
      let stripeConnectAccount = await this.ConnectAccountModel.findOne({
        sourceId: user._id
      });
      if (!stripeConnectAccount) {
        stripeConnectAccount = new this.ConnectAccountModel({
          source: user.isPerformer ? 'performer' : 'user',
          sourceId: user._id
        });
      }
      stripeConnectAccount.accountId = account.id;
      await stripeConnectAccount.save();
      // create an account link
      const accountLinks = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.USER_URL}/model/banking`,
        return_url: `${process.env.USER_URL}/model/banking`,
        type: 'account_onboarding'
      });
      return accountLinks;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Create a connect account on Stripe error, please try again later', 400);
    }
  }

  public async retrieveConnectAccount(sourceId: ObjectId | string) {
    try {
      const stripeConnectAccount = await this.ConnectAccountModel.findOne({
        sourceId
      });
      if (!stripeConnectAccount) {
        throw new HttpException('Please connect to Stripe with your account', 404);
      }
      const secretKey = SettingService.getValueByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const data = await stripe.accounts.retrieve(stripeConnectAccount.accountId);
      stripeConnectAccount.payoutsEnabled = data.payouts_enabled; // payout status
      stripeConnectAccount.detailsSubmitted = data.details_submitted;
      stripeConnectAccount.metaData = data;
      stripeConnectAccount.createdAt = new Date();
      stripeConnectAccount.updatedAt = new Date();
      await stripeConnectAccount.save();
      return stripeConnectAccount;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Retrieve connected account on Stripe error, please try again later', 400);
    }
  }

  public async getExpressLoginLink(user: UserDto) {
    try {
      const stripeConnectAccount = await this.ConnectAccountModel.findOne({
        sourceId: user._id
      });
      if (!stripeConnectAccount || !stripeConnectAccount.accountId) return this.createConnectAccount(user);
      const secretKey = SettingService.getValueByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const link = await stripe.accounts.createLoginLink(stripeConnectAccount.accountId);
      return link;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Get Stripe login link error, please try again later', 400);
    }
  }

  public async createSingleCharge(payload: any) {
    try {
      const {
        transaction, item, user, stripeCardId
      } = payload;
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const charge = await stripe.paymentIntents.create({
        amount: transaction.totalPrice * 100, // convert cents to dollars
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: stripeCardId,
        description: `${user?.name || user?.username} purchase ${transaction.type} ${item.name}`,
        metadata: {
          transactionId: transaction._id.toString() // to track on webhook
        },
        receipt_email: user.email,
        confirm: true,
        return_url: `${process.env.USER_URL}/user/payment-history`
      });
      return charge;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Charge error, please try again later', 400);
    }
  }

  public async createPayout(request: PayoutRequestModel) {
    try {
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const connectAccount = await this.ConnectAccountModel.findOne({ sourceId: request.sourceId });
      if (!connectAccount || !connectAccount.accountId) throw new HttpException('Stripe connected account was not found', 404);
      const account = await stripe.accounts.retrieve(connectAccount.accountId);
      if (!account || !account.payouts_enabled) throw new HttpException('Could not payout to this account, please check then try again later', 404);
      const payout = await stripe.transfers.create({
        amount: request.requestTokens * (request.tokenConversionRate || 1) * 100,
        currency: 'usd',
        description: `Payout via request at ${moment(request.createdAt).format('DD/MM/YYYY HH:mm')}`,
        metadata: {
          payoutRequestId: request._id.toString()
        },
        destination: account.id
      });
      return payout;
    } catch (e) {
      throw new HttpException(e?.raw?.message || e?.response || 'Payout error, please try again later', 400);
    }
  }
}
