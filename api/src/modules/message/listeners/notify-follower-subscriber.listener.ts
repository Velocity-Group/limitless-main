import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { EVENT } from 'src/kernel/constants';
import {
  MESSAGE_CHANNEL, MESSAGE_EVENT, MESSAGE_TYPE,
  NOTIFY_SUBSCRIBER_MESSAGE_CHANNEL
} from '../constants';
import { MessageDto } from '../dtos';
import { MESSAGE_MODEL_PROVIDER } from '../providers';
import { MessageModel } from '../models';
import { ConversationService } from '../services';

const SUBSCRIBER_MESSAGE_TOPIC = 'SUBSCRIBER_MESSAGE_TOPIC';

@Injectable()
export class NotifySubscriberMessageListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(MESSAGE_MODEL_PROVIDER)
    private readonly messageModel: Model<MessageModel>,
    private readonly queueEventService: QueueEventService,
    private readonly conversationService: ConversationService

  ) {
    this.queueEventService.subscribe(
      NOTIFY_SUBSCRIBER_MESSAGE_CHANNEL,
      SUBSCRIBER_MESSAGE_TOPIC,
      this.handleMessage.bind(this)
    );
  }

  private async handleMessage(event: QueueEvent): Promise<void> {
    if (event.eventName !== EVENT.CREATED) return;
    const { sender, recipient } = event.data;
    const performer = await this.performerService.findById(sender.sourceId);
    if (!performer || !performer.defaultMessageText) return;
    const conversation = await this.conversationService.createPrivateConversation(sender, recipient);
    const file = performer.defaultMessagePhotoId && await this.fileService.findById(performer.defaultMessagePhotoId);
    const existed = await this.messageModel.findOne({
      type: MESSAGE_TYPE.NOTIFY,
      senderId: sender.sourceId,
      conversationId: conversation._id,
      text: performer.defaultMessageText
    });
    if (existed) return;
    const message = await this.messageModel.create({
      type: MESSAGE_TYPE.NOTIFY,
      fileIds: file?._id || null,
      text: performer.defaultMessageText,
      senderSource: sender.source,
      senderId: sender.sourceId,
      conversationId: conversation._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const dto = new MessageDto(message);
    dto.files = [{ ...file, url: file.getUrl() }];
    dto.senderInfo = new PerformerDto(performer).toResponse();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
  }
}
