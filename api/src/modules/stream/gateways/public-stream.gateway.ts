/* eslint-disable no-console */
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Inject, forwardRef } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from 'src/modules/auth/services';
import { StreamService } from 'src/modules/stream/services';
import { PUBLIC_CHAT } from 'src/modules/stream/constant';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import * as moment from 'moment';
import { PerformerService } from 'src/modules/performer/services';
import { ConversationService } from 'src/modules/message/services';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { QueueEventService } from 'src/kernel';
import { STREAM_FEED_CHANNEL } from 'src/modules/feed/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import { StreamModel } from '../models';

@WebSocketGateway()
export class PublicStreamWsGateway {
  constructor(
    @Inject(forwardRef(() => UserService))
  private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(forwardRef(() => SocketUserService))
    private readonly socketService: SocketUserService,
    @Inject(STREAM_MODEL_PROVIDER)
    private readonly streamModel: Model<StreamModel>,
    private readonly streamService: StreamService,
    private readonly queueEventService: QueueEventService
  ) {}

  @SubscribeMessage('public-stream/live')
  async goLive(client: Socket, payload: { conversationId: string }) {
    const { conversationId } = payload;
    if (!conversationId) return;
    const conversation = await this.conversationService.findById(conversationId);
    if (!conversation) return;
    const { token } = client.handshake.query;
    if (!token) return;
    const user = await this.authService.getSourceFromJWT(token);
    if (!user) return;
    const stream = await this.streamService.findOne({ _id: conversation.streamId });
    if (!stream) return;
    const roomName = this.streamService.getRoomName(conversation._id, conversation.type);
    this.socketService.emitToRoom(roomName, 'join-broadcaster', {
      performerId: user._id,
      conversationId
    });
    await Promise.all([
      this.queueEventService.publish({ channel: STREAM_FEED_CHANNEL, eventName: EVENT.CREATED, data: { conversation, stream } }),
      this.performerService.goLive(user._id),
      this.streamModel.updateOne({ _id: conversation.streamId }, { $set: { isStreaming: 1 } })
    ]);
  }

  @SubscribeMessage('public-stream/join')
  async handleJoinPublicRoom(
    client: Socket,
    payload: { conversationId: string }
  ): Promise<void> {
    const { token } = client.handshake.query;
    const { conversationId } = payload;
    if (!conversationId) return;
    const conversation = conversationId && await this.conversationService.findById(conversationId);
    if (!conversation) return;
    const { performerId, type } = conversation;
    const authUser = token && await this.authService.verifyJWT(token);
    let user = await this.performerService.findById(authUser?.sourceId) as any;
    if (!user) {
      user = await this.userService.findById(authUser?.sourceId);
    }
    const roomName = this.streamService.getRoomName(conversationId, type);
    await client.join(roomName);
    let role = 'guest';
    if (user) {
      role = `${user._id}` === `${performerId}` ? 'model' : 'member';
      await this.socketService.emitToRoom(
        roomName,
        `user_joined_${conversationId}`,
        {
          user,
          role,
          conversationId
        }
      );
    }

    if (role === 'model') {
      await this.performerService.setStreamingStatus(user._id, PUBLIC_CHAT);
    }
    await this.socketService.addConnectionToRoom(
      roomName,
      user ? user._id : client.id,
      role
    );
    const connections = await this.socketService.getRoomUserConnections(
      roomName
    );
    const memberIds: string[] = [];
    Object.keys(connections).forEach((id) => {
      const value = connections[id].split(',');
      if (value[0] === 'member') {
        memberIds.push(id);
      }
    });

    if (memberIds.length && role === 'model') {
      await this.socketService.emitToUsers(memberIds, 'model-joined', { conversationId });
    }

    const members = (memberIds.length && await this.userService.findByIds(memberIds)) || [];
    const data = {
      conversationId,
      total: members.length,
      members: members.map((m) => new UserDto(m).toResponse())
    };
    this.socketService.emitToRoom(roomName, 'public-room-changed', data);

    const stream = await this.streamService.findByPerformerId(performerId, {
      type: PUBLIC_CHAT
    });
    if (!stream) return;
    if (role !== 'model') {
      this.streamModel.updateOne(
        { _id: stream._id },
        { $set: { $inc: { 'stats.members': 1 } } }
      );
    }
    if (stream.isStreaming) {
      this.socketService.emitToRoom(roomName, 'join-broadcaster', {
        performerId,
        conversationId
      });
    }
  }

  @SubscribeMessage('public-stream/leave')
  async handleLeavePublicRoom(
    client: Socket,
    payload: { conversationId: string }
  ): Promise<void> {
    const { token } = client.handshake.query;
    const { conversationId } = payload;
    if (!conversationId) {
      return;
    }
    const conversation = payload.conversationId && await this.conversationService.findById(conversationId);
    if (!conversation) {
      return;
    }

    const { performerId, type } = conversation;
    const authUser = token && await this.authService.verifyJWT(token);
    let user = await this.performerService.findById(authUser?.sourceId) as any;
    if (!user) {
      user = await this.userService.findById(authUser?.sourceId);
    }
    const roomName = this.streamService.getRoomName(conversationId, type);
    await client.leave(roomName);
    const stream = await this.streamService.findByPerformerId(performerId, {
      type: PUBLIC_CHAT
    });
    if (user) {
      const results = await this.socketService.getConnectionValue(
        roomName,
        user._id
      );
      if (results) {
        const values = results.split(',');
        const timeJoined = values[1] ? parseInt(values[1], 10) : null;
        const role = values[0];
        if (timeJoined) {
          const streamTime = moment()
            .toDate()
            .getTime() - timeJoined;

          if (role === 'model') {
            await Promise.all([
              this.performerService.updateLastStreamingTime(
                user._id,
                streamTime
              ),
              stream && stream.isStreaming && this.streamModel.updateOne(
                { _id: stream._id },
                { $set: { lastStreamingTime: new Date(), isStreaming: 0, streamingTime: streamTime / 1000 } }
              ),
              this.queueEventService.publish({ channel: STREAM_FEED_CHANNEL, eventName: EVENT.DELETED, data: { conversation } })
            ]);
          } else if (role === 'member') {
            this.streamModel.updateOne(
              { _id: stream._id },
              { $set: { $inc: { 'stats.members': -1 } } }
            );
          }
        }
      }
    }

    await this.socketService.removeConnectionFromRoom(
      roomName,
      user ? user._id : client.id
    );

    const connections = await this.socketService.getRoomUserConnections(
      roomName
    );
    const memberIds: string[] = [];
    Object.keys(connections).forEach((id) => {
      const value = connections[id].split(',');
      if (value[0] === 'member') {
        memberIds.push(id);
      }
    });
    const members = await this.userService.findByIds(memberIds);
    const data = {
      conversationId,
      total: members.length,
      members: members.map((m) => new UserDto(m).toResponse())
    };

    if (memberIds.length && user instanceof PerformerDto) {
      await this.socketService.emitToUsers(memberIds, 'model-left', { conversationId, performerId });
    }
    await this.socketService.emitToRoom(roomName, 'public-room-changed', data);
  }
}
