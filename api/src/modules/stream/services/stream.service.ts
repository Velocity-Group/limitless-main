import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException
} from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from 'src/modules/message/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { PerformerDto } from 'src/modules/performer/dtos';
import * as moment from 'moment';
import { merge, uniq } from 'lodash';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { TokenTransactionService } from 'src/modules/token-transaction/services';
import { PURCHASE_ITEM_STATUS } from 'src/modules/token-transaction/constants';
import { SocketUserService } from '../../socket/services/socket-user.service';
import { PUBLIC_CHAT } from '../constant';
import { StreamModel } from '../models';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import { StreamOfflineException } from '../exceptions';
import {
  SearchStreamPayload,
  SetDurationPayload,
  StartStreamPayload,
  UpdateStreamPayload
} from '../payloads';
import { StreamDto } from '../dtos';

@Injectable()
export class StreamService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(STREAM_MODEL_PROVIDER)
    private readonly streamModel: Model<StreamModel>,
    private readonly conversationService: ConversationService,
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly tokenTransactionService: TokenTransactionService
  ) {}

  public async findOne(query): Promise<StreamModel> {
    const stream = await this.streamModel.findOne(query);
    return stream;
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<StreamModel[]> {
    const streams = await this.streamModel.find({ _id: { $in: ids } });
    return streams;
  }

  async adminSearch(
    req: SearchStreamPayload
  ): Promise<PageableData<StreamDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [{ title: searchValue }, { description: searchValue }];
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isFree) {
      query.isFree = req.isFree === 'true';
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day'),
        $lte: moment(req.toDate).endOf('day')
      };
    }
    const sort = { isStreaming: -1, updatedAt: -1, createdAt: -1 };
    const [data, total] = await Promise.all([
      this.streamModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.streamModel.countDocuments(query)
    ]);
    const performerIds = uniq(data.map((d) => d.performerId));
    const streams = data.map((d) => new StreamDto(d));
    const [performers] = await Promise.all([
      this.performerService.findByIds(performerIds)
    ]);
    streams.forEach((stream) => {
      const performer = stream.performerId
        && performers.find((p) => `${p._id}` === `${stream.performerId}`);
      // eslint-disable-next-line no-param-reassign
      stream.performerInfo = performer
        ? new PerformerDto(performer).toResponse()
        : null;
    });
    return {
      data: streams,
      total
    };
  }

  async userSearch(
    req: SearchStreamPayload,
    user: UserDto
  ): Promise<PageableData<StreamDto>> {
    const query = {
      isStreaming: 1
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [{ title: searchValue }, { description: searchValue }];
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.isFree) {
      query.isFree = req.isFree === 'true';
    }
    const sort = { updatedAt: -1, createdAt: -1 };
    const [data, total] = await Promise.all([
      this.streamModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.streamModel.countDocuments(query)
    ]);
    const performerIds = uniq(data.map((d) => d.performerId));
    const streams = data.map((d) => new StreamDto(d));
    const [performers, subscriptions, conversations] = await Promise.all([
      this.performerService.findByIds(performerIds),
      user
        ? this.subscriptionService.findSubscriptionList({
          performerId: { $in: performerIds },
          userId: user._id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          expiredAt: { $gt: new Date() }
        })
        : [],
      this.conversationService.findByStreamIds(streams.map((s) => s._id))
    ]);
    streams.forEach((stream) => {
      const performer = stream.performerId
        && performers.find((p) => `${p._id}` === `${stream.performerId}`);
      const subscription = subscriptions.find(
        (s) => `${s.performerId}` === `${stream.performerId}`
      );
      // eslint-disable-next-line no-param-reassign
      stream.performerInfo = performer
        ? new PerformerDto(performer).toResponse()
        : null;
      // eslint-disable-next-line no-param-reassign
      stream.isSubscribed = !!subscription;
      const conversation = conversations.find((c) => c.streamId.equals(stream._id));
      // eslint-disable-next-line no-param-reassign
      stream.conversationId = conversation && conversation._id;
    });
    return {
      data: streams,
      total
    };
  }

  public async endSessionStream(streamId: string | ObjectId): Promise<any> {
    const stream = await this.streamModel.findOne({ _id: streamId });
    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }
    const conversation = await this.conversationService.findOne({
      streamId: stream._id
    });
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const roomName = this.getRoomName(conversation._id, conversation.type);
    await this.socketUserService.emitToRoom(
      roomName,
      'admin-end-session-stream',
      {
        streamId: stream._id,
        conversationId: conversation._id,
        createdAt: new Date()
      }
    );
    return { ended: true };
  }

  public async findByPerformerId(
    performerId: string | ObjectId,
    payload?: Partial<StreamDto>
  ): Promise<StreamModel> {
    return this.streamModel.findOne({ performerId, ...payload });
  }

  public async goLive(payload: StartStreamPayload, performer: PerformerDto) {
    const {
      price, isFree, title, description
    } = payload;
    let stream = await this.streamModel.findOne({
      performerId: performer._id,
      type: PUBLIC_CHAT
    });
    const sessionId = uuidv4();
    if (!stream) {
      // eslint-disable-next-line new-cap
      stream = new this.streamModel({
        sessionId,
        performerId: performer._id,
        type: PUBLIC_CHAT
      });
    }
    stream.sessionId = sessionId;
    stream.streamingTime = 0;
    stream.isStreaming = 0;
    stream.isFree = isFree;
    stream.price = isFree ? 0 : price;
    stream.title = title;
    stream.description = description;
    stream.stats = { members: 0, likes: 0 };
    await stream.save();

    let conversation = await this.conversationService.findOne({
      type: `stream_${PUBLIC_CHAT}`,
      performerId: performer._id,
      streamId: stream._id
    });
    if (!conversation) {
      conversation = await this.conversationService.createStreamConversation(
        new StreamDto(stream)
      );
    }

    return {
      conversation,
      ...new StreamDto(stream).toResponse(true)
    };
  }

  public async editLive(id, payload: UpdateStreamPayload) {
    const stream = await this.streamModel.findById(id);
    if (!stream) throw new EntityNotFoundException();
    merge(stream, payload);
    await stream.save();
    return new StreamDto(stream).toResponse(true);
  }

  public async joinPublicChat(performerId: string, user: UserDto) {
    const stream = await this.streamModel
      .findOne({
        performerId,
        type: PUBLIC_CHAT
      })
      .lean();

    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }

    const hasSubscribed = this.subscriptionService.checkSubscribed(
      performerId,
      user._id
    );
    if (!hasSubscribed) throw new ForbiddenException();

    const hasPurchased = !stream.isFree && !!(await this.tokenTransactionService.findOne({
      status: PURCHASE_ITEM_STATUS.SUCCESS,
      sourceId: user._id,
      sessionId: stream.sessionId
    }));
    return new StreamDto({ ...stream, hasPurchased }).toResponse();
  }

  public getRoomName(id: string | ObjectId, roomType: string) {
    return `conversation-${roomType}-${id}`;
  }

  public async updateStreamDuration(
    payload: SetDurationPayload,
    performer: PerformerDto
  ) {
    const { streamId, duration } = payload;
    const stream = await this.streamModel.findById(streamId);
    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (`${performer._id}` !== `${stream.performerId}`) {
      throw new ForbiddenException();
    }
    if (stream.streamingTime >= duration) {
      return { updated: true };
    }
    stream.streamingTime = duration;
    await stream.save();
    return { updated: true };
  }
}
