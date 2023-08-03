import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Query,
  Param,
  Delete,
  UseInterceptors,
  ForbiddenException
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import {
  MultiFileUploadInterceptor, FileUploadInterceptor, FileUploaded, FileDto
} from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { AuthService } from 'src/modules/auth/services';
import { FileService } from 'src/modules/file/services';
import { MessageService, NotificationMessageService } from '../services';
import {
  MessageListRequest, MessageCreatePayload, MassMessagesToSubscribersCreatePayload
} from '../payloads';
import { MessageDto } from '../dtos';

@Injectable()
@Controller('messages')
export class MessageController {
  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly notificationMessageService: NotificationMessageService,
    private readonly fileService: FileService
  ) { }

  @Post('/read-all/conversation/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async readAllMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<MessageDto>> {
    const message = await this.notificationMessageService.recipientReadAllMessageInConversation(user, conversationId);
    return DataResponse.ok(message);
  }

  @Post('/public/file/photo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileUploadInterceptor(
      'message-photo',
      'file',
      {
      destination: getConfig('file').messageDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      }
    )
  )
  async validatePublicPhoto(
    @FileUploaded() file: FileDto
  ) {
    await this.messageService.validatePhotoFile(
      file, true
    );
    return DataResponse.ok({
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/private/file/photo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UseInterceptors(
    FileUploadInterceptor(
      'message-photo',
      'file',
      {
      destination: getConfig('file').messageProtectedDir,
      acl: S3ObjectCannelACL.AuthenticatedRead,
      server: Storage.S3
      }
    )
  )
  async validatePrivatePhoto(
    @FileUploaded() file: FileDto
  ) {
    await this.messageService.validatePhotoFile(
      file
    );
    return DataResponse.ok({
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/private/file/video')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UseInterceptors(
    FileUploadInterceptor(
      'message-video',
      'file',
      {
      destination: getConfig('file').messageProtectedDir,
      acl: S3ObjectCannelACL.AuthenticatedRead,
      server: Storage.S3
      }
    )
  )
  async createVideoFileMessage(
    @FileUploaded() file: FileDto
  ) {
    await this.messageService.validateVideoFile(
      file
    );
    return DataResponse.ok({
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/public/file/video')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UseInterceptors(
    FileUploadInterceptor(
      'message-teaser',
      'file',
      {
      destination: getConfig('file').messageDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      }
    )
  )
  async createTeaserFileMessage(
    @FileUploaded() file: FileDto
  ) {
    await this.messageService.validateVideoFile(
      file
    );
    return DataResponse.ok({
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/public/file/thumbnail')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileUploadInterceptor(
      'message-thumbnail',
      'file',
      {
      destination: getConfig('file').messageDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3,
      uploadImmediately: true
      }
    )
  )
  async validateThumbPhoto(
    @FileUploaded() file: FileDto
  ) {
    // await this.messageService.validatePhotoFile(
    //   file, true
    // );
    return DataResponse.ok({
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/public/file/audio')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UseInterceptors(
    FileUploadInterceptor(
      'message-audio',
      'file',
      {
      destination: getConfig('file').messageDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3,
      uploadImmediately: true
      }
    )
  )
  async createAudioFileMessage(
    @FileUploaded() file: FileDto
  ) {
    return DataResponse.ok({
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Post('/:messageId/videos/:fileId/url')
  @UseGuards(AuthGuard)
  async getVideoLinkFeed(
    @Param('messageId') messageId: string,
    @Param('fileId') fileId: string,
    @Request() req: any
  ) {
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = req.authUser && this.authService.generateJWT(auth, { expiresIn: 1 * 60 * 60 });
    const data = await this.fileService.getFileStatus(fileId, messageId, jwToken);
    return DataResponse.ok(data);
  }

  @Post('/private/file')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor([
      {
      type: 'message-photo',
      fieldName: 'message-photo',
      options: {
      destination: getConfig('file').imageDir,
      uploadImmediately: true,
      generateThumbnail: true,
      thumbnailSize: {
      width: 250,
      height: 250
      },
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      }
      }
      ])
  )
  // async createPrivateFileMessage(
  //   @FilesUploaded() files: Record<string, any>,
  //   @Body() payload: PrivateMessageCreatePayload,
  //   @Request() req: any
  // ): Promise<DataResponse<MessageDto>> {
  //   if (req.authUser.sourceId.toString() === payload.recipientId.toString()) {
  //     throw new ForbiddenException();
  //   }

  //   const message = await this.messageService.createPrivateFileMessage(
  //     {
  //       source: req.authUser.source,
  //       sourceId: req.authUser.sourceId
  //     },
  //     {
  //       source: payload.recipientType,
  //       sourceId: payload.recipientId
  //     },
  //     files['message-photo'],
  //     payload
  //   );
  //   return DataResponse.ok(message);
  // }

  @Get('/auth/check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(
    @Request() req: any
  ) {
    if (!req.query.token) throw new ForbiddenException();
    const user = await this.authService.getSourceFromJWT(req.query.token);
    if (!user) {
      throw new ForbiddenException();
    }
    const valid = await this.messageService.checkAuth(req, user);
    return DataResponse.ok(valid);
  }

  @Post('/mass-messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async sendMassMessages(
    @CurrentUser() user: UserDto,
    @Body() payload: MassMessagesToSubscribersCreatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.sendMassMessagesToSubscribers(user, payload);
    return DataResponse.ok(data);
  }

  @Get('/counting-not-read-messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async countTotalNotReadMessage(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.notificationMessageService.countTotalNotReadMessage(user._id);
    return DataResponse.ok(data);
  }

  @Get('/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async loadMessages(
    @Query() query: MessageListRequest,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: UserDto,
    @Request() req: any
  ): Promise<DataResponse<any>> {
    // eslint-disable-next-line no-param-reassign
    query.conversationId = conversationId;
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = req.authUser && this.authService.generateJWT(auth, { expiresIn: 1 * 60 * 60 });
    const data = await this.messageService.loadPrivateMessages(query, user, jwToken);
    return DataResponse.ok(data);
  }

  @Post('/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createMessage(
    @Body() payload: MessageCreatePayload,
    @Param('conversationId') conversationId: string,
    @Request() req: any
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.createPrivateMessage(
      conversationId,
      payload,
      {
        source: req.authUser.source,
        sourceId: req.authUser.sourceId
      },
      req.jwToken
    );
    return DataResponse.ok(data);
  }

  @Post('/stream/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createStreamMessage(
    @Body() payload: MessageCreatePayload,
    @Param('conversationId') conversationId: string,
    @Request() req: any,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.createStreamMessageFromConversation(
      conversationId,
      payload,
      {
        source: req.authUser.source,
        sourceId: req.authUser.sourceId
      },
      user
    );
    return DataResponse.ok(data);
  }

  @Delete('/:messageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.deleteMessage(
      messageId,
      user
    );
    return DataResponse.ok(data);
  }

  @Delete('/:conversationId/remove-all-message')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'performer', 'sub-admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteAllPublicMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.deleteAllMessageInConversation(
      conversationId,
      user
    );
    return DataResponse.ok(data);
  }

  @Get('/conversations/public/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async loadPublicMessages(
    @Query() req: MessageListRequest,
    @Param('conversationId') conversationId: string
  ): Promise<DataResponse<any>> {
    // eslint-disable-next-line no-param-reassign
    req.conversationId = conversationId;
    const data = await this.messageService.loadPublicMessages(req);
    return DataResponse.ok(data);
  }
}
