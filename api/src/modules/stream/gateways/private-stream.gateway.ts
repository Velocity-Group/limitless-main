/* eslint-disable no-console */
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Inject, forwardRef } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from 'src/modules/auth/services';
import { StreamService } from 'src/modules/stream/services';
import { PRIVATE_CHAT } from 'src/modules/stream/constant';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { PerformerService } from 'src/modules/performer/services';
import { ConversationService } from 'src/modules/message/services';
import { UserService } from 'src/modules/user/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import { StreamModel } from '../models';

@WebSocketGateway()
export class PrivateStreamWsGateway {
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
    private readonly streamService: StreamService
  ) {}

  @SubscribeMessage('private-stream/live')
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
    this.socketService.emitToRoom(stream.sessionId, 'join-broadcaster', {
      performerId: user._id,
      conversationId
    });
    await Promise.all([
      this.performerService.goLive(user._id),
      this.streamModel.updateOne({ _id: conversation.streamId }, { $set: { isStreaming: 1 } })
    ]);
  }

  @SubscribeMessage('private-stream/join')
  async handleJoinPrivateRoom(
    client: Socket,
    payload: { conversationId: string }
  ): Promise<void> {
    const { token } = client.handshake.query;
    const { conversationId } = payload;
    if (!conversationId) return;
    const conversation = conversationId && await this.conversationService.findById(conversationId);
    if (!conversation) return;
    const stream = await this.streamService.findOne({ _id: conversation.streamId });
    if (!stream) return;
    const { performerId } = conversation;
    const authUser = token && await this.authService.verifyJWT(token);
    let user = await this.performerService.findById(authUser?.sourceId) as any;
    if (!user) {
      user = await this.userService.findById(authUser?.sourceId);
    }
    if (!user) return;

    await client.join(stream.sessionId);
    const role = `${user._id}` === `${performerId}` ? 'model' : 'member';

    if (role === 'model') {
      await this.performerService.setStreamingStatus(user._id, PRIVATE_CHAT);
    }
    await this.socketService.addConnectionToRoom(
      stream.sessionId,
      user ? user._id : client.id,
      role
    );
    const connections = await this.socketService.getRoomUserConnections(
      stream.sessionId
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
    if (role === 'member') {
      await this.socketService.emitToUsers(memberIds, 'member-joined', { conversationId, user });
    }

    if (stream.isStreaming) {
      this.socketService.emitToUsers(memberIds, 'join-broadcaster', {
        performerId,
        conversationId
      });
    }
  }

  @SubscribeMessage('private-stream/leave')
  async handleLeavePrivateRoom(
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

    const { performerId } = conversation;
    const authUser = token && await this.authService.verifyJWT(token);
    const stream = await this.streamService.findOne({ _id: conversation.streamId });
    if (!stream) return;
    let user = await this.performerService.findById(authUser?.sourceId) as any;
    if (!user) {
      user = await this.userService.findById(authUser?.sourceId);
    }
    if (!user) return;

    await client.leave(stream.sessionId);

    if (user) {
      const results = await this.socketService.getConnectionValue(
        stream.sessionId,
        user._id
      );
      if (results) {
        const values = results.split(',');
        const role = values[0];
        if (role === 'model') {
          await Promise.all([
            this.performerService.updateLastStreamingTime(
              user._id,
              0
            ),
            stream && stream.isStreaming && this.streamModel.updateOne(
              { _id: stream._id },
              { $set: { lastStreamingTime: new Date(), isStreaming: 0 } }
            )
          ]);
        }
      }
    }

    await this.socketService.removeConnectionFromRoom(
      stream.sessionId,
      user ? user._id : client.id
    );

    const connections = await this.socketService.getRoomUserConnections(
      stream.sessionId
    );
    const memberIds: string[] = [];
    Object.keys(connections).forEach((id) => {
      const value = connections[id].split(',');
      if (value[0] === 'member') {
        memberIds.push(id);
      }
    });

    if (memberIds.length && user instanceof PerformerDto) {
      await this.socketService.emitToUsers(memberIds, 'model-left', { conversationId, performerId });
    }
  }
}
