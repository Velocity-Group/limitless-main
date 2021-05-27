import {
  Injectable, Inject, forwardRef, HttpException
} from '@nestjs/common';
import {
} from 'src/kernel';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import Stripe from 'stripe';
import { UserService } from 'src/modules/user/services';
import { STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER } from '../providers';
import { StripeConnectAccountModel } from '../models';
import { AuthoriseCardPayload } from '../payloads/authorise-card.payload';

@Injectable()
export class StripeService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER)
    private readonly ConnectAccountModel: Model<StripeConnectAccountModel>
  ) { }

  // FOR USER
  public async authoriseCard(user: UserDto, payload: AuthoriseCardPayload) {
    try {
      const secretKey = SettingService.getByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
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
      card && !user.stripeCardIds.includes(card.id) && await this.userService.updateStripeCardIds(user._id, card.id, true);
      const cards = await stripe.customers.listSources(
        customer.id,
        { object: 'card', limit: 100 }
      );
      return cards;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configuration error', 400);
    }
  }

  public async getListCards(user: UserDto) {
    try {
      const secretKey = SettingService.getByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
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

  // FOR PERFORMER
  public async createConnectAccount(user: UserDto) {
    try {
      const secretKey = SettingService.getByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
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
    const secretKey = SettingService.getByKey(SETTING_KEYS.STRIPE_SECRET_KEY) || process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(secretKey, {
      apiVersion: '2020-08-27'
    });
    const link = await stripe.accounts.createLoginLink(stripeConnectAccount.accountId);
    return link;
  }
}
