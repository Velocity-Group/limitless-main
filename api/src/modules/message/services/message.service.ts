/* eslint-disable no-param-reassign */
import {
  Injectable, Inject, ForbiddenException, HttpException, forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, EntityNotFoundException, getConfig } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARTGET_TYPE, PurchaseItemType } from 'src/modules/token-transaction/constants';
import { TokenTransactionService, TokenTransactionSearchService } from 'src/modules/token-transaction/services';
import { flatten } from 'lodash';
import { Storage } from 'src/modules/storage/contants';
import { REF_TYPE } from 'src/modules/file/constants';
import { ObjectId } from 'mongodb';
import {
  MessageModel, IRecipient
} from '../models';
import { MESSAGE_MODEL_PROVIDER } from '../providers/message.provider';
import { MessageCreatePayload } from '../payloads/message-create.payload';
import {
  MESSAGE_CHANNEL, MESSAGE_EVENT, MESSAGE_PRIVATE_STREAM_CHANNEL
} from '../constants';
import { MessageDto } from '../dtos';
import { ConversationService } from './conversation.service';
import { MessageListRequest } from '../payloads/message-list.payload';

@Injectable()
export class MessageService {
  constructor(
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly tokenTransactionService: TokenTransactionService,
    @Inject(forwardRef(() => TokenTransactionSearchService))
    private readonly tokenTransactionSearchService: TokenTransactionSearchService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(MESSAGE_MODEL_PROVIDER)
    private readonly messageModel: Model<MessageModel>,
    private readonly queueEventService: QueueEventService,
    private readonly fileService: FileService
  ) { }

  public findById(id: string | ObjectId) {
    return this.messageModel.findById(id);
  }

  public async createPrivateMessage(
    conversationId: string,
    payload: MessageCreatePayload,
    sender: IRecipient,
    jwToken: string
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const found = conversation.recipients.find(
      (recipient) => `${recipient.sourceId}` === `${sender.sourceId}`
    );
    if (!found) {
      throw new EntityNotFoundException();
    }
    // const recipient = conversation.recipients.find(
    //   (r) => `${r.sourceId}` !== `${sender.sourceId}`
    // );
    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    if (message.fileIds && message.fileIds.length) {
      await Promise.all(message.fileIds.map((fileId) => this.fileService.addRef((fileId as any), {
        itemId: message._id,
        itemType: REF_TYPE.MESSAGE
      })));
    }
    const files = message.fileIds ? await this.fileService.findByIds(message.fileIds) : [];
    // let isSubscribed = true;
    // if (sender.source === 'performer' && recipient.source === 'user' && files.length > 0) {
    //   isSubscribed = !!(await this.subscriptionService.checkSubscribed(sender.sourceId, recipient.sourceId));
    // }
    const dto = new MessageDto(message);
    dto.isBought = true;
    dto.files = files.map((file) => {
      // track server s3 or local, assign jwtoken if local
      let fileUrl = file.getUrl(true);
      if (file.server !== Storage.S3) {
        fileUrl = `${file.getUrl()}?messageId=${message._id}&token=${jwToken}`;
      }

      return {
        ...file.toResponse(),
        thumbnails: file.getThumbnails(),
        url: fileUrl
      };
    });
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: {
        ...dto,
        // files: dto.files.map((f) => {
        //   if ((['message-photo', 'message-video'].includes(f.type) && dto.isSale && dto.price > 0)
        //     || (['message-photo', 'message-video'].includes(f.type) && !dto.isSale && !isSubscribed)) {
        //     return { ...f, url: null };
        //   }
        //   return f;
        // }),
        isBought: false
      }
    });
    return dto;
  }

  public async validatePhotoFile(
    file: FileDto,
    isPublic = false
  ) {
    if (!file.isImage()) {
      await this.fileService.remove(file._id);
      throw new HttpException('Invalid photo file!', 422);
    }
    await this.fileService.queueProcessPhoto(file._id, {
      thumbnailSize: !isPublic ? getConfig('image').blurThumbnail : getConfig('image').originThumbnail
    });
  }

  public async validateVideoFile(video: FileDto): Promise<any> {
    if (!video.isVideo()) {
      await this.fileService.remove(video._id);
      throw new HttpException('Invalid video file!', 422);
    }
    await this.fileService.queueProcessVideo(video._id, {
      count: 1
    });
    return true;
  }

  public async checkAuth(req: any, user: UserDto) {
    const { query } = req;
    if (!query.messageId) {
      throw new ForbiddenException();
    }
    if ((user.roles && user.roles.indexOf('admin') > -1) || user.isPerformer) {
      return true;
    }
    const message = await this.messageModel.findById(query.messageId);
    if (!message) throw new EntityNotFoundException();
    if (`${user._id}` === `${message.senderId}`) {
      return true;
    }
    let isSubscribed = false;
    if (!message.isSale) {
      // check subscription
      const subscribed = await this.subscriptionService.checkSubscribed(
        message.senderId,
        user._id
      );
      isSubscribed = !!subscribed;
      if (!isSubscribed) {
        throw new ForbiddenException();
      }
      return true;
    }
    if (message.isSale) {
      if (!message.price) {
        return true;
      }
      // check bought
      const bought = await this.tokenTransactionService.checkBought(message, PurchaseItemType.MESSAGE, user);
      if (!bought) {
        throw new ForbiddenException();
      }
      return true;
    }
    throw new ForbiddenException();
  }

  public async loadPrivateMessages(req: MessageListRequest, user: UserDto, jwToken: string) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const found = conversation.recipients.find(
      (recipient) => `${recipient.sourceId}` === `${user._id}`
    );

    if (!found) {
      throw new EntityNotFoundException();
    }

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.messageModel.countDocuments(query)
    ]);

    const fileIds = flatten(data.map((d) => d.fileIds));
    const messageIds = data.map((d) => d._id);
    const [files, transactions] = await Promise.all([
      this.fileService.findByIds(fileIds),
      this.tokenTransactionSearchService.findByQuery({
        sourceId: user._id,
        targetId: { $in: messageIds },
        target: PURCHASE_ITEM_TARTGET_TYPE.MESSAGE,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      })
    ]);
    const messages = data.map((m) => new MessageDto(m));

    await messages.reduce(async (cb, m: MessageDto) => {
      await cb;
      const _files = files.filter((f) => (`${m.fileIds}`).includes(`${f._id}`));
      if (_files.length) {
        m.files = [];
        await _files.reduce(async (lb, file) => {
          await lb;
          // track server s3 or local, assign jwtoken if local
          let fileUrl = await file.getUrl(true);
          if (file.server !== Storage.S3) {
            fileUrl = `${file.getUrl()}?messageId=${m._id}&token=${jwToken}`;
          }
          m.files.push({
            ...file.toResponse(),
            thumbnails: file.getThumbnails(),
            url: fileUrl
          });
          return Promise.resolve();
        }, Promise.resolve());
      }
      const bought = transactions.find((transaction) => `${transaction.targetId}` === `${m._id}`);
      m.isBought = !!bought;
      if ((m.isSale && !m.price) || user.isPerformer) {
        m.isBought = true;
      }
      return Promise.resolve();
    }, Promise.resolve());

    return {
      data: messages,
      total
    };
  }

  public async deleteMessage(messageId: string, user: UserDto) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }
    if (
      user.roles
      && !user.roles.includes('admin')
      && message.senderId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }
    await message.remove();
    // to remove mass messages
    message.fileIds && message.fileIds.length && await this.messageModel.deleteMany({
      text: message.text,
      fileIds: message.fileIds
    });
    message.fileIds.length > 0 && await this.fileService.removeMany(message.fileIds);

    if (message.conversationId) {
      const conversation = await this.conversationService.findById(message.conversationId);
      if (conversation) {
        conversation.streamId ? this.queueEventService.publish({
          channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
          eventName: MESSAGE_EVENT.DELETED,
          data: { message, conversation }
        }) : this.queueEventService.publish({
          channel: MESSAGE_CHANNEL,
          eventName: MESSAGE_EVENT.DELETED,
          data: { message: new MessageDto(message) }
        });
      }
    }
    return message;
  }

  // stream message
  public async loadPublicMessages(req: MessageListRequest) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.messageModel.countDocuments(query)
    ]);

    const senderIds = data.map((d) => d.senderId);
    const [users, performers] = await Promise.all([
      senderIds.length ? this.userService.findByIds(senderIds) : [],
      senderIds.length ? this.performerService.findByIds(senderIds) : []
    ]);

    const messages = data.map((message) => {
      let user = null;
      user = users.find((u) => u._id.toString() === message.senderId.toString());
      if (!user) {
        user = performers.find(
          (p) => p._id.toString() === message.senderId.toString()
        );
      }

      return {
        ...message,
        senderInfo: user ? new UserDto(user).toResponse() : new PerformerDto(user).toResponse()
      };
    });

    return {
      data: messages.map((m) => new MessageDto(m)),
      total
    };
  }

  public async createStreamMessageFromConversation(
    conversationId: string,
    payload: MessageCreatePayload,
    sender: IRecipient,
    user: UserDto
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    const dto = new MessageDto(message);
    dto.senderInfo = user;
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: { message: dto, conversation }
    });
    return dto;
  }

  public async deleteAllMessageInConversation(
    conversationId: string,
    user: any
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    if (
      conversation.performerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }

    await this.messageModel.deleteMany({ conversationId: conversation._id });
    return { success: true };
  }
}
