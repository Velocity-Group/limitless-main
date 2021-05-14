/* eslint-disable no-await-in-loop */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  PageableData,
  QueueEventService,
  EntityNotFoundException,
  QueueEvent,
  StringHelper,
  ForbiddenException,
  AgendaService
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import { uniq } from 'lodash';
import { UserService, UserSearchService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { EVENT } from 'src/kernel/constants';
import { UserSearchRequestPayload } from 'src/modules/user/payloads';
import { USER_ROLES } from 'src/modules/user/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PurchaseItemService } from 'src/modules/purchased-item/services';
import { SubscriptionModel } from '../models/subscription.model';
import { SUBSCRIPTION_MODEL_PROVIDER } from '../providers/subscription.provider';
import {
  SubscriptionCreatePayload,
  SubscriptionSearchRequestPayload
} from '../payloads';
import { SubscriptionDto } from '../dtos/subscription.dto';
import {
  SUBSCRIPTION_TYPE,
  SUBSCRIPTION_STATUS,
  UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL
} from '../constants';

const RECURRING_SUBSCRIPTION_AGENDA_CHECK = 'RECURRING_SUBSCRIPTION_AGENDA_CHECK';

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(forwardRef(() => UserSearchService))
    private readonly userSearchService: UserSearchService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PurchaseItemService))
    private readonly purchaseItemService: PurchaseItemService,
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>,
    private readonly queueEventService: QueueEventService,
    private readonly agenda: AgendaService
  ) {
    this.defindJobs();
  }

  private async defindJobs() {
    const collection = (this.agenda as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          RECURRING_SUBSCRIPTION_AGENDA_CHECK
        ]
      }
    });
    this.agenda.define(RECURRING_SUBSCRIPTION_AGENDA_CHECK, {}, this.handleRenewalSubscription.bind(this));
    this.agenda.every('3600 seconds', RECURRING_SUBSCRIPTION_AGENDA_CHECK, {});
  }

  private async handleRenewalSubscription(job: any, done: any): Promise<void> {
    try {
      const totalSubscriptions = await this.subscriptionModel.countDocuments({
        nextRecurringDate: { $lt: new Date() },
        status: SUBSCRIPTION_STATUS.ACTIVE
      });
      for (let i = 0; i <= totalSubscriptions / 99; i += 1) {
        const subscriptions = await this.subscriptionModel.find({
          nextRecurringDate: { $lt: new Date() },
          status: SUBSCRIPTION_STATUS.ACTIVE
        }).limit(99).skip(i * 99);
        const userIds = uniq(subscriptions.map((t) => t.userId));
        const users = userIds.length ? await this.userService.findByIds(userIds) : [];
        await Promise.all(subscriptions.map((sub) => {
          const user = users.find((u) => `${u._id}` === `${sub.userId}`);
          return this.purchaseItemService.systemRenewalSubscription({ performerId: sub.performerId, type: sub.subscriptionType }, new UserDto(user));
        }));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Check & recurring subscription error', e);
    } finally {
      done();
    }
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
      await existSubscription.save();
      await this.queueEventService.publish(
        new QueueEvent({
          channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
          eventName: EVENT.CREATED,
          data: new SubscriptionDto(existSubscription)
        })
      );
      return new SubscriptionDto(existSubscription);
    }
    payload.createdAt = new Date();
    payload.updatedAt = new Date();
    const newSubscription = await this.subscriptionModel.create(payload);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
        eventName: EVENT.CREATED,
        data: new SubscriptionDto(newSubscription)
      })
    );
    return new SubscriptionDto(newSubscription);
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
      // UIds.length ? this.performerService.getBlockUserList({ performerId: user._id, userId: { $in: UIds } }) : []
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

  public async findOneSubscription(
    performerId: string | ObjectId,
    userId: string | ObjectId
  ) {
    const subscription = await this.subscriptionModel.findOne({
      performerId,
      userId
    });
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

  public async cancelSubscription(id: string, user: UserDto): Promise<any> {
    if (!StringHelper.isObjectId(id)) throw new EntityNotFoundException();
    const subscription = await this.findById(id);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    if (!user.roles.includes(USER_ROLES.ADMIN) && user._id.toString() !== subscription.userId.toString()) {
      throw new ForbiddenException();
    }
    if (subscription.status === SUBSCRIPTION_STATUS.DEACTIVATED) return { success: true };
    subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
    subscription.expiredAt = new Date();
    subscription.updatedAt = new Date();
    subscription.startRecurringDate = new Date();
    subscription.nextRecurringDate = new Date();
    await subscription.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: UPDATE_PERFORMER_SUBSCRIPTION_CHANNEL,
        eventName: EVENT.DELETED,
        data: new SubscriptionDto(subscription)
      })
    );
    return { success: true };
  }
}
