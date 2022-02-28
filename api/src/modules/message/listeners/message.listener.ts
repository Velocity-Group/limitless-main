import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEvent, QueueEventService, StringHelper } from 'src/kernel';
import { Model } from 'mongoose';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { ObjectId } from 'mongodb';
import { StreamService } from 'src/modules/stream/services';
import { MESSAGE_CHANNEL, MESSAGE_EVENT, MESSAGE_PRIVATE_STREAM_CHANNEL } from '../constants';
import { MessageDto } from '../dtos';
import { CONVERSATION_MODEL_PROVIDER, NOTIFICATION_MESSAGE_MODEL_PROVIDER } from '../providers';
import { ConversationModel, NotificationMessageModel } from '../models';

const MESSAGE_NOTIFY = 'MESSAGE_NOTIFY';
const MESSAGE_STREAM_NOTIFY = 'MESSAGE_STREAM_NOTIFY';

@Injectable()
export class MessageListener {
  constructor(
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService,
    @Inject(CONVERSATION_MODEL_PROVIDER)
    private readonly conversationModel: Model<ConversationModel>,
    @Inject(NOTIFICATION_MESSAGE_MODEL_PROVIDER)
    private readonly NotificationModel: Model<NotificationMessageModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService
  ) {
    this.queueEventService.subscribe(
      MESSAGE_CHANNEL,
      MESSAGE_NOTIFY,
      this.handleMessage.bind(this)
    );
    this.queueEventService.subscribe(
      MESSAGE_PRIVATE_STREAM_CHANNEL,
      MESSAGE_STREAM_NOTIFY,
      this.handleStreamMessage.bind(this)
    );
  }

  private async handleMessage(event: QueueEvent): Promise<void> {
    if (event.eventName !== MESSAGE_EVENT.CREATED) return;
    const message = event.data as MessageDto;

    const conversation = await this.conversationModel
      .findOne({ _id: message.conversationId })
      .lean()
      .exec();
    if (!conversation) return;
    const recipient = conversation.recipients.find(
      (r) => r.sourceId.toString() !== message.senderId.toString()
    );
    await this.updateNotification(conversation, recipient);
    await this.handleSent(recipient.sourceId, message);
    await this.updateLastMessage(conversation, message);
  }

  private async updateLastMessage(conversation, message: MessageDto): Promise<void> {
    const lastMessage = StringHelper.truncate(message.text || '', 30);
    const lastSenderId = message.senderId;
    const lastMessageCreatedAt = message.createdAt;
    await this.conversationModel.updateOne({ _id: conversation._id }, {
      $set: {
        lastMessage,
        lastSenderId,
        lastMessageCreatedAt
      }
    });
  }

  // eslint-disable-next-line consistent-return
  private async updateNotification(conversation, recipient): Promise<void> {
    let notification = await this.NotificationModel.findOne({
      recipientId: recipient.sourceId,
      conversationId: conversation._id
    });
    if (!notification) {
      notification = new this.NotificationModel({
        recipientId: recipient.sourceId,
        conversationId: conversation._id,
        totalNotReadMessage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    notification.totalNotReadMessage += 1;
    await notification.save();
    const totalNotReadMessage = await this.NotificationModel.aggregate<any>([
      {
        $match: { recipientId: recipient.sourceId }
      },
      {
        $group: {
          _id: '$conversationId',
          total: {
            $sum: '$totalNotReadMessage'
          }
        }
      }
    ]);
    let total = 0;
    totalNotReadMessage && totalNotReadMessage.length && totalNotReadMessage.forEach((data) => {
      if (data.total) {
        total += 1;
      }
    });
    await this.notifyCountingNotReadMessageInConversation(recipient.sourceId, total);
  }

  private async notifyCountingNotReadMessageInConversation(receiverId, total): Promise<void> {
    await this.socketUserService.emitToUsers(new ObjectId(receiverId), 'nofify_read_messages_in_conversation', { total });
  }

  private async handleSent(recipientId, message): Promise<void> {
    await this.socketUserService.emitToUsers(recipientId, 'message_created', message);
  }

  private async handleStreamMessage(event: QueueEvent): Promise<void> {
    if (![MESSAGE_EVENT.CREATED, MESSAGE_EVENT.DELETED].includes(event.eventName)) return;
    const { message, conversation } = event.data;
    const roomName = this.streamService.getRoomName(conversation._id, conversation.type);
    await this.socketUserService.emitToRoom(roomName, `message_${event.eventName}_conversation_${conversation._id}`, message);
  }
}
