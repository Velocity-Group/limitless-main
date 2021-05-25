import {
  Injectable, Inject, forwardRef, HttpException
} from '@nestjs/common';
import {
} from 'src/kernel';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ConfigService } from 'nestjs-config';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import Stripe from 'stripe';
import { STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER } from '../providers';
import { StripeConnectAccountModel } from '../models';
import {
  MissingConfigPaymentException
} from '../exceptions';

@Injectable()
export class StripeService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(STRIPE_ACCOUNT_CONNECT_MODEL_PROVIDER)
    private readonly ConnectAccountModel: Model<StripeConnectAccountModel>,
    private readonly config: ConfigService
  ) { }

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
      if (!account) {
        throw new MissingConfigPaymentException();
      }
      // create an account link
      const accountLinks = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: process.env.USER_URL,
        return_url: `${this.config.get('app.baseUrl')}/stripe/accounts/${user._id}/callback`,
        type: 'account_onboarding'
      });
      if (!accountLinks) {
        throw new MissingConfigPaymentException();
      }
      return accountLinks;
    } catch (e) {
      throw new HttpException(e?.raw?.message || 'Stripe configure error', 400);
    }
  }

  public async connectAccountCallback(payload: any, userId: string) {
    console.log(222, payload, userId);
    let stripeConnectAccount = await this.ConnectAccountModel.findOne({
      sourceId: userId
    });
    if (!stripeConnectAccount) {
      stripeConnectAccount = new this.ConnectAccountModel({
        source: 'performer',
        sourceId: userId
      });
    }
    stripeConnectAccount.metaData = payload;
    stripeConnectAccount.createdAt = new Date();
    stripeConnectAccount.updatedAt = new Date();
    await stripeConnectAccount.save();
  }

  public async retrieveConnectAccount(sourceId: ObjectId | string) {
    return this.ConnectAccountModel.findOne({
      sourceId
    });
  }
}
