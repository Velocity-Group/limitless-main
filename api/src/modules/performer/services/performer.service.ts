import {
  Injectable,
  Inject,
  forwardRef,
  HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EntityNotFoundException, ForbiddenException, QueueEventService, QueueEvent, StringHelper
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
import { MailerService } from 'src/modules/mailer';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { ChangeTokenLogService } from 'src/modules/change-token-logs/services/change-token-log.service';
import { CHANGE_TOKEN_LOG_SOURCES } from 'src/modules/change-token-logs/constant';
import { PerformerBlockService } from 'src/modules/block/services';
import { isObjectId, toObjectId } from 'src/kernel/helpers/string.helper';
import { Storage } from 'src/modules/storage/contants';
import { StripeService } from 'src/modules/payment/services';
import { PerformerDto } from '../dtos';
import {
  UsernameExistedException, EmailExistedException
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
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    @Inject(PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER)
    private readonly paymentGatewaySettingModel: Model<PaymentGatewaySettingModel>,
    @Inject(PERFORMER_BANKING_SETTING_MODEL_PROVIDER)
    private readonly bankingSettingModel: Model<BankingModel>,
    @Inject(PERFORMER_COMMISSION_SETTING_MODEL_PROVIDER)
    private readonly commissionSettingModel: Model<CommissionSettingModel>
  ) {
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

  public async updateOne(query: any, params: any, options: any): Promise<any> {
    return this.performerModel.updateOne(query, params, options);
  }

  public async findByUsername(
    username: string,
    countryCode?: string,
    currentUser?: UserDto
  ): Promise<PerformerDto> {
    const query = !isObjectId(username) ? {
      username: username.trim()
    } : { _id: username };
    const model = await this.performerModel.findOne(query).lean();
    if (!model) throw new EntityNotFoundException();
    let isBlocked = false;
    if (countryCode && `${currentUser?._id}` !== `${model._id}`) {
      isBlocked = await this.performerBlockService.checkBlockedCountryByIp(model._id, countryCode);
      if (isBlocked) {
        throw new HttpException('Your country has been blocked by this model', 403);
      }
    }
    let isBlockedByPerformer = false;
    let isBookMarked = null;
    let isSubscribed = null;
    if (currentUser) {
      isBlockedByPerformer = `${currentUser?._id}` !== `${model._id}` && await this.performerBlockService.checkBlockedByPerformer(
        model._id,
        currentUser._id
      );
      if (isBlockedByPerformer) throw new HttpException('You has been blocked by this model', 403);
      isSubscribed = await this.subscriptionService.checkSubscribed(model._id, currentUser._id);
      isBookMarked = await this.reactionService.findOneQuery({
        objectType: REACTION_TYPE.PERFORMER, objectId: model._id, createdBy: currentUser._id, action: REACTION.BOOK_MARK
      });
    }
    const dto = new PerformerDto(model);
    dto.isSubscribed = !!isSubscribed;
    dto.isBookMarked = !!isBookMarked;
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
    await this.increaseViewStats(dto._id);
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

  public async getDetails(id: string, jwToken: string): Promise<PerformerDto> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const [
      avatar, documentVerification, idVerification, cover, welcomeVideo,
      paypalSetting, commissionSetting, stripeAccount, blockCountries
    ] = await Promise.all([
      performer.avatarId && this.fileService.findById(performer.avatarId),
      performer.documentVerificationId && this.fileService.findById(performer.documentVerificationId),
      performer.idVerificationId && this.fileService.findById(performer.idVerificationId),
      performer.coverId && this.fileService.findById(performer.coverId),
      performer.welcomeVideoId && this.fileService.findById(performer.welcomeVideoId),
      this.paymentGatewaySettingModel.findOne({ performerId: id, key: 'paypal' }),
      this.commissionSettingModel.findOne({ performerId: id }),
      this.stripeService.getConnectAccount(performer._id),
      this.performerBlockService.findOneBlockCountriesByQuery({ sourceId: id })
    ]);

    // TODO - update kernel for file dto
    const dto = new PerformerDto(performer);
    dto.avatar = avatar ? FileDto.getPublicUrl(avatar.path) : null; // TODO - get default avatar
    dto.cover = cover ? FileDto.getPublicUrl(cover.path) : null;
    dto.welcomeVideoName = welcomeVideo ? welcomeVideo.name : null;
    dto.welcomeVideoPath = welcomeVideo ? welcomeVideo.getUrl() : null;
    if (idVerification) {
      let fileUrl = idVerification.getUrl(true);
      if (idVerification.server !== Storage.S3) {
        fileUrl = `${fileUrl}?documentId=${idVerification._id}&token=${jwToken}`;
      }
      dto.idVerification = {
        _id: idVerification._id,
        url: fileUrl,
        mimeType: idVerification.mimeType
      };
    }
    if (documentVerification) {
      let fileUrl = documentVerification.getUrl(true);
      if (documentVerification.server !== Storage.S3) {
        fileUrl = `${fileUrl}?documentId=${documentVerification._id}&token=${jwToken}`;
      }
      dto.documentVerification = {
        _id: documentVerification._id,
        url: fileUrl,
        mimeType: documentVerification.mimeType
      };
    }
    dto.paypalSetting = paypalSetting;
    dto.commissionSetting = commissionSetting;
    dto.stripeAccount = stripeAccount;
    dto.blockCountries = blockCountries;
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
    await this.performerModel.updateOne({ _id: id }, data);
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
    payload: SelfUpdatePayload
  ): Promise<boolean> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const data = { ...payload } as any;
    delete data.balance;
    delete data.welcomeVideoId;
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
    await this.performerModel.updateOne({ _id: id }, data);
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
    if (performer.username && performer.username !== newPerformer.username) {
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

  public async updateWelcomeVideo(user: PerformerDto, file: FileDto) {
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
    if (user.welcomeVideoId && `${user.welcomeVideoId}` !== `${file._id}`) {
      await this.fileService.remove(user.welcomeVideoId);
    }
    await this.fileService.queueProcessVideo(file._id);
    return file;
  }

  public async adminUpdateWelcomeVideo(performerId: string, file: FileDto) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        welcomeVideoId: file._id,
        welcomeVideoPath: file.path
      }
    );

    await this.fileService.addRef(file._id, {
      itemId: toObjectId(performerId),
      itemType: REF_TYPE.PERFORMER
    });

    if (performer.welcomeVideoId && `${performer.welcomeVideoId}` !== `${file._id}`) {
      await this.fileService.remove(performer.welcomeVideoId);
    }
    await this.fileService.queueProcessVideo(file._id);
    return file;
  }

  public async getBankInfo(performerId) {
    const data = await this.bankingSettingModel.findOne({
      performerId
    });
    return data;
  }

  public async increaseViewStats(id: string | ObjectId) {
    return this.performerModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.views': 1 }
      }
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
    return this.performerModel.updateOne({ _id: id }, { $inc: payload });
  }

  public async goLive(id: string | ObjectId) {
    return this.performerModel.updateOne({ _id: id }, { $set: { live: 1 } });
  }

  public async setStreamingStatus(id: string | ObjectId, streamingStatus: string) {
    return this.performerModel.updateOne({ _id: id }, { $set: { streamingStatus } });
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
    if (!performer) return;
    const minimumVerificationNumber = await this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_VERIFY_NUMBER) || 5;
    const verifiedAccount = num === 1 ? performer.stats.subscribers >= (minimumVerificationNumber - 1) : (performer.stats.subscribers - 1) < minimumVerificationNumber;
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.subscribers': num },
        verifiedAccount
      }
    );
  }

  public async updateLikeStat(performerId: string | ObjectId, num = 1) {
    return this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.likes': num }
      }
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
      { status: STATUS.ACTIVE, verifiedEmail: true }
    );
  }

  public async getCommissions(performerId: string | ObjectId) {
    return this.commissionSettingModel.findOne({ performerId });
  }

  public async updatePerformerBalance(performerId: string | ObjectId, tokens: number) {
    await this.performerModel.updateOne({ _id: performerId }, { $inc: { balance: tokens } });
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
