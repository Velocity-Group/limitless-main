/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import {
  Injectable, Inject, forwardRef, HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  QueueEventService,
  QueueEvent,
  AgendaService,
  EntityNotFoundException,
  ForbiddenException,
  StringHelper
} from 'src/kernel';
import { FileDto } from 'src/modules/file';
import { FileService, FILE_EVENT } from 'src/modules/file/services';
import { ReactionService } from 'src/modules/reaction/services/reaction.service';
import { REACTION, REACTION_TYPE } from 'src/modules/reaction/constants';
import { PerformerService } from 'src/modules/performer/services';
import { merge, difference } from 'lodash';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { PaymentTokenService } from 'src/modules/purchased-item/services';
import { EVENT } from 'src/kernel/constants';
import { REF_TYPE } from 'src/modules/file/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { PurchaseItemType } from 'src/modules/purchased-item/constants';
import { VideoUpdatePayload } from '../payloads';
import { VideoDto, IVideoResponse } from '../dtos';
import { VIDEO_STATUS, VIDEO_TEASER_STATUS } from '../constants';
import { VideoCreatePayload } from '../payloads/video-create.payload';
import { VideoModel } from '../models';
import { PERFORMER_VIDEO_MODEL_PROVIDER } from '../providers';

export const PERFORMER_VIDEO_CHANNEL = 'PERFORMER_VIDEO_CHANNEL';
export const PERFORMER_VIDEO_TEASER_CHANNEL = 'PERFORMER_VIDEO_TEASER_CHANNEL';
export const PERFORMER_COUNT_VIDEO_CHANNEL = 'PERFORMER_COUNT_VIDEO_CHANNEL';
const FILE_PROCESSED_TOPIC = 'FILE_PROCESSED';
const SCHEDULE_VIDEO_AGENDA = 'SCHEDULE_VIDEO_AGENDA';
const CHECK_REF_REMOVE_VIDEO_AGENDA = 'CHECK_REF_REMOVE_VIDEO_AGENDA';

@Injectable()
export class VideoService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => ReactionService))
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => PaymentTokenService))
    private readonly checkPaymentService: PaymentTokenService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly PerformerVideoModel: Model<VideoModel>,
    private readonly queueEventService: QueueEventService,
    private readonly fileService: FileService,
    private readonly agenda: AgendaService
  ) {
    this.queueEventService.subscribe(
      PERFORMER_VIDEO_TEASER_CHANNEL,
      FILE_PROCESSED_TOPIC,
      this.handleTeaserProcessed.bind(this)
    );
    this.queueEventService.subscribe(
      PERFORMER_VIDEO_CHANNEL,
      FILE_PROCESSED_TOPIC,
      this.handleFileProcessed.bind(this)
    );
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agenda as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          SCHEDULE_VIDEO_AGENDA,
          CHECK_REF_REMOVE_VIDEO_AGENDA
        ]
      }
    });

    this.agenda.define(SCHEDULE_VIDEO_AGENDA, {}, this.scheduleVideo.bind(this));
    this.agenda.every('3600 seconds', SCHEDULE_VIDEO_AGENDA, {});

    this.agenda.define(CHECK_REF_REMOVE_VIDEO_AGENDA, {}, this.checkRefAndRemoveFile.bind(this));
    this.agenda.every('24 hours', CHECK_REF_REMOVE_VIDEO_AGENDA, {});
  }

  private async checkRefAndRemoveFile(job: any, done: any): Promise<void> {
    try {
      const total = await this.fileService.countByRefType(REF_TYPE.VIDEO);
      for (let i = 0; i <= total / 99; i += 1) {
        const files = await this.fileService.findByRefType(REF_TYPE.VIDEO, 99, i);
        const videoIds = files.map((f) => f.refItems[0].itemId.toString());
        const videos = await this.PerformerVideoModel.find({ _id: { $in: videoIds } });
        const Ids = videos.map((v) => v._id.toString());
        const difIds = difference(videoIds, Ids);
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

  private async scheduleVideo(job: any, done: any): Promise<void> {
    try {
      const videos = await this.PerformerVideoModel.find({
        isSchedule: true,
        scheduledAt: { $lte: new Date() },
        status: { $ne: VIDEO_STATUS.ACTIVE }
      }).lean();
      await Promise.all([
        videos.forEach(async (video) => {
          const v = new VideoDto(video);
          await this.PerformerVideoModel.updateOne(
            {
              _id: v._id
            },
            {
              isSchedule: false,
              status: VIDEO_STATUS.ACTIVE,
              updatedAt: new Date()
            }
          );
          const oldStatus = video.status;
          await this.queueEventService.publish(
            new QueueEvent({
              channel: PERFORMER_COUNT_VIDEO_CHANNEL,
              eventName: EVENT.UPDATED,
              data: {
                ...v,
                oldStatus
              }
            })
          );
        })
      ]);
    } catch (e) {
      console.log('Schedule video error', e);
    } finally {
      done();
    }
  }

  public async findById(id: string | ObjectId) {
    const video = await this.PerformerVideoModel.findById(id);
    return new VideoDto(video);
  }

  public async findByIds(ids: string[] | ObjectId[]) {
    const videos = await this.PerformerVideoModel.find({ _id: { $in: ids } });
    return videos;
  }

  public getVideoForView(fileDto: FileDto, video: VideoDto, jwToken: string) {
    // get thumb, video link, thumbnails, etc...
    let file = fileDto.getUrl();
    if (video && jwToken) {
      file = `${file}?videoId=${video._id}&token=${jwToken}`;
    }
    return {
      url: file,
      duration: fileDto.duration,
      thumbnails: (fileDto.thumbnails || []).map((thumb) => FileDto.getPublicUrl(thumb.path))
    };
  }

  public async handleTeaserProcessed(event: QueueEvent) {
    try {
      const { eventName } = event;
      if (eventName !== FILE_EVENT.VIDEO_PROCESSED) {
        return;
      }
      const { videoId } = event.data.meta;
      const [video, file] = await Promise.all([
        this.PerformerVideoModel.findById(videoId),
        this.fileService.findById(event.data.fileId)
      ]);
      if (!video) {
        await this.fileService.remove(event.data.fileId);
        // TODO - delete file?
        return;
      }

      if (file.status === 'error') {
        // todo update teaser status
        video.teaserStatus = VIDEO_TEASER_STATUS.FILE_ERROR;
      }
      await video.save();
    } catch (e) {
      // TODO - log me
      // console.log(e);
    }
  }

  public async handleFileProcessed(event: QueueEvent) {
    try {
      const { eventName } = event;
      if (eventName !== FILE_EVENT.VIDEO_PROCESSED) {
        return;
      }
      const { videoId } = event.data.meta;
      const [video, file] = await Promise.all([
        this.PerformerVideoModel.findById(videoId),
        this.fileService.findById(event.data.fileId)
      ]);
      if (!video) {
        // TODO - delete file?
        await this.fileService.remove(event.data.fileId);
        return;
      }

      const oldStatus = video.status;
      video.processing = false;
      if (file.status === 'error') {
        video.status = VIDEO_STATUS.FILE_ERROR;
      }
      await video.save();

      // update new status?
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_COUNT_VIDEO_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new VideoDto(video),
            oldStatus
          }
        })
      );
    } catch (e) {
      // TODO - log me
      // console.log(e);
    }
  }

  private async checkReaction(video: VideoDto, user: UserDto) {
    const [liked, bookmarked] = await Promise.all([
      user ? this.reactionService.checkExisting(video._id, user._id, REACTION.LIKE, REACTION_TYPE.VIDEO) : null,
      user ? this.reactionService.checkExisting(video._id, user._id, REACTION.BOOK_MARK, REACTION_TYPE.VIDEO) : null
    ]);
    // eslint-disable-next-line no-param-reassign
    video.userReaction = {
      liked: !!liked,
      bookmarked: !!bookmarked
    };
    return video.userReaction;
  }

  public async create(
    video: FileDto,
    teaser: FileDto,
    thumbnail: FileDto,
    payload: VideoCreatePayload,
    creator?: UserDto
  ): Promise<VideoDto> {
    let valid = true;
    if (!video) valid = false;

    if (!valid && thumbnail) {
      await this.fileService.remove(thumbnail._id);
    }

    if (!valid && teaser) {
      await this.fileService.remove(teaser._id);
    }

    if (thumbnail && !thumbnail.isImage()) {
      // delete thumb if ok
      // TODO - detect ref and delete if not have
      await this.fileService.remove(thumbnail._id);
    }

    if (video && !video.mimeType.toLowerCase().includes('video')) {
      await this.fileService.remove(video._id);
    }

    if (teaser && !teaser.mimeType.toLowerCase().includes('video')) {
      await this.fileService.remove(teaser._id);
    }

    if (!valid) {
      throw new HttpException('Invalid file format', 400);
    }
    const model = new this.PerformerVideoModel(payload);
    model.fileId = video._id;
    if (!model.performerId && creator) {
      model.performerId = creator._id;
    }
    model.thumbnailId = thumbnail ? thumbnail._id : null;
    model.teaserId = teaser ? teaser._id : null;
    model.processing = true;
    creator && model.set('createdBy', creator._id);
    model.createdAt = new Date();
    model.updatedAt = new Date();
    await model.save();

    model.thumbnailId
      && (await this.fileService.addRef(model.thumbnailId, {
        itemId: model._id,
        itemType: REF_TYPE.VIDEO
      }));
    model.teaserId
      && (await this.fileService.addRef(model.teaserId, {
        itemId: model._id,
        itemType: REF_TYPE.VIDEO
      }));
    model.fileId
      && (await this.fileService.addRef(model.fileId, {
        itemType: REF_TYPE.VIDEO,
        itemId: model._id
      }));
    if (model.status === VIDEO_STATUS.ACTIVE) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_COUNT_VIDEO_CHANNEL,
          eventName: EVENT.CREATED,
          data: new VideoDto(model)
        })
      );
    }

    await this.fileService.queueProcessVideo(model.fileId, {
      publishChannel: PERFORMER_VIDEO_CHANNEL,
      meta: {
        videoId: model._id
      }
    });
    await this.fileService.queueProcessVideo(model.teaserId, {
      publishChannel: PERFORMER_VIDEO_TEASER_CHANNEL,
      meta: {
        videoId: model._id
      }
    });

    return new VideoDto(model);
  }

  // TODO - add a service to query details from public user
  // this request is for admin or owner only?
  public async getDetails(videoId: string | ObjectId, jwToken: string): Promise<VideoDto> {
    const video = await this.PerformerVideoModel.findById(videoId);
    if (!video) throw new EntityNotFoundException();
    const participantIds = video.participantIds.filter((p) => StringHelper.isObjectId(p));
    const [performer, videoFile, thumbnailFile, teaserFile, participants] = await Promise.all([
      this.performerService.findById(video.performerId),
      this.fileService.findById(video.fileId),
      video.thumbnailId ? this.fileService.findById(video.thumbnailId) : null,
      video.teaserId ? this.fileService.findById(video.teaserId) : null,
      video.participantIds.length ? await this.performerService.findByIds(participantIds) : []
    ]);

    // TODO - define interface or dto?
    const dto = new VideoDto(video);
    dto.thumbnail = thumbnailFile ? thumbnailFile.getUrl() : null;
    dto.teaser = teaserFile ? teaserFile.getUrl() : null;
    dto.video = this.getVideoForView(videoFile, dto, jwToken);
    dto.performer = performer ? new PerformerDto(performer).toSearchResponse() : null;
    dto.participants = participants.map((p) => p.toSearchResponse());
    return dto;
  }

  public async userGetDetails(videoId: string | ObjectId, currentUser: UserDto, jwToken: string): Promise<VideoDto> {
    const video = await this.PerformerVideoModel.findById(videoId);
    if (!video) throw new EntityNotFoundException();
    const participantIds = video.participantIds.filter((p) => StringHelper.isObjectId(p));
    const [performer, videoFile, thumbnailFile, teaserFile, participants] = await Promise.all([
      this.performerService.findById(video.performerId),
      this.fileService.findById(video.fileId),
      video.thumbnailId ? this.fileService.findById(video.thumbnailId) : null,
      video.teaserId ? this.fileService.findById(video.teaserId) : null,
      video.participantIds.length ? await this.performerService.findByIds(participantIds) : []
    ]);

    // TODO - define interface or dto?
    const dto = new IVideoResponse(video);
    dto.userReaction = await this.checkReaction(new VideoDto(video), currentUser);
    dto.thumbnail = thumbnailFile ? thumbnailFile.getUrl() : null;
    dto.teaser = teaserFile ? teaserFile.getUrl() : null;
    // TODO check video for sale or subscriber
    if (!dto.isSale) {
      const subscribed = currentUser && await this.subscriptionService.checkSubscribed(dto.performerId, currentUser._id);
      dto.isSubscribed = !!subscribed;
    }
    if (dto.isSale) {
      const bought = currentUser && await this.checkPaymentService.checkBought(dto, PurchaseItemType.VIDEO, currentUser);
      dto.isBought = bought;
    }
    dto.video = this.getVideoForView(videoFile, dto, jwToken);
    dto.performer = performer ? new PerformerDto(performer).toPublicDetailsResponse() : null;
    dto.participants = participants.map((p) => p.toSearchResponse());
    return dto;
  }

  public async updateInfo(id: string | ObjectId, payload: VideoUpdatePayload, updater?: UserDto): Promise<VideoDto> {
    const video = await this.PerformerVideoModel.findById(id);
    if (!video) {
      throw new EntityNotFoundException();
    }

    const oldStatus = video.status;

    merge(video, payload);
    if (video.status !== VIDEO_STATUS.FILE_ERROR && payload.status !== VIDEO_STATUS.FILE_ERROR) {
      video.status = payload.status;
    }
    if (payload.tags) {
      video.tags = payload.tags;
      video.markModified('tags');
    }
    if (payload.participantIds) {
      video.participantIds = payload.participantIds;
      video.markModified('participantIds');
    }
    updater && video.set('updatedBy', updater._id);
    video.updatedAt = new Date();
    await video.save();
    const dto = new VideoDto(video);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_COUNT_VIDEO_CHANNEL,
        eventName: EVENT.UPDATED,
        data: {
          ...dto,
          oldStatus
        }
      })
    );

    return dto;
  }

  public async delete(id: string | ObjectId) {
    const video = await this.PerformerVideoModel.findById(id);
    if (!video) {
      throw new EntityNotFoundException();
    }

    await video.remove();
    video.fileId && (await this.fileService.remove(video.fileId));
    video.thumbnailId && (await this.fileService.remove(video.fileId));
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_COUNT_VIDEO_CHANNEL,
        eventName: EVENT.DELETED,
        data: new VideoDto(video)
      })
    );
    return true;
  }

  public async increaseView(id: string | ObjectId) {
    return this.PerformerVideoModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.views': 1 }
      },
      { new: true }
    );
  }

  public async increaseComment(id: string | ObjectId, num = 1) {
    return this.PerformerVideoModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.comments': num }
      },
      { new: true }
    );
  }

  public async increaseLike(id: string | ObjectId, num = 1) {
    return this.PerformerVideoModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.likes': num }
      },
      { new: true }
    );
  }

  public async increaseFavourite(id: string | ObjectId, num = 1) {
    return this.PerformerVideoModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.bookmarks': num }
      },
      { upsert: true }
    );
  }

  public async checkAuth(req: any, user: UserDto) {
    const { query } = req;
    if (!query.videoId) {
      throw new ForbiddenException();
    }
    if (user.roles && user.roles.indexOf('admin') > -1) {
      return true;
    }
    // check type video
    const video = await this.PerformerVideoModel.findById(query.videoId);
    if (!video) throw new EntityNotFoundException();
    if (user._id.toString() === video.performerId.toString()) {
      return true;
    }
    if (!video.isSale) {
      // check subscription
      const subscribed = await this.subscriptionService.checkSubscribed(video.performerId, user._id);
      if (!subscribed) {
        throw new ForbiddenException();
      }
      return true;
    }
    if (video.isSale) {
      // check bought
      const bought = await this.checkPaymentService.checkBought(new VideoDto(video), PurchaseItemType.VIDEO, user);
      if (!bought) {
        throw new ForbiddenException();
      }
      return true;
    }
    throw new ForbiddenException();
  }
}
