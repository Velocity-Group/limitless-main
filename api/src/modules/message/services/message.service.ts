import {
  Injectable, Inject, ForbiddenException, HttpException, forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { QueueEventService, EntityNotFoundException } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { REF_TYPE } from 'src/modules/file/constants';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import {
  MessageModel, IRecipient
} from '../models';
import { MESSAGE_MODEL_PROVIDER } from '../providers/message.provider';
import { MessageCreatePayload } from '../payloads/message-create.payload';
import {
  MESSAGE_CHANNEL, MESSAGE_EVENT, MESSAGE_PRIVATE_STREAM_CHANNEL, MESSAGE_TYPE
} from '../constants';
import { MessageDto } from '../dtos';
import { ConversationService } from './conversation.service';
import { MessageListRequest } from '../payloads/message-list.payload';

@Injectable()
export class MessageService {
  constructor(
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

  public async createPrivateMessage(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }
    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    const dto = new MessageDto(message);
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async createPrivateFileMessage(
    sender: IRecipient,
    recipient: IRecipient,
    file: FileDto,
    payload: MessageCreatePayload
  ): Promise<MessageDto> {
    const conversation = await this.conversationService.createPrivateConversation(
      sender,
      recipient
    );
    if (!file) throw new HttpException('File is valid!', 400);
    if (!file.isImage()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new HttpException('Invalid image!', 400);
    }
    const message = await this.messageModel.create({
      ...payload,
      type: MESSAGE_TYPE.PHOTO,
      senderId: sender.sourceId,
      fileId: file._id,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();
    await this.fileService.addRef(file._id, {
      itemType: REF_TYPE.MESSAGE,
      itemId: message._id
    });

    const dto = new MessageDto(message);
    dto.imageUrl = file.getUrl();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async loadMessages(req: MessageListRequest, user: UserDto) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === user._id.toString()
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

    const fileIds = data.map((d) => d.fileId);
    const files = await this.fileService.findByIds(fileIds);
    const messages = data.map((m) => new MessageDto(m));
    messages.forEach((message) => {
      if (message.fileId) {
        const file = files.find((f) => f._id.toString() === message.fileId.toString());
        // eslint-disable-next-line no-param-reassign
        message.imageUrl = file ? file.getUrl() : null;
      }
    });

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
    message.fileId && await this.fileService.remove(message.fileId);
    if (message.conversationId) {
      const conversation = await this.conversationService.findById(message.conversationId);
      await this.queueEventService.publish({
        channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
        eventName: MESSAGE_EVENT.DELETED,
        data: { message, conversation }
      });
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
