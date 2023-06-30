import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { FilterQuery, LeanDocument, Model } from 'mongoose';
import {
  EntityNotFoundException,
  ForbiddenException,
  QueueEvent,
  QueueEventService
} from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { merge, uniqBy } from 'lodash';
import { PerformerDto } from 'src/modules/performer/dtos';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from 'src/modules/message/services';
import { MailerService } from 'src/modules/mailer';
import { PRIVATE_CHAT, StreamRequestStatus } from '../constant';
import { StreamDto, StreamRequestDto } from '../dtos';
import { StreamModel, StreamRequest } from '../models';
import { StreamRequestPayload, StreamRequestSearchPayload } from '../payloads';
import {
  STREAM_MODEL_PROVIDER,
  STREAM_REQUEST_MODEL_PROVIDER
} from '../providers/stream.provider';
import { StreamOfflineException } from '../exceptions';

const STREAM_REQUEST_CHANNLE = 'STREAM_REQUEST_CHANNLE';

@Injectable()
export class StreamRequestSerivce implements OnModuleInit {
  private logger = new Logger(StreamRequestSerivce.name);

  constructor(
    @Inject(STREAM_REQUEST_MODEL_PROVIDER)
    private readonly streamRequestModel: Model<StreamRequest>,
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(STREAM_MODEL_PROVIDER)
    private readonly streamModel: Model<StreamModel>,
    private readonly conversationService: ConversationService,
    private readonly mailService: MailerService
  ) {}

  onModuleInit() {
    this.queueEventService.subscribe(
      STREAM_REQUEST_CHANNLE,
      'HANDLE_REQUEST_APPROVED_REJECTED',
      this.handler.bind(this)
    );
  }

  public async create(req: StreamRequestPayload, currentUser: UserDto) {
    const request = await this.streamRequestModel.create({
      timezone: req.timezone,
      userId: currentUser._id,
      performerId: req.performerId,
      startAt: req.startAt
    });
    return plainToClass(StreamRequestDto, request.toObject());
  }

  public async approveRequest(
    requestId: string | ObjectId,
    currentUser: UserDto
  ) {
    const request = await this.streamRequestModel.findById(requestId);
    if (!request) throw new EntityNotFoundException();

    if (!request.performerId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    request.status = StreamRequestStatus.APPROVE;
    await request.save();
    await this.queueEventService.publish({
      channel: STREAM_REQUEST_CHANNLE,
      eventName: StreamRequestStatus.APPROVE,
      data: {
        requestId: request._id
      }
    });
    return plainToClass(StreamRequestDto, request.toObject());
  }

  public async rejectRequest(
    requestId: string | ObjectId,
    currentUser: UserDto
  ) {
    const request = await this.streamRequestModel.findById(requestId);
    if (!request) throw new EntityNotFoundException();

    if (!request.performerId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    request.status = StreamRequestStatus.REJECT;
    await request.save();
    await this.queueEventService.publish({
      channel: STREAM_REQUEST_CHANNLE,
      eventName: StreamRequestStatus.REJECT,
      data: {
        requestId: request._id
      }
    });
    return plainToClass(StreamRequestDto, request.toObject());
  }

  public async delete(requestId: string | ObjectId, currentUser: UserDto) {
    const request = await this.streamRequestModel.findById(requestId);
    if (!request) throw new EntityNotFoundException();

    if (!request.userId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    await request.remove();
    return true;
  }

  public async searchByUser(
    req: StreamRequestSearchPayload,
    currentUser: UserDto
  ) {
    const query: FilterQuery<StreamRequest> = {
      userId: currentUser._id
    };
    const [data, total] = await Promise.all([
      this.streamRequestModel
        .find(query)
        .limit(+req.limit)
        .skip(+req.offset)
        .lean(),
      this.streamRequestModel.countDocuments(query)
    ]);
    const performerIds = uniqBy(
      data.map((d) => d.performerId),
      (id) => id.toString()
    );

    return {
      data: await this.toResponse(data, { performerIds }),
      total
    };
  }

  public async searchByPerformer(
    req: StreamRequestSearchPayload,
    currentUser: UserDto
  ) {
    const query: FilterQuery<StreamRequest> = {
      performerId: currentUser._id
    };
    const [data, total] = await Promise.all([
      this.streamRequestModel
        .find(query)
        .limit(+req.limit)
        .skip(+req.offset)
        .lean(),
      this.streamRequestModel.countDocuments(query)
    ]);
    const userIds = uniqBy(
      data.map((d) => d.userId),
      (id) => id.toString()
    );
    return {
      data: await this.toResponse(data, { userIds }),
      total
    };
  }

  public async toResponse(
    requests: LeanDocument<StreamRequest>[],
    {
      performerIds = [],
      userIds = []
    }: { performerIds?: ObjectId[]; userIds?: ObjectId[] }
  ) {
    const [performers, users] = await Promise.all([
      performerIds.length
        ? this.performerService.findByIds(performerIds)
        : ([] as PerformerDto[]),
      userIds.length ? this.userService.findByIds(userIds) : ([] as UserDto[])
    ]);

    return requests.map((request) => {
      const user = users.length && users.find((u) => request.userId.equals(u._id));
      const performer = performers.length
        && performers.find((p) => request.performerId.equals(p._id));

      return plainToClass(
        StreamRequestDto,
        {
          ...request,
          ...(user && {
            userInfo: { ...user.toResponse(), balance: user.balance }
          }),
          ...(performer && {
            performerInfo: performer.toSearchResponse()
          })
        },
        {
          enableCircularCheck: true
        }
      );
    });
  }

  async handler(event: QueueEvent) {
    const notifyEmail = async (eventName: string, _request: StreamRequest) => {
      const [user, performer] = await Promise.all([
        this.userService.findById(_request.userId),
        this.performerService.findById(_request.performerId)
      ]);
      if (!user || !performer) return;

      if (eventName === StreamRequestStatus.APPROVE) {
        await Promise.all([
          this.mailService.send({
            template: 'model-approve-live-streaming-request',
            subject: 'Your request has been rejected',
            to: user.email,
            data: {
              username: performer.username,
              date: _request.startAt.split(' ')[0],
              // eslint-disable-next-line prefer-template
              time: _request.startAt.split(' ')[1] + ' ' + _request.timezone
            }
          }),
          this.mailService.send({
            template: 'live-streaming-request-approved',
            subject: '1-1 Live streaming appointment',
            to: performer.email,
            data: {
              username: user.username,
              date: _request.startAt.split(' ')[0],
              // eslint-disable-next-line prefer-template
              time: _request.startAt.split(' ')[1] + ' ' + _request.timezone
            }
          })
        ]);
      } else if (eventName === StreamRequestStatus.REJECT) {
        await this.mailService.send({
          template: 'model-reject-live-streaming-request',
          subject: 'Your request has been rejected',
          to: user.email,
          data: {
            username: performer.username
          }
        });
      }
    };

    try {
      const { eventName, data } = event;
      if (
        eventName !== StreamRequestStatus.APPROVE
        && eventName !== StreamRequestStatus.REJECT
      ) { return; }
      const { requestId } = data;
      const request = await this.streamRequestModel.findById(requestId);
      if (!request) return;

      let stream = await this.streamModel.findOne({ refId: requestId });
      if (!stream) {
        stream = await this.streamModel.create({
          sessionId: uuidv4(),
          type: PRIVATE_CHAT,
          refId: requestId,
          performerId: request.performerId,
          includeIds: [request.userId]
        });
        await this.conversationService.createStreamConversation(
          new StreamDto(stream)
        );
      }

      await notifyEmail(eventName, request);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async startStream(requestId: string, currentUser: UserDto, options: any) {
    const request = await this.streamRequestModel.findById(requestId);
    if (!request) throw new EntityNotFoundException();

    if (!request.performerId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    const stream = await this.streamModel.findOne({ refId: request._id });

    if (!stream) throw new EntityNotFoundException();

    let conversation = await this.conversationService.findOne({
      streamId: stream._id
    });

    if (!conversation) {
      conversation = await this.conversationService.createStreamConversation(
        new StreamDto(stream)
      );
    }

    merge(stream, options);
    await stream.save();

    return {
      activeStream: {
        ...new StreamDto(stream).toResponse(true),
        userId: request.userId
      },
      conversation
    };
  }

  async editStream(requestId: string, currentUser: UserDto, options: any) {
    const request = await this.streamRequestModel.findById(requestId);
    if (!request) throw new EntityNotFoundException();

    if (!request.performerId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    const stream = await this.streamModel.findOne({ refId: request._id });

    if (!stream) throw new EntityNotFoundException();

    merge(stream, options);
    await stream.save();

    return {
      activeStream: {
        ...new StreamDto(stream).toResponse(true),
        userId: request.userId
      }
    };
  }

  async joinStream(requestId: string, currentUser: UserDto) {
    const request = await this.streamRequestModel.findById(requestId);
    if (!request) throw new EntityNotFoundException();

    if (!request.userId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    const [stream, performer] = await Promise.all([
      this.streamModel.findOne({ refId: request._id }),
      this.performerService.findById(request.performerId)
    ]);
    if (!stream) throw new EntityNotFoundException();

    if (!stream.isStreaming) throw new StreamOfflineException();

    const conversation = await this.conversationService.findOne({
      streamId: stream._id
    });
    if (!conversation) throw new EntityNotFoundException();

    return {
      activeStream: {
        ...new StreamDto(stream).toResponse(),
        userId: request.userId
      },
      performer: new PerformerDto(performer).toResponse(),
      conversation
    };
  }
}
