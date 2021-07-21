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
import { PerformerService } from 'src/modules/performer/services';
import { merge, difference } from 'lodash';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { PaymentTokenService } from 'src/modules/purchased-item/services';
import { EVENT } from 'src/kernel/constants';
import { REF_TYPE } from 'src/modules/file/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { PurchaseItemType } from 'src/modules/purchased-item/constants';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { REACTION, REACTION_TYPE } from 'src/modules/reaction/constants';
import { VideoUpdatePayload } from '../payloads';
import { VideoDto, IVideoResponse } from '../dtos';
import { VIDEO_STATUS } from '../constants';
import { VideoCreatePayload } from '../payloads/video-create.payload';
import { VideoModel } from '../models';
import { PERFORMER_VIDEO_MODEL_PROVIDER } from '../providers';

export const PERFORMER_VIDEO_CHANNEL = 'PERFORMER_VIDEO_CHANNEL';
export const PERFORMER_VIDEO_TEASER_CHANNEL = 'PERFORMER_VIDEO_TEASER_CHANNEL';
export const PERFORMER_COUNT_VIDEO_CHANNEL = 'PERFORMER_COUNT_VIDEO_CHANNEL';
const FILE_PROCESSED_TOPIC = 'FILE_PROCESSED';
const TEASER_PROCESSED_TOPIC = 'TEASER_PROCESSED_TOPIC';
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
      TEASER_PROCESSED_TOPIC,
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
      await Promise.all(videos.map((video) => {
        const v = new VideoDto(video);
        this.PerformerVideoModel.updateOne(
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
        return this.queueEventService.publish(
          new QueueEvent({
            channel: PERFORMER_COUNT_VIDEO_CHANNEL,
            eventName: EVENT.UPDATED,
            data: {
              ...v,
              oldStatus
            }
          })
        );
      }));
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
    const { eventName, data } = event;
    if (eventName !== FILE_EVENT.VIDEO_PROCESSED) {
      return;
    }
    const { videoId } = data.meta;
    const [video] = await Promise.all([
      this.PerformerVideoModel.findById(videoId)
    ]);
    if (!video) {
      await this.fileService.remove(data.fileId);
      // TODO - delete file?
      return;
    }
    video.teaserProcessing = false;
    await video.save();
  }

  public async handleFileProcessed(event: QueueEvent) {
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
    if (teaser) {
      model.teaserId = teaser._id;
      model.teaserProcessing = true;
    }
    model.processing = true;
    model.slug = StringHelper.createAlias(payload.title);
    const slugCheck = await this.PerformerVideoModel.countDocuments({
      slug: model.slug
    });
    if (slugCheck) {
      model.slug = `${model.slug}-${StringHelper.randomString(8)}`;
    }
    creator && model.set('createdBy', creator._id);
    model.createdAt = new Date();
    model.updatedAt = new Date();
    await model.save();
    await Promise.all([
      model.thumbnailId && this.fileService.addRef(model.thumbnailId, {
        itemId: model._id,
        itemType: REF_TYPE.VIDEO
      }),
      model.teaserId && this.fileService.addRef(model.teaserId, {
        itemId: model._id,
        itemType: REF_TYPE.VIDEO
      }),
      model.fileId && this.fileService.addRef(model.fileId, {
        itemType: REF_TYPE.VIDEO,
        itemId: model._id
      })
    ]);
    if (model.status === VIDEO_STATUS.ACTIVE) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_COUNT_VIDEO_CHANNEL,
          eventName: EVENT.CREATED,
          data: new VideoDto(model)
        })
      );
    }
    // covert video file
    await this.fileService.queueProcessVideo(model.fileId, {
      publishChannel: PERFORMER_VIDEO_CHANNEL,
      meta: {
        videoId: model._id
      }
    });
    // convert teaser file
    model.teaserId && await this.fileService.queueProcessVideo(model.teaserId, {
      publishChannel: PERFORMER_VIDEO_TEASER_CHANNEL,
      meta: {
        videoId: model._id
      }
    });

    return new VideoDto(model);
  }

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

  public async userGetDetails(videoId: string, currentUser: UserDto, jwToken: string): Promise<VideoDto> {
    const query = isObjectId(videoId) ? { _id: videoId } : { slug: videoId };
    const video = await this.PerformerVideoModel.findOne(query);
    if (!video) throw new EntityNotFoundException();
    const participantIds = video.participantIds.filter((p) => StringHelper.isObjectId(p));
    const fileIds = [video.fileId];
    video.teaserId && fileIds.push(video.teaserId);
    video.thumbnailId && fileIds.push(video.thumbnailId);
    const [performer, files, participants, reactions] = await Promise.all([
      this.performerService.findById(video.performerId),
      this.fileService.findByIds(fileIds),
      video.participantIds.length ? await this.performerService.findByIds(participantIds) : [],
      this.reactionService.findByQuery({ objectType: REACTION_TYPE.VIDEO, objectId: video._id })
    ]);

    // TODO - define interface or dto?
    const dto = new IVideoResponse(video);
    const thumbnailFile = files.find((f) => `${f._id}` === `${dto.thumbnailId}`);
    const teaserFile = files.find((f) => `${f._id}` === `${dto.teaserId}`);
    const videoFile = files.find((f) => `${f._id}` === `${dto.fileId}`);
    dto.isLiked = !!reactions.filter((r) => r.action === REACTION.LIKE).length;
    dto.isBookmarked = !!reactions.filter((r) => r.action === REACTION.BOOK_MARK).length;
    // TODO check video for sale or subscriber
    if (!dto.isSale) {
      const subscribed = currentUser && await this.subscriptionService.checkSubscribed(dto.performerId, currentUser._id);
      dto.isSubscribed = !!subscribed;
    }
    if (dto.isSale) {
      const bought = currentUser && await this.checkPaymentService.checkBought(dto, PurchaseItemType.VIDEO, currentUser);
      dto.isBought = bought;
    }
    dto.thumbnail = thumbnailFile ? {
      url: thumbnailFile.getUrl(),
      thumbnails: thumbnailFile.getThumbnails()
    } : null;
    dto.teaser = teaserFile ? {
      url: teaserFile.getUrl(),
      thumbnails: teaserFile.getThumbnails()
    } : null;
    dto.video = this.getVideoForView(videoFile, dto, jwToken);
    dto.performer = performer ? new PerformerDto(performer).toPublicDetailsResponse() : null;
    dto.participants = participants.map((p) => p.toSearchResponse());
    await this.increaseView(dto._id);
    return dto;
  }

  public async updateInfo(id: string | ObjectId, payload: VideoUpdatePayload, files: any, updater: UserDto): Promise<VideoDto> {
    const { video: videoFile, thumbnail: thumbnailFile, teaser: teaserFile } = files;
    const video = await this.PerformerVideoModel.findById(id);
    if (!video) {
      throw new EntityNotFoundException();
    }
    const { fileId, thumbnailId, teaserId } = video;
    if (videoFile && videoFile._id) {
      video.fileId = videoFile._id;
    }
    if (thumbnailFile && thumbnailFile._id) {
      video.thumbnailId = thumbnailFile._id;
    }
    if (teaserFile && teaserFile._id) {
      video.teaserId = teaserFile._id;
    }
    if (videoFile && !videoFile?.mimeType?.toLowerCase().includes('video')) {
      await this.fileService.remove(videoFile._id);
      delete video.fileId;
    }
    if (thumbnailFile && !thumbnailFile.isImage()) {
      await this.fileService.remove(thumbnailFile._id);
      delete video.thumbnailId;
    }
    if (teaserFile && !teaserFile.mimeType.toLowerCase().includes('video')) {
      await this.fileService.remove(teaserFile._id);
      delete video.teaserId;
    }
    const oldStatus = video.status;
    let { slug } = video;
    if (payload.title !== video.title) {
      slug = StringHelper.createAlias(payload.title);
      const slugCheck = await this.PerformerVideoModel.countDocuments({
        slug: video.slug,
        _id: { $ne: video._id }
      });
      if (slugCheck) {
        slug = `${video.slug}-${StringHelper.randomString(8)}`;
      }
    }
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
    video.slug = slug;
    await video.save();
    const dto = new VideoDto(video);
    if (thumbnailFile && `${video.thumbnailId}` !== `${thumbnailId}`) {
      await Promise.all([
        this.fileService.addRef(video.thumbnailId, {
          itemId: video._id,
          itemType: REF_TYPE.VIDEO
        }),
        thumbnailId && this.fileService.remove(thumbnailId)
      ]);
    }
    if (videoFile && `${video.fileId}` !== `${fileId}`) {
      // add ref, remove old file, convert file
      await Promise.all([
        this.fileService.addRef(video.fileId, {
          itemId: video._id,
          itemType: REF_TYPE.VIDEO
        }),
        fileId && this.fileService.remove(fileId),
        this.fileService.queueProcessVideo(video.fileId, {
          publishChannel: PERFORMER_VIDEO_CHANNEL,
          meta: {
            videoId: video._id
          }
        })
      ]);
    }
    if (teaserFile && `${video.teaserId}` !== `${teaserId}`) {
      // add ref, remove old file, convert file
      await Promise.all([
        this.fileService.addRef(video.teaserId, {
          itemId: video._id,
          itemType: REF_TYPE.VIDEO
        }),
        teaserId && this.fileService.remove(teaserId),
        this.fileService.queueProcessVideo(video.teaserId, {
          publishChannel: PERFORMER_VIDEO_TEASER_CHANNEL,
          meta: {
            videoId: video._id
          }
        })
      ]);
    }
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
      }
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
