import { toObjectId } from 'src/kernel/helpers/string.helper';
/* eslint-disable no-param-reassign */
import {
  Injectable, Inject, HttpException
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import {
  AgendaService, EntityNotFoundException
} from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { SUBSCRIPTION_MODEL_PROVIDER } from 'src/modules/subscription/providers/subscription.provider';
import { SCHEDULE_MASS_MESSAGE_AGENDA } from 'src/modules/feed/constants';
import { MASS_MESSAGE_STATUS } from 'src/kernel/constants';
import moment = require('moment');
import { MassMessageDto } from '../dtos/mass-message.dto';
import {
  MassMessageModel
} from '../models';
import { MassMessagesToSubscribersCreatePayload, MassMessagesUpdatePayload, MessageCreatePayload } from '../payloads/message-create.payload';
import { ConversationService } from './conversation.service';
import { MASS_MESSAGE_MODEL_PROVIDER } from '../providers';
import { MassMessageSearchPayload } from '../payloads';
import { MessageService } from './message.service';

@Injectable()
export class MassMessageService {
  constructor(
    private readonly conversationService: ConversationService,
    @Inject(SUBSCRIPTION_MODEL_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionModel>,
    @Inject(MASS_MESSAGE_MODEL_PROVIDER)
    private readonly massMessageModel: Model<MassMessageModel>,
    private readonly agenda: AgendaService,
    private readonly messageService: MessageService
  ) {
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agenda as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          SCHEDULE_MASS_MESSAGE_AGENDA
        ]
      }
    });
    // schedule massMessage
    this.agenda.define(SCHEDULE_MASS_MESSAGE_AGENDA, {}, this.scheduleMassMessage.bind(this));
    this.agenda.schedule('10 seconds from now', SCHEDULE_MASS_MESSAGE_AGENDA, {});
  }

  private async scheduleMassMessage(job: any, done: any) {
    job.remove();
    try {
      const massMessages = await this.massMessageModel.find({
        isSchedule: true,
        scheduledAt: { $lte: new Date() }
      }).lean();
      if (!massMessages) {
        return;
      }
      await massMessages.reduce(async (lp, massMessage) => {
        await lp;
        const m = new MassMessageDto(massMessage);
        await this.massMessageModel.updateOne(
          {
            _id: m._id
          },
          {
            isSchedule: false,
            status: MASS_MESSAGE_STATUS.SENT,
            updatedAt: new Date()
          }
        );

        const subscribers = await this.subscriptionModel.find({
          performerId: m.senderId,
          expiredAt: { $gt: new Date() }
        });
        const userIds = subscribers.map((i) => i.userId.toString());
        if (!userIds.length) {
          return false;
        }
        await userIds.reduce(async (cb, userId) => {
          await cb;
          const sender = { source: 'performer', sourceId: m.senderId };
          const receiver = { source: 'user', sourceId: toObjectId(userId) };
          const conversation = await this.conversationService.createPrivateConversation(sender, receiver);
          const newPayload = { text: m.text } as MessageCreatePayload;
          await this.messageService.createPrivateMessage((conversation._id).toString(), newPayload, sender, '');

          return Promise.resolve();
        }, Promise.resolve());

        return Promise.resolve();
      }, Promise.resolve());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Schedule mass message error', e);
    } finally {
      this.agenda.schedule('1 minute from now', SCHEDULE_MASS_MESSAGE_AGENDA, {});
      typeof done === 'function' && done();
    }
  }

  public async findOne(id: string): Promise<MassMessageDto> {
    const message = await this.massMessageModel.findById(id);
    if (!message) {
      throw new EntityNotFoundException();
    }
    return new MassMessageDto(message);
  }

  public async searchMassMessages(
    req: MassMessageSearchPayload,
    user: UserDto
  ): Promise<any> {
    const query = {} as any;

    if (req.status) {
      query.status = req.status;
    }

    let sort = {
      updatedAt: -1
    } as any;

    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }

    query.senderId = user._id;

    const [data, total] = await Promise.all([
      this.massMessageModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.massMessageModel.countDocuments(query)
    ]);
    const massMessages = data.map((d) => new MassMessageDto(d));
    return {
      total,
      data: massMessages
    };
  }

  public async sendMassMessagesToSubscribers(user: UserDto, payload: MassMessagesToSubscribersCreatePayload) {
    if (!payload.text && !payload.subscriptionType) {
      throw new HttpException('Enter enough fields!', 422);
    }
    if (payload.isSchedule) {
      await this.massMessageModel.create({
        senderId: user._id,
        text: payload.text,
        isSchedule: true,
        scheduledAt: payload.scheduledAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return;
    }

    if (payload.subscriptionType === SUBSCRIPTION_TYPE.FREE) {
      // send mass messages to free subscribers
      const freeSubscribers = await this.subscriptionModel.find({
        performerId: user._id,
        subscriptionType: SUBSCRIPTION_TYPE.FREE,
        expiredAt: { $gt: new Date() }
      });
      const userIds = freeSubscribers.map((i) => i.userId.toString());
      if (!userIds.length) {
        return;
      }

      userIds.reduce(async (cb, userId) => {
        await cb;
        const sender = { source: 'performer', sourceId: user._id };
        const receiver = { source: 'user', sourceId: toObjectId(userId) };
        const conversation = await this.conversationService.createPrivateConversation(sender, receiver);
        const newPayload = { text: payload.text } as MessageCreatePayload;
        await this.messageService.createPrivateMessage((conversation._id).toString(), newPayload, sender, '');

        return Promise.resolve();
      }, Promise.resolve());
    } else {
      // send mass messages to paid subscribers
      const paidSubscribers = await this.subscriptionModel.find({
        performerId: user._id,
        subscriptionType: { $ne: SUBSCRIPTION_TYPE.FREE },
        expiredAt: { $gt: new Date() }
      });
      const userIds = paidSubscribers.map((i) => i.userId.toString());
      if (!userIds.length) {
        return;
      }

      userIds.reduce(async (cb, userId) => {
        await cb;
        const sender = { source: 'performer', sourceId: user._id };
        const receiver = { source: 'user', sourceId: toObjectId(userId) };
        const conversation = await this.conversationService.createPrivateConversation(sender, receiver);
        const newPayload = { text: payload.text } as MessageCreatePayload;
        await this.messageService.createPrivateMessage((conversation._id).toString(), newPayload, sender, '');

        return Promise.resolve();
      }, Promise.resolve());
    }
  }

  public async update(
    id: string | ObjectId,
    payload: MassMessagesUpdatePayload
  ): Promise<MassMessageDto> {
    const massMessage = await this.massMessageModel.findById(id);
    if (!massMessage) {
      throw new EntityNotFoundException();
    }
    if (massMessage.status === MASS_MESSAGE_STATUS.SENT) {
      throw new HttpException('Can\'t edit sent message', 422);
    }

    massMessage.text = payload.text;
    massMessage.scheduledAt = payload.scheduledAt;
    massMessage.updatedAt = new Date();
    await massMessage.save();
    const dto = new MassMessageDto(massMessage);

    return dto;
  }

  public async delete(id: string | ObjectId) {
    const massMessage = await this.massMessageModel.findById(id);
    if (!massMessage) {
      throw new EntityNotFoundException();
    }
    if (massMessage.status === MASS_MESSAGE_STATUS.SENT) {
      throw new HttpException('Can\'t delete sent message', 422);
    }

    await massMessage.remove();
    return true;
  }
}
