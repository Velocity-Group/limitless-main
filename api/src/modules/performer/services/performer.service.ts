/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import {
  Injectable,
  Inject,
  forwardRef,
  HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EntityNotFoundException, AgendaService,
  ForbiddenException, QueueEventService, QueueEvent, StringHelper
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import { FileService } from 'src/modules/file/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { ReactionService } from 'src/modules/reaction/services/reaction.service';
import { FileDto } from 'src/modules/file';
import { AuthService } from 'src/modules/auth/services';
import { EVENT, STATUS } from 'src/kernel/constants';
import { REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { REF_TYPE } from 'src/modules/file/constants';
import {
  PERFORMER_UPDATE_STATUS_CHANNEL, PERFORMER_UPDATE_GENDER_CHANNEL, DELETE_PERFORMER_CHANNEL
} from 'src/modules/performer/constants';
import { difference } from 'lodash';
import { MailerService } from 'src/modules/mailer';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { ChangeTokenLogService } from 'src/modules/change-token-logs/services/change-token-log.service';
import { CHANGE_TOKEN_LOG_SOURCES } from 'src/modules/change-token-logs/constant';
import { PerformerBlockService } from 'src/modules/block/services';
import { StripeService } from 'src/modules/payment/services';
import { PerformerDto } from '../dtos';
import {
  UsernameExistedException,
  EmailExistedException
} from '../exceptions';
import {
  PerformerModel,
  PaymentGatewaySettingModel,
  CommissionSettingModel,
  BankingModel
} from '../models';
import {
  PerformerCreatePayload,
  PerformerUpdatePayload,
  PerformerRegisterPayload,
  SelfUpdatePayload,
  PaymentGatewaySettingPayload,
  CommissionSettingPayload,
  BankingSettingPayload
} from '../payloads';
import {
  PERFORMER_BANKING_SETTING_MODEL_PROVIDER,
  PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER,
  PERFORMER_MODEL_PROVIDER,
  PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER
} from '../providers';

const CHECK_REF_REMOVE_PERFORMER_FILE_AGENDA = 'CHECK_REF_REMOVE_PERFORMER_FILE_AGENDA';

@Injectable()
export class PerformerService {
  constructor(
    @Inject(forwardRef(() => PerformerBlockService))
    private readonly performerBlockService: PerformerBlockService,
    @Inject(forwardRef(() => ChangeTokenLogService))
    private readonly changeTokenLogService: ChangeTokenLogService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ReactionService))
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    private readonly agenda: AgendaService,
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    @Inject(PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER)
    private readonly paymentGatewaySettingModel: Model<PaymentGatewaySettingModel>,
    @Inject(PERFORMER_BANKING_SETTING_MODEL_PROVIDER)
    private readonly bankingSettingModel: Model<BankingModel>,
    @Inject(PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER)
    private readonly commissionSettingModel: Model<CommissionSettingModel>
  ) {
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agenda as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          CHECK_REF_REMOVE_PERFORMER_FILE_AGENDA
        ]
      }
    });
    this.agenda.define(CHECK_REF_REMOVE_PERFORMER_FILE_AGENDA, { }, this.checkRefAndRemoveFile.bind(this));
    this.agenda.every('24 hours', CHECK_REF_REMOVE_PERFORMER_FILE_AGENDA, {});
  }

  private async checkRefAndRemoveFile(job: any, done: any): Promise<void> {
    try {
      const total = await this.fileService.countByRefType(REF_TYPE.PERFORMER);
      for (let i = 0; i <= total / 99; i += 1) {
        const files = await this.fileService.findByRefType(REF_TYPE.PERFORMER, 99, i);
        const performerIds = files.map((f) => f.refItems[0].itemId.toString());
        const performers = await this.performerModel.find({ _id: { $in: performerIds } });
        const Ids = performers.map((v) => v._id.toString());
        const difIds = difference(performerIds, Ids);
        const difFileIds = files.filter((file) => difIds.includes(file.refItems[0].itemId.toString()));
        await Promise.all(difFileIds.map(async (fileId) => {
          await this.fileService.remove(fileId);
        }));
      }
    } catch (e) {
      console.log('Check ref & remove files error', e);
    } finally {
      done();
    }
  }

  public async checkExistedEmailorUsername(payload) {
    const data = payload.username ? await this.performerModel.countDocuments({ username: payload.username.trim().toLowerCase() })
      : await this.performerModel.countDocuments({ email: payload.email.toLowerCase() });
    return data;
  }

  public async findById(
    id: string | ObjectId
  ): Promise<PerformerDto> {
    const model = await this.performerModel.findById(id);
    if (!model) return null;
    return new PerformerDto(model);
  }

  public async findOne(query) {
    const data = await this.performerModel.findOne(query);
    return data;
  }

  public async find(query) {
    const data = await this.performerModel.find(query);
    return data;
  }

  public async findByUsername(
    username: string,
    countryCode?: string,
    currentUser?: UserDto
  ): Promise<PerformerDto> {
    const model = await this.performerModel.findOne({ username: username.trim().toLowerCase() }).lean();
    if (!model) throw new EntityNotFoundException();
    let isBlocked = false;
    if (countryCode && `${currentUser?._id}` !== `${model._id}`) {
      isBlocked = await this.performerBlockService.checkBlockedCountryByIp(model._id, countryCode);
      if (isBlocked) {
        throw new HttpException('You country has been blocked to access this model profile', 403);
      }
    }
    let isBlockedByPerformer = false;
    let isBookMarked = null;
    let isSubscribed = false;
    if (currentUser) {
      isBlockedByPerformer = `${currentUser?._id}` !== `${model._id}` && await this.performerBlockService.checkBlockedByPerformer(
        model._id,
        currentUser._id
      );
      if (isBlockedByPerformer) throw new HttpException('You has been blocked by this model', 403);
      const checkSubscribe = await this.subscriptionService.checkSubscribed(model._id, currentUser._id);
      isSubscribed = !!checkSubscribe;
      isBookMarked = await this.reactionService.findByQuery({
        objectType: REACTION_TYPE.PERFORMER, objectId: model._id, createdBy: currentUser._id, action: REACTION.BOOK_MARK
      });
    }
    const dto = new PerformerDto(model);
    dto.isSubscribed = isSubscribed;
    dto.isBookMarked = !!(isBookMarked && isBookMarked.length);
    if (model.avatarId) {
      const avatar = await this.fileService.findById(model.avatarId);
      dto.avatarPath = avatar ? avatar.path : null;
    }
    if (model.welcomeVideoId) {
      const welcomeVideo = await this.fileService.findById(
        model.welcomeVideoId
      );
      dto.welcomeVideoPath = welcomeVideo ? welcomeVideo.getUrl() : null;
    }
    return dto;
  }

  public async findByEmail(email: string): Promise<PerformerDto> {
    if (!email) {
      return null;
    }
    const model = await this.performerModel.findOne({
      email: email.toLowerCase()
    });
    if (!model) return null;
    return new PerformerDto(model);
  }

  public async findByIds(ids: any[]): Promise<PerformerDto[]> {
    const performers = await this.performerModel
      .find({
        _id: {
          $in: ids
        }
      })
      .lean()
      .exec();
    return performers.map((p) => new PerformerDto(p));
  }

  public async getDetails(id: string | ObjectId, jwtToken: string): Promise<PerformerDto> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const [
      avatar,
      documentVerification,
      idVerification,
      cover,
      welcomeVideo
    ] = await Promise.all([
      performer.avatarId ? this.fileService.findById(performer.avatarId) : null,
      performer.documentVerificationId
        ? this.fileService.findById(performer.documentVerificationId)
        : null,
      performer.idVerificationId
        ? this.fileService.findById(performer.idVerificationId)
        : null,
      performer.coverId ? this.fileService.findById(performer.coverId) : null,
      performer.welcomeVideoId
        ? this.fileService.findById(performer.welcomeVideoId)
        : null
    ]);

    // TODO - update kernel for file dto
    const dto = new PerformerDto(performer);
    dto.avatar = avatar ? FileDto.getPublicUrl(avatar.path) : null; // TODO - get default avatar
    dto.cover = cover ? FileDto.getPublicUrl(cover.path) : null;
    dto.welcomeVideoPath = welcomeVideo
      ? FileDto.getPublicUrl(welcomeVideo.path)
      : null;
    dto.idVerification = idVerification
      ? {
        _id: idVerification._id,
        url: jwtToken ? `${FileDto.getPublicUrl(idVerification.path)}?documentId=${idVerification._id}&token=${jwtToken}` : FileDto.getPublicUrl(idVerification.path),
        mimeType: idVerification.mimeType
      }
      : null;
    dto.documentVerification = documentVerification
      ? {
        _id: documentVerification._id,
        url: jwtToken ? `${FileDto.getPublicUrl(documentVerification.path)}?documentId=${documentVerification._id}&token=${jwtToken}` : FileDto.getPublicUrl(documentVerification.path),
        mimeType: documentVerification.mimeType
      }
      : null;

    // dto.ccbillSetting = await this.paymentGatewaySettingModel.findOne({
    //   performerId: id
    // });

    dto.commissionSetting = await this.commissionSettingModel.findOne({
      performerId: id
    });

    dto.stripeAccount = await this.stripeService.retrieveConnectAccount(id);

    // dto.bankingInformation = await this.bankingSettingModel.findOne({
    //   performerId: id
    // });
    dto.blockCountries = await this.performerBlockService.findByQuery({
      sourceId: id
    });
    return dto;
  }

  public async delete(id: string) {
    if (!StringHelper.isObjectId(id)) throw new ForbiddenException();
    const performer = await this.performerModel.findById(id);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.deleteOne({ _id: id });
    await this.queueEventService.publish(new QueueEvent({
      channel: DELETE_PERFORMER_CHANNEL,
      eventName: EVENT.DELETED,
      data: new PerformerDto(performer).toResponse()
    }));
    return { deleted: true };
  }

  public async create(
    payload: PerformerCreatePayload,
    user?: UserDto
  ): Promise<PerformerDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const countPerformerUsername = await this.performerModel.countDocuments({
      username: payload.username.trim().toLowerCase()
    });
    const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: payload.username });
    if (countPerformerUsername || countUserUsername) {
      throw new UsernameExistedException();
    }

    const countPerformerEmail = await this.performerModel.countDocuments({
      email: payload.email.toLowerCase()
    });
    const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: payload.email });
    if (countPerformerEmail || countUserEmail) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    if (payload.coverId) {
      const cover = await this.fileService.findById(payload.coverId);
      if (!cover) {
        throw new EntityNotFoundException('Cover not found!');
      }
      // TODO - check for other storaged
      data.coverPath = cover.path;
    }

    // TODO - check for category Id, agent
    if (user) {
      data.createdBy = user._id;
    }
    data.username = data.username.trim().toLowerCase();
    data.email = data.email.toLowerCase();
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (!data.name) {
      data.name = data.firstName && data.lastName ? [data.firstName, data.lastName].join(' ') : 'No_display_name';
    }
    const performer = await this.performerModel.create(data);

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.avatarId
        && this.fileService.addRef(payload.avatarId, {
          itemId: performer._id as any,
          itemType: REF_TYPE.PERFORMER
        })
    ]);

    // TODO - fire event?
    return new PerformerDto(performer);
  }

  public async register(
    payload: PerformerRegisterPayload
  ): Promise<PerformerDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const countPerformerUsername = await this.performerModel.countDocuments({
      username: payload.username.trim().toLowerCase()
    });
    const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: payload.username });
    if (countPerformerUsername || countUserUsername) {
      throw new UsernameExistedException();
    }

    const countPerformerEmail = await this.performerModel.countDocuments({
      email: payload.email.toLowerCase()
    });
    const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: payload.email });
    if (countPerformerEmail || countUserEmail) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }
    data.username = data.username.trim().toLowerCase();
    data.email = data.email.toLowerCase();
    if (!data.name) {
      data.name = data.firstName && data.lastName ? [data.firstName, data.lastName].join(' ') : 'No_display_name';
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    const performer = await this.performerModel.create(data);

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.avatarId && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      })
    ]);
    const adminEmail = await SettingService.getValueByKey(SETTING_KEYS.ADMIN_EMAIL);
    adminEmail && await this.mailService.send({
      subject: 'New performer sign up',
      to: adminEmail,
      data: { performer },
      template: 'new-performer-notify-admin'
    });

    // TODO - fire event?
    return new PerformerDto(performer);
  }

  public async adminUpdate(
    id: string | ObjectId,
    payload: PerformerUpdatePayload
  ): Promise<any> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const data = { ...payload } as any;
    if (!data.name) {
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }

    if (data.email && data.email.toLowerCase() !== performer.email) {
      const emailCheck = await this.performerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: data.email });
      if (emailCheck || countUserEmail) {
        throw new EmailExistedException();
      }
      data.email = data.email.toLowerCase();
    }

    if (data.username && data.username.trim().toLowerCase() !== performer.username) {
      const usernameCheck = await this.performerModel.countDocuments({
        username: data.username.trim().toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: data.username });
      if (usernameCheck || countUserUsername) {
        throw new UsernameExistedException();
      }
      data.username = data.username.trim().toLowerCase();
    }

    if (
      (payload.avatarId && !performer.avatarId)
      || (performer.avatarId
        && payload.avatarId
        && payload.avatarId !== performer.avatarId.toString())
    ) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    if (
      (payload.coverId && !performer.coverId)
      || (performer.coverId
        && payload.coverId
        && payload.coverId !== performer.coverId.toString())
    ) {
      const cover = await this.fileService.findById(payload.coverId);
      if (!cover) {
        throw new EntityNotFoundException('Cover not found!');
      }
      // TODO - check for other storaged
      data.coverPath = cover.path;
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    await this.performerModel.updateOne({ _id: id }, data, { new: true });
    const newPerformer = await this.performerModel.findById(performer._id);
    const oldStatus = performer.status;
    const oldGender = performer.gender;
    const oldBalance = performer.balance;
    // logs change token
    if (oldBalance !== newPerformer.balance) {
      await this.changeTokenLogService.changeTokenLog({
        source: CHANGE_TOKEN_LOG_SOURCES.PERFORMER,
        sourceId: newPerformer._id,
        token: newPerformer.balance - oldBalance
      });
    }
    // fire event that updated performer status
    if (data.status !== performer.status) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_STATUS_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldStatus
          }
        })
      );
    }
    // fire event that updated performer gender
    if (data.gender !== performer.gender) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_GENDER_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldGender
          }
        })
      );
    }
    if (performer.email && performer.email !== newPerformer.email) {
      await this.authService.sendVerificationEmail(newPerformer);
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'email'
      });
    }
    // update auth key if username or email has changed
    if (performer.username && performer.username.trim() !== newPerformer.username) {
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'username'
      });
    }
    return true;
  }

  public async selfUpdate(
    id: string | ObjectId,
    payload: SelfUpdatePayload,
    welcomeVideo?: FileDto
  ): Promise<boolean> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    if (welcomeVideo && !welcomeVideo.mimeType.toLowerCase().includes('video')) {
      await this.fileService.remove(welcomeVideo._id);
    }
    const data = { ...payload } as any;
    if (!data.name) {
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }
    if (data.username && data.username !== performer.username) {
      const usernameCheck = await this.performerModel.countDocuments({
        username: data.username.trim().toLowerCase(),
        _id: { $ne: performer._id }
      });
      if (usernameCheck) {
        throw new UsernameExistedException();
      }
      data.username = data.username.trim().toLowerCase();
    }
    if (data.email && data.email !== performer.email) {
      const count = await this.performerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: { $ne: performer._id }
      });
      if (count) {
        throw new EmailExistedException();
      }
      data.email = data.email.toLowerCase();
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    await this.performerModel.updateOne({ _id: id }, data, { new: true });
    const newPerformer = await this.performerModel.findById(id);
    const oldGender = performer.gender;
    // fire event that updated performer gender
    if (data.gender !== performer.gender) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_GENDER_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldGender
          }
        })
      );
    }
    if (performer.email && performer.email !== newPerformer.email) {
      await this.authService.sendVerificationEmail(newPerformer);
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'email'
      });
    }
    // update auth key if username or email has changed
    if (performer.username && performer.username.trim() !== newPerformer.username) {
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'username'
      });
    }
    return true;
  }

  public async modelCreate(data): Promise<PerformerModel> {
    return this.performerModel.create(data);
  }

  public async updateAvatar(user: UserDto, file: FileDto) {
    await this.performerModel.updateOne(
      { _id: user._id },
      {
        avatarId: file._id,
        avatarPath: file.path
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: REF_TYPE.PERFORMER
    });

    // resend user info?
    // TODO - check others config for other storage
    return file;
  }

  public async updateCover(user: UserDto, file: FileDto) {
    await this.performerModel.updateOne(
      { _id: user._id },
      {
        coverId: file._id,
        coverPath: file.path
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: REF_TYPE.PERFORMER
    });

    return file;
  }

  public async updateWelcomeVideo(user: UserDto, file: FileDto) {
    await this.performerModel.updateOne(
      { _id: user._id },
      {
        welcomeVideoId: file._id,
        welcomeVideoPath: file.path
      }
    );

    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: REF_TYPE.PERFORMER
    });

    return file;
  }

  public async getBankInfo(performerId) {
    const data = await this.bankingSettingModel.findOne({
      performerId
    });
    return data;
  }

  public async checkSubscribed(performerId: string | ObjectId, user: UserDto) {
    const count = performerId && user ? await this.subscriptionService.checkSubscribed(
      performerId,
      user._id
    ) : 0;
    return { subscribed: count > 0 };
  }

  public async viewProfile(username: string) {
    return this.performerModel.updateOne(
      { username },
      {
        $inc: { 'stats.views': 1 }
      },
      { new: true }
    );
  }

  public async updateLastStreamingTime(
    id: string | ObjectId,
    streamTime: number
  ) {
    return this.performerModel.updateOne(
      { _id: id },
      {
        $set: { lastStreamingTime: new Date(), live: 0, streamingStatus: 'offline' },
        $inc: { 'stats.totalStreamTime': streamTime }
      }
    );
  }

  public async updateStats(
    id: string | ObjectId,
    payload: Record<string, number>
  ) {
    return this.performerModel.updateOne({ _id: id }, { $inc: payload }, { upsert: true });
  }

  public async goLive(id: string | ObjectId) {
    return this.performerModel.updateOne({ _id: id }, { $set: { live: 1 } }, { upsert: true });
  }

  public async setStreamingStatus(id: string | ObjectId, streamingStatus: string) {
    return this.performerModel.updateOne({ _id: id }, { $set: { streamingStatus } }, { upsert: true });
  }

  public async updatePaymentGateway(payload: PaymentGatewaySettingPayload) {
    let item = await this.paymentGatewaySettingModel.findOne({
      key: payload.key,
      performerId: payload.performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.paymentGatewaySettingModel();
    }
    item.key = payload.key;
    item.performerId = payload.performerId as any;
    item.status = 'active';
    item.value = payload.value;
    return item.save();
  }

  public async getPaymentSetting(
    performerId: string | ObjectId,
    service = 'ccbill'
  ) {
    return this.paymentGatewaySettingModel.findOne({
      key: service,
      performerId
    });
  }

  public async updateSubscriptionStat(performerId: string | ObjectId, num = 1) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) return false;
    const minimumVerificationNumber = await this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_VERIFY_NUMBER) || 5;
    return this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.subscribers': num },
        verifiedAccount: !!(performer.stats.subscribers === (minimumVerificationNumber - 1) && num === 1)
      },
      { upsert: true }
    );
  }

  public async updateLikeStat(performerId: string | ObjectId, num = 1) {
    return this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.likes': num }
      },
      { upsert: true }
    );
  }

  public async updateCommissionSetting(
    performerId: string,
    payload: CommissionSettingPayload
  ) {
    let item = await this.commissionSettingModel.findOne({
      performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.commissionSettingModel();
    }
    item.performerId = performerId as any;
    item.monthlySubscriptionCommission = payload.monthlySubscriptionCommission;
    item.yearlySubscriptionCommission = payload.yearlySubscriptionCommission;
    item.videoSaleCommission = payload.videoSaleCommission;
    item.gallerySaleCommission = payload.gallerySaleCommission;
    item.productSaleCommission = payload.productSaleCommission;
    item.tipCommission = payload.tipCommission;
    item.feedSaleCommission = payload.feedSaleCommission;
    item.streamCommission = payload.streamCommission;
    return item.save();
  }

  public async updateBankingSetting(
    performerId: string,
    payload: BankingSettingPayload,
    currentUser: UserDto
  ) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    if (!currentUser?.roles.includes('admin') && `${currentUser._id}` !== `${performerId}`) {
      throw new HttpException('Permission denied', 403);
    }
    let item = await this.bankingSettingModel.findOne({
      performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.bankingSettingModel(payload);
    }
    item.performerId = performerId as any;
    item.firstName = payload.firstName;
    item.lastName = payload.lastName;
    item.SSN = payload.SSN;
    item.bankName = payload.bankName;
    item.bankAccount = payload.bankAccount;
    item.bankRouting = payload.bankRouting;
    item.bankSwiftCode = payload.bankSwiftCode;
    item.address = payload.address;
    item.city = payload.city;
    item.state = payload.state;
    item.country = payload.country;
    return item.save();
  }

  public async updateVerificationStatus(
    userId: string | ObjectId
  ): Promise<any> {
    return this.performerModel.updateOne(
      {
        _id: userId
      },
      { status: STATUS.INACTIVE, verifiedEmail: true },
      { new: true }
    );
  }

  public async getCommissions(performerId: string | ObjectId) {
    return this.commissionSettingModel.findOne({ performerId });
  }

  public async updatePerformerBalance(performerId: string | ObjectId, tokens: number) {
    await this.performerModel.updateOne({ _id: performerId }, { $inc: { balance: tokens } }, { upsert: true });
  }

  public async checkAuthDocument(req: any, user: UserDto) {
    const { query } = req;
    if (!query.documentId) {
      throw new ForbiddenException();
    }
    if (user.roles && user.roles.indexOf('admin') > -1) {
      return true;
    }
    // check type video
    const file = await this.fileService.findById(query.documentId);
    if (!file || !file.refItems || (file.refItems[0] && file.refItems[0].itemType !== REF_TYPE.PERFORMER)) return false;
    if (file.refItems && file.refItems[0].itemId && user._id.toString() === file.refItems[0].itemId.toString()) {
      return true;
    }
    throw new ForbiddenException();
  }
}
