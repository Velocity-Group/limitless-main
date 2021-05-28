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
import { SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import * as moment from 'moment';
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

  // FOR USER
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
      if (!customer) throw new HttpException('Could not retrieve customer', 404);
      !user.stripeCustomerId && await this.userService.updateStripeCustomerId(user._id, customer.id);
      // add card
      const card = await stripe.customers.createSource(customer.id, {
        source: payload.sourceToken
      });
      card && !user.stripeCardIds.includes(card.id) && await this.userService.updateStripeCardIds(user._id, card.id);
      const cards = await stripe.customers.listSources(
        customer.id,
        { object: 'card', limit: 100 }
      );
      return cards;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
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
      if (!customer) throw new HttpException('Could not retrieve customer', 404);
      !user.stripeCustomerId && await this.userService.updateStripeCustomerId(user._id, customer.id);
      // add card
      const card = await stripe.customers.retrieveSource(customer.id, cardId);
      if (!card) throw new EntityNotFoundException();
      card && user.stripeCardIds.includes(card.id) && await this.userService.updateStripeCardIds(user._id, card.id, false);
      const deleted = await stripe.customers.deleteSource(customer.id, cardId);
      return deleted;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
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
          name: `${user.firstName} ${user.lastName}`,
          description: `Create customer ${user.name || user.username}`
        });
      if (!customer) throw new HttpException('Could not retrieve customer', 404);
      !user.stripeCustomerId && await this.userService.updateStripeCustomerId(user._id, customer.id);
      const cards = await stripe.customers.listSources(
        customer.id,
        { object: 'card', limit: 100 }
      );
      return cards;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
    }
  }

  public async createSubscriptionPlan(transaction: PaymentTransactionModel) {
    const connectAccount = await this.ConnectAccountModel.findOne({ sourceId: transaction.performerId });
    if (!connectAccount) return null;
    const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(secretKey, {
      apiVersion: '2020-08-27'
    });
    const user = await this.userService.findById(transaction.sourceId);
    if (!user || !user.stripeCustomerId) return null;
    const performer = await this.performerService.findById(transaction.performerId);
    if (!performer) return null;
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
      default: commission = 0.2;
    }
    const product = await stripe.products.create({
      name: `Subcription ${performer?.name || performer?.username || `${performer?.firstName} ${performer?.lastName}`}`,
      description: `${transaction.type} ${performer?.name || performer?.username || `${performer?.firstName} ${performer?.lastName}`}`
    });
    if (!product) return null;
    const plan = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 100 * transaction.totalPrice,
            product: product.id,
            recurring: {
              interval: transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION ? 'month' : 'year',
              interval_count: 1
            }
          }
        }
      ],
      cancel_at_period_end: false,
      metadata: {
        transactionId: transaction._id
      },
      billing_cycle_anchor: moment().add(transaction.type === PAYMENT_TYPE.MONTHLY_SUBSCRIPTION ? 30 : 365, 'days').valueOf(), // next date charge
      transfer_data: {
        destination: connectAccount.accountId,
        amount_percent: 100 - commission * 100 // % percentage
      }
    });
    return plan;
  }

  // FOR PERFORMER
  public async createConnectAccount(user: UserDto) {
    try {
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      // create a connected account
      const account = await stripe.accounts.create({
        type: 'express'
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
        refresh_url: `${process.env.USER_URL}/${user.isPerformer ? 'model' : 'user'}/account`,
        return_url: `${process.env.USER_URL}/${user.isPerformer ? 'model' : 'user'}/account`,
        type: 'account_onboarding'
      });
      return accountLinks;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
    }
  }

  public async connectAccountCallback(payload: any) {
    const { data, type } = payload;
    if (!['account.updated'].includes(type)) return { success: false };
    if (!data.object || !data.object.id) return { success: false };
    const stripeConnectAccount = await this.ConnectAccountModel.findOne({
      accountId: data.object.id // check params
    });
    if (!stripeConnectAccount) return { success: false };
    stripeConnectAccount.metaData = data;
    stripeConnectAccount.detailsSubmitted = data.details_submitted;
    stripeConnectAccount.chargesEnabled = data.charges_enabled;
    stripeConnectAccount.createdAt = new Date();
    stripeConnectAccount.updatedAt = new Date();
    await stripeConnectAccount.save();
    return { success: true };
  }

  public async retrieveConnectAccount(sourceId: ObjectId | string) {
    return this.ConnectAccountModel.findOne({
      sourceId
    });
  }

  public async getExpressLoginLink(user: UserDto) {
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
  }

  // PAYMENT
  public async createSubscriptionCharge(payload: any) {
    try {
      const {
        transaction, subscriptionType, user, performer, stripeCardId
      } = payload;
      const connectAccount = await this.ConnectAccountModel.findOne({ sourceId: transaction.performerId });
      if (!connectAccount) throw new HttpException('Model connected Stripe account was not found', 404);
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const performerCommissions = await this.performerService.getCommissions(transaction.performerId);
      const settingCommission = subscriptionType === SUBSCRIPTION_TYPE.MONTHLY ? await this.settingService.getKeyValue(SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION) : await this.settingService.getKeyValue(SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION);
      let commission = 0.2;
      switch (transaction.type) {
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
          commission = performerCommissions?.monthlySubscriptionCommission || settingCommission;
          break;
        case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
          commission = performerCommissions?.yearlySubscriptionCommission || settingCommission;
          break;
        default: commission = 0.2;
      }
      const charge = await stripe.charges.create({
        amount: transaction.totalPrice * 100, // convert cents to dollars
        currency: 'usd',
        customer: user.stripeCustomerId,
        source: stripeCardId,
        description: `${user?.name || user?.username} ${transaction.type} ${performer?.name || performer?.username}`,
        metadata: {
          transactionId: transaction._id // to track on webhook
        },
        receipt_email: user.email,
        transfer_data: {
          destination: connectAccount.accountId,
          amount: (transaction.totalPrice - transaction.totalPrice * commission) * 100
        }
      });
      return charge;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
    }
  }

  public async createSingleCharge(payload: any) {
    try {
      const {
        transaction, subscriptionType, user, performer, stripeCardId
      } = payload;
      const connectAccount = await this.ConnectAccountModel.findOne({ sourceId: transaction.performerId });
      if (!connectAccount) throw new HttpException('Model connected Stripe account was not found', 404);
      const secretKey = await this.settingService.getKeyValue(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2020-08-27'
      });
      const performerCommissions = await this.performerService.getCommissions(transaction.performerId);
      const settingCommission = subscriptionType === SUBSCRIPTION_TYPE.MONTHLY ? await this.settingService.getKeyValue(SETTING_KEYS.MONTHLY_SUBSCRIPTION_COMMISSION) : await this.settingService.getKeyValue(SETTING_KEYS.YEARLY_SUBSCRIPTION_COMMISSION);
      let commission = 0.2;
      switch (transaction.type) {
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION:
          commission = performerCommissions?.monthlySubscriptionCommission || settingCommission;
          break;
        case PAYMENT_TYPE.YEARLY_SUBSCRIPTION:
          commission = performerCommissions?.yearlySubscriptionCommission || settingCommission;
          break;
        default: commission = 0.2;
      }
      const charge = await stripe.charges.create({
        amount: transaction.totalPrice * 100, // convert cents to dollars
        currency: 'usd',
        customer: user.stripeCustomerId,
        source: stripeCardId,
        application_fee_amount: transaction.totalPrice * 100 * commission,
        description: `${user?.name || user?.username} ${transaction.type} ${performer?.name || performer?.username}`,
        metadata: {
          transactionId: transaction._id // to track on webhook
        },
        receipt_email: user.email
      });
      return charge;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
    }
  }
}
