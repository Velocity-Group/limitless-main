/* eslint-disable no-await-in-loop */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  PageableData,
  EntityNotFoundException
  // AgendaService
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import { UserService, UserSearchService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { UserSearchRequestPayload } from 'src/modules/user/payloads';
import { PerformerDto } from 'src/modules/performer/dtos';
// import { uniq } from 'lodash';
// import { MailerService } from 'src/modules/mailer';
import { SubscriptionModel } from '../models/subscription.model';
import { SUBSCRIPTION_MODEL_PROVIDER } from '../providers/subscription.provider';
import {
  SubscriptionCreatePayload,
  SubscriptionSearchRequestPayload,
  SubscriptionUpdatePayload
} from '../payloads';
import { SubscriptionDto } from '../dtos/subscription.dto';
import {
  SUBSCRIPTION_TYPE,
  SUBSCRIPTION_STATUS
} from '../constants';

// const CHECK_EXPIRED_SUBSCRIPTIONS_AND_NOTIFY = 'CHECK_EXPIRED_SUBSCRIPTIONS_AND_NOTIFY';

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(forwardRef(() => UserSearchService))
    private readonly userSearchService: UserSearchService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>
    // private readonly agenda: AgendaService,
    // private readonly mailerService: MailerService
  ) {
    // this.defineJobs();
  }

  // private async defineJobs() {
  //   const collection = (this.agenda as any)._collection;
  //   await collection.deleteMany({
  //     name: {
  //       $in: [
  //         CHECK_EXPIRED_SUBSCRIPTIONS_AND_NOTIFY
  //       ]
  //     }
  //   });
  //   this.agenda.define(CHECK_EXPIRED_SUBSCRIPTIONS_AND_NOTIFY, { }, this.checkSubscriptionsAndNotify.bind(this));
  //   this.agenda.every('24 hours', CHECK_EXPIRED_SUBSCRIPTIONS_AND_NOTIFY, {});
  // }

  // private async checkSubscriptionsAndNotify(job: any, done: any): Promise<void> {
  //   try {
  //     const total = await this.subscriptionModel.countDocuments({
  //       expiredAt: { $lt: new Date() },
  //       status: SUBSCRIPTION_STATUS.ACTIVE
  //     });
  //     for (let i = 0; i <= total / 99; i += 1) {
  //       const subscriptions = await this.subscriptionModel.find({
  //         expiredAt: { $lt: new Date() },
  //         status: SUBSCRIPTION_STATUS.ACTIVE
  //       }).limit(99).skip(i * 99);
  //       const userIds = subscriptions.map((f) => f.userId);
  //       const users = await this.userService.find({ _id: { $in: uniq(userIds) } });
  //       const performerIds = subscriptions.map((f) => f.performerId);
  //       const performers = await this.performerService.find({ _id: { $in: uniq(performerIds) } });
  //       await Promise.all(subscriptions.map((sub) => {
  //         const user = users.find((p) => `${p._id}` === `${sub.userId}`);
  //         const performer = performers.find((p) => `${p._id}` === `${sub.performerId}`);
  //         if (user && user.email && performer && sub.subscriptionType === SUBSCRIPTION_TYPE.FREE) {
  //           // mailer
  //           this.mailerService.send({
  //             subject: `Free trial subscription ${performer?.name || performer?.username} has been expired`,
  //             to: user.email,
  //             data: {
  //               performerName: performer.name || performer.username,
  //               userName: user.name || user.username
  //             },
  //             template: 'free-subscription-expired'
  //           });
  //         }
  //         // eslint-disable-next-line no-param-reassign
  //         sub.status = SUBSCRIPTION_STATUS.DEACTIVATED;
  //         return sub.save();
  //       }));
  //     }
  //   } catch (e) {
  //     // eslint-disable-next-line no-console
  //     console.log('Check expired subscriptions & mailer', e);
  //   } finally {
  //     done();
  //   }
  // }

  public async updateSubscriptionId({ userId, performerId, transactionId }, subscriptionId: string) {
    let subscription = await this.subscriptionModel.findOne({ userId, performerId });
    if (!subscription) {
      subscription = await this.subscriptionModel.create({
        createdAt: new Date(),
        updatedAt: new Date(),
        expiredAt: new Date(),
        status: SUBSCRIPTION_STATUS.DEACTIVATED,
        userId,
        performerId,
        transactionId
      });
    }
    subscription.subscriptionId = subscriptionId;
    await subscription.save();
  }

  public async findBySubscriptionId(subscriptionId: string) {
    return this.subscriptionModel.findOne({ subscriptionId });
  }

  public async findSubscriptionList(query: any) {
    const data = await this.subscriptionModel.find(query);
    return data;
  }

  public async countSubscriptions(query: any) {
    const data = await this.subscriptionModel.countDocuments(query);
    return data;
  }

  public async adminCreate(
    data: SubscriptionCreatePayload
  ): Promise<SubscriptionDto> {
    const payload = { ...data } as any;
    const existSubscription = await this.subscriptionModel.findOne({
      subscriptionType: SUBSCRIPTION_TYPE.FREE,
      userId: payload.userId,
      performerId: payload.performerId,
      expiredAt: payload.expiredAt
    });
    if (existSubscription) {
      existSubscription.expiredAt = new Date(payload.expiredAt);
      existSubscription.updatedAt = new Date();
      existSubscription.subscriptionType = payload.subscriptionType;
      existSubscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      await existSubscription.save();
      await Promise.all([
        this.performerService.updateSubscriptionStat(existSubscription.performerId, 1),
        this.userService.updateStats(existSubscription.userId, { 'stats.totalSubscriptions': 1 })
      ]);
      return new SubscriptionDto(existSubscription);
    }
    payload.createdAt = new Date();
    payload.updatedAt = new Date();
    payload.status = SUBSCRIPTION_STATUS.ACTIVE;
    const newSubscription = await this.subscriptionModel.create(payload);
    await Promise.all([
      this.performerService.updateSubscriptionStat(newSubscription.performerId, 1),
      this.userService.updateStats(newSubscription.userId, { 'stats.totalSubscriptions': 1 })
    ]);
    return new SubscriptionDto(newSubscription);
  }

  public async adminUpdate(
    subscriptionId: string,
    data: SubscriptionUpdatePayload
  ): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new EntityNotFoundException();
    }

    const payload = { ...data } as any;
    subscription.expiredAt = new Date(payload.expiredAt);
    subscription.updatedAt = new Date();
    subscription.subscriptionType = payload.subscriptionType;
    subscription.status = payload.status;
    await Promise.all([
      // todo - should check admin renew or cancel subscription
      this.performerService.updateSubscriptionStat(subscription.performerId, 1),
      this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': 1 })
    ]);
    await subscription.save();
    return new SubscriptionDto(subscription);
  }

  public async adminSearch(
    req: SubscriptionSearchRequestPayload
  ): Promise<PageableData<SubscriptionDto>> {
    const query = {} as any;
    if (req.userId) {
      query.userId = req.userId;
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.subscriptionType) {
      query.subscriptionType = req.subscriptionType;
    }
    if (req.q) {
      const usersSearch = await this.userSearchService.searchByKeyword({ q: req.q } as UserSearchRequestPayload);
      const Ids = usersSearch ? usersSearch.map((u) => u._id) : [];
      query.userId = { $in: Ids };
    }
    let sort = {
      updatedAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.subscriptionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.subscriptionModel.countDocuments(query)
    ]);
    const subscriptions = data.map((d) => new SubscriptionDto(d));
    const UIds = data.map((d) => d.userId);
    const PIds = data.map((d) => d.performerId);
    const [users, performers] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      PIds.length ? this.performerService.findByIds(PIds) : []
    ]);
    subscriptions.forEach((subscription: SubscriptionDto) => {
      const performer = performers.find(
        (p) => p._id.toString() === subscription.performerId.toString()
      );
      const user = users.find(
        (u) => u._id.toString() === subscription.userId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      subscription.userInfo = (user && new UserDto(user).toResponse()) || null;
      // eslint-disable-next-line no-param-reassign
      subscription.performerInfo = (performer && new PerformerDto(performer).toResponse()) || null;
    });
    return {
      data: subscriptions,
      total
    };
  }

  public async performerSearch(
    req: SubscriptionSearchRequestPayload,
    user: UserDto
  ): Promise<PageableData<SubscriptionDto>> {
    const query = {} as any;
    if (req.performerId) {
      query.performerId = req.performerId;
    } else {
      query.performerId = user._id;
    }
    if (req.userId) {
      query.userId = req.userId;
    }
    if (req.userIds) {
      query.userId = { $in: req.userIds };
    }
    if (req.subscriptionType) {
      query.subscriptionType = req.subscriptionType;
    }

    let sort = {
      updatedAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    if (req.q) {
      const usersSearch = await this.userSearchService.searchByKeyword({ q: req.q } as UserSearchRequestPayload);
      const Ids = usersSearch ? usersSearch.map((u) => u._id) : [];
      query.userId = { $in: Ids };
    }
    const [data, total] = await Promise.all([
      this.subscriptionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.subscriptionModel.countDocuments(query)
    ]);

    const subscriptions = data.map((d) => new SubscriptionDto(d));
    const UIds = data.map((d) => d.userId);
    const [users] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : []
    ]);

    subscriptions.forEach((subscription: SubscriptionDto) => {
      const userSubscription = users.find(
        (u) => u._id.toString() === subscription.userId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      subscription.userInfo = new UserDto(userSubscription).toResponse() || null;
    });
    return {
      data: subscriptions,
      total
    };
  }

  public async userSearch(
    req: SubscriptionSearchRequestPayload,
    user: UserDto
  ): Promise<PageableData<SubscriptionDto>> {
    const query = {
      userId: user._id
    } as any;
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.subscriptionType) {
      query.subscriptionType = req.subscriptionType;
    }
    let sort = {
      updatedAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.subscriptionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.subscriptionModel.countDocuments(query)
    ]);
    const subscriptions = data.map((d) => new SubscriptionDto(d));
    const UIds = data.map((d) => d.userId);
    const PIds = data.map((d) => d.performerId);
    const [users, performers] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      PIds.length ? this.performerService.findByIds(PIds) : []
    ]);
    subscriptions.forEach((subscription: SubscriptionDto) => {
      const performer = performers.find(
        (p) => p._id.toString() === subscription.performerId.toString()
      );
      const userSubscription = users.find(
        (u) => u._id.toString() === subscription.userId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      subscription.userInfo = (userSubscription && new UserDto(userSubscription).toResponse()) || null;
      // eslint-disable-next-line no-param-reassign
      subscription.performerInfo = (performer && new PerformerDto(performer).toPublicDetailsResponse()) || null;
    });
    return {
      data: subscriptions,
      total
    };
  }

  public async checkSubscribed(
    performerId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<any> {
    if (performerId.toString() === userId.toString()) {
      return 1;
    }
    return this.subscriptionModel.countDocuments({
      performerId,
      userId,
      expiredAt: { $gt: new Date() },
      status: SUBSCRIPTION_STATUS.ACTIVE
    });
  }

  public async findOneSubscription(payload) {
    const subscription = await this.subscriptionModel.findOne(payload);
    return subscription;
  }

  public async performerTotalSubscriptions(performerId: string | ObjectId) {
    const data = await this.subscriptionModel.countDocuments({ performerId, expiredAt: { $gt: new Date() } });
    return data;
  }

  public async findAllPerformerSubscriptions(performerId: string | ObjectId) {
    const data = await this.subscriptionModel.find({ performerId });
    return data;
  }

  public async findById(id: string | ObjectId): Promise<SubscriptionModel> {
    const data = await this.subscriptionModel.findById(id);
    return data;
  }

  public async adminUpdateUserStats(): Promise<any> {
    try {
      const [allUsers, allPerformers] = await Promise.all([
        this.userService.find({}),
        this.performerService.find({})
      ]);
      await Promise.all([
        allUsers.map(async (user) => {
          const totalSub = await this.subscriptionModel.count({
            userId: user._id,
            status: SUBSCRIPTION_STATUS.ACTIVE
          });
          await this.userService.updateOne({ _id: user._id }, {
            $set: {
              'stats.totalSubscriptions': totalSub
            }
          }, {});
        }),
        allPerformers.map(async (performer) => {
          const totalSub = await this.subscriptionModel.count({
            performerId: performer._id,
            status: SUBSCRIPTION_STATUS.ACTIVE
          });
          await this.performerService.updateOne({ _id: performer._id }, {
            $set: {
              'stats.subscribers': totalSub
            }
          }, {});
        })
      ]);

      return { success: true };
    } catch (error) {
      return { error };
    }
  }
}
