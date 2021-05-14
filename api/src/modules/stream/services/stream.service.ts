import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  HttpException
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
import { uniq } from 'lodash';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { RequestService } from './request.service';
import { SocketUserService } from '../../socket/services/socket-user.service';
import {
  PRIVATE_CHAT,
  PUBLIC_CHAT,
  defaultStreamValue,
  BroadcastType,
  GROUP_CHAT
} from '../constant';
import { Webhook, IStream, StreamDto } from '../dtos';
import { StreamModel } from '../models';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import {
  StreamOfflineException,
  StreamServerErrorException
} from '../exceptions';
import {
  PrivateCallRequestPayload, SearchStreamPayload, SetDurationPayload, SetFreePayload, TokenCreatePayload
} from '../payloads';

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
    private readonly requestService: RequestService
  ) {}

  public async findOne(query): Promise<StreamModel> {
    const stream = await this.streamModel.findOne(query);
    return stream;
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<StreamModel[]> {
    const streams = await this.streamModel.find({ _id: { $in: ids } });
    return streams;
  }

  async search(req: SearchStreamPayload):Promise<PageableData<StreamDto>> {
    const query = {} as any;
    const sort = { isStreaming: -1, updatedAt: -1, createdAt: -1 };
    if (req.type) {
      query.type = req.type;
    }
    if (req.isFree) {
      query.isFree = req.isFree;
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day'),
        $lte: moment(req.toDate).endOf('day')
      };
    }
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
      const performer = stream.performerId && performers.find((p) => `${p._id}` === `${stream.performerId}`);
      // eslint-disable-next-line no-param-reassign
      stream.performerInfo = performer ? new PerformerDto(performer).toResponse() : null;
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
    const conversation = await this.conversationService.findOne({ streamId: stream._id });
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
    const stream = await this.streamModel.findOne({ performerId, ...payload });
    return stream;
  }

  public async goLive(performer: PerformerDto) {
    let stream = await this.streamModel.findOne({
      performerId: performer._id,
      type: PUBLIC_CHAT
    });
    const sessionId = uuidv4();
    if (!stream) {
      const data: IStream = {
        sessionId,
        performerId: performer._id,
        type: PUBLIC_CHAT,
        isStreaming: 1
      };
      stream = await this.streamModel.create(data);
    }
    if (stream) {
      stream.sessionId = sessionId;
      stream.streamingTime = 0;
      stream.isStreaming = 1;
      await stream.save();
    }

    let conversation = await this.conversationService.findOne({
      type: `stream_${PUBLIC_CHAT}`,
      performerId: performer._id
    });
    if (!conversation) {
      conversation = await this.conversationService.createStreamConversation(
        new StreamDto(stream)
      );
    }

    const data = {
      ...defaultStreamValue,
      streamId: stream._id,
      name: stream._id,
      description: `${performer?.name || performer?.username} public stream`,
      type: BroadcastType.LiveStream,
      status: 'finished'
    };

    const result = await this.requestService.create(data);
    if (result.status) {
      throw new StreamServerErrorException({
        message: result.data?.data?.message,
        error: result.data,
        status: result.data?.status
      });
    }

    return { conversation, sessionId: stream._id, isFree: stream.isFree };
  }

  public async joinPublicChat(performerId: string | ObjectId) {
    const stream = await this.streamModel.findOne({
      performerId,
      type: PUBLIC_CHAT
    });
    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }

    return {
      sessionId: stream._id, isFree: stream.isFree, streamingTime: stream.streamingTime, isStreaming: stream.isStreaming
    };
  }

  public async requestPrivateChat(
    user: UserDto,
    payload: PrivateCallRequestPayload,
    performerId: string | ObjectId
  ) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    if (user.balance < performer.privateChatPrice) {
      throw new HttpException('Your token balance is not enough', 422);
    }
    const subscribed = await this.subscriptionService.checkSubscribed(
      performerId,
      user._id
    );
    if (!subscribed) {
      throw new HttpException('You haven\'t subscribed this model yet', 403);
    }

    const data: IStream = {
      sessionId: uuidv4(),
      performerId,
      userIds: [user._id],
      type: PRIVATE_CHAT,
      isStreaming: 1
    };
    const stream = await this.streamModel.create(data);
    const recipients = [
      { source: 'performer', sourceId: performerId },
      { source: 'user', sourceId: user._id }
    ];
    const conversation = await this.conversationService.createStreamConversation(
      new StreamDto(stream),
      recipients
    );
    await this.socketUserService.emitToUsers(
      performerId,
      'private-chat-request',
      {
        user: new UserDto(user).toResponse(),
        streamId: stream._id,
        conversationId: conversation._id,
        userNote: payload.userNote,
        createdAt: new Date()
      }
    );
    return {
      conversation, sessionId: stream.sessionId, streamId: stream._id
    };
  }

  public async declinePrivateChat(
    convesationId: string,
    performer: PerformerDto
  ) {
    const conversation = await this.conversationService.findById(convesationId);
    if (!conversation) throw new EntityNotFoundException();
    const recipient = conversation.recipients.find((r) => `${r.sourceId}` === `${performer._id}`);
    if (!recipient) throw new ForbiddenException();
    const stream = conversation.streamId && await this.streamModel.findOne(conversation.streamId);
    if (!stream) throw new EntityNotFoundException();
    await Promise.all([
      stream.remove(),
      this.conversationService.deleteOne(conversation._id)
    ]);
    const userIds = conversation.recipients.map((r) => r.sourceId.toString());
    userIds.length && await this.socketUserService.emitToUsers(
      userIds,
      'private-chat-decline',
      {
        streamId: stream._id,
        conversationId: conversation._id
      }
    );
    return {
      declined: true
    };
  }

  public async acceptPrivateChat(id: string, performer: PerformerDto) {
    const conversation = await this.conversationService.findById(id);
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const recipent = conversation.recipients.find((r) => r.sourceId.toString() !== performer._id.toString());
    if (!recipent) {
      throw new EntityNotFoundException();
    }
    const stream = await this.findOne({ _id: conversation.streamId });
    if (!stream || `${stream.performerId}` !== `${performer._id}`) {
      throw new EntityNotFoundException();
    }
    if (!stream.isStreaming) {
      throw new HttpException('Stream session ended', 422);
    }
    const returnData = {
      conversation,
      sessionId: stream.sessionId,
      streamId: stream._id,
      isStreaming: stream.isStreaming,
      user: new PerformerDto(performer).toResponse(),
      createdAt: new Date()
    };
    // fire event to user do payment
    await this.socketUserService.emitToRoom(`conversation-${conversation.type}-${conversation._id}`, 'private-chat-accept', returnData);
    return returnData;
  }

  public async startGroupChat(performerId: ObjectId) {
    const groupChatRooms = await this.streamModel.find({
      performerId,
      type: GROUP_CHAT,
      isStreaming: 1
    });

    if (groupChatRooms.length) {
      await Promise.all(
        groupChatRooms.map((stream) => {
          stream.set('isStreaming', 0);
          return stream.save();
        })
      );
    }

    const data: IStream = {
      sessionId: uuidv4(),
      performerId,
      userIds: [],
      type: GROUP_CHAT,
      isStreaming: 1
    };
    const stream = await this.streamModel.create(data);
    const recipients = [{ source: 'performer', sourceId: performerId }];
    const conversation = await this.conversationService.createStreamConversation(
      new StreamDto(stream),
      recipients
    );

    return { conversation, sessionId: stream.sessionId, streamId: stream._id };
  }

  public async joinGroupChat(performerId: string, user: UserDto) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    if (user.balance < performer.groupChatPrice) {
      throw new HttpException('Your token balance is not enough', 422);
    }

    const stream = await this.streamModel.findOne({
      performerId,
      type: GROUP_CHAT,
      isStreaming: 1
    });
    if (!stream || (stream && !stream.isStreaming)) {
      throw new StreamOfflineException();
    }

    const conversation = await this.conversationService.findOne({
      streamId: stream._id
    });
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const numberOfParticipant = conversation.recipients.length - 1;
    const { maxParticipantsAllowed } = performer;
    if (maxParticipantsAllowed && numberOfParticipant > maxParticipantsAllowed) {
      throw new HttpException('Reached limitation of participants, please join later', 422);
    }
    const joinedTheRoom = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === user._id.toString()
    );
    if (!joinedTheRoom) {
      const recipient = {
        source: 'user',
        sourceId: user._id
      };
      await this.conversationService.addRecipient(conversation._id, recipient);
    }

    return { conversation, sessionId: stream.sessionId };
  }

  public async webhook(
    sessionId: string,
    payload: Webhook
  ): Promise<StreamModel> {
    const stream = await this.streamModel.findOne({ sessionId });
    if (!stream) {
      return;
    }
    switch (payload.action) {
      case 'liveStreamStarted':
        if (stream.type === PUBLIC_CHAT) stream.isStreaming = 1;
        break;
      case 'liveStreamEnded':
        if (stream.type === PUBLIC_CHAT) {
          stream.isStreaming = 0;
          stream.lastStreamingTime = new Date();
        }
        break;
      default:
        break;
    }

    await stream.save();
  }

  public async getOneTimeToken(payload: TokenCreatePayload, userId: string) {
    const { id } = payload;
    let streamId = id;
    if (id.indexOf(PRIVATE_CHAT) === 0 || id.indexOf('group') === 0) {
      [, streamId] = id.split('-');
    }

    const [stream, conversation] = await Promise.all([
      this.streamModel.findOne({ _id: streamId }),
      this.conversationService.findOne({ streamId })
    ]);

    if (!stream || !conversation) {
      throw new EntityNotFoundException();
    }

    const { recipients } = conversation;
    const recipientIds = recipients.map((r) => r.sourceId.toString());
    if (!recipientIds.includes(userId)) {
      throw new ForbiddenException();
    }

    const resp = await this.requestService.generateOneTimeToken(id, payload);
    return resp.data;
  }

  public getRoomName(id: string | ObjectId, roomType: string) {
    return `conversation-${roomType}-${id}`;
  }

  public async updateStreamInfo(payload: SetFreePayload, performer: PerformerDto) {
    const { streamId, isFree } = payload;
    if (!streamId) throw new EntityNotFoundException();
    const stream = await this.streamModel.findById(streamId);
    if (!stream) throw new EntityNotFoundException();
    if (stream.type === PUBLIC_CHAT && `${stream.performerId}` !== `${performer._id}`) throw new ForbiddenException();
    stream.isFree = isFree;
    await stream.save();
    const conversation = await this.conversationService.findOne({ streamId: stream._id });
    if (conversation) {
      const roomName = this.getRoomName(conversation._id, conversation.type);
      await this.socketUserService.emitToRoom(roomName, 'change-stream-info', { stream: { isFree } });
    }
    return { isFree };
  }

  public async updateStreamDuration(payload: SetDurationPayload, performer: PerformerDto) {
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
