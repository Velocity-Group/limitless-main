import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { TokenTransactionSearchService } from 'src/modules/token-transaction/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { STATUS } from 'src/kernel/constants';
import { uniq } from 'lodash';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARTGET_TYPE } from 'src/modules/token-transaction/constants';
import { VideoDto } from '../dtos';
import { VideoSearchRequest } from '../payloads';
import { VideoModel } from '../models';
import { PERFORMER_VIDEO_MODEL_PROVIDER } from '../providers';

@Injectable()
export class VideoSearchService {
  constructor(
    @Inject(forwardRef(() => TokenTransactionSearchService))
    private readonly tokenTransactionSearchService: TokenTransactionSearchService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly videoModel: Model<VideoModel>,
    private readonly fileService: FileService
  ) {}

  public async adminSearch(req: VideoSearchRequest): Promise<PageableData<VideoDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        { tags: { $elemMatch: { $regex: regexp } } },
        {
          description: { $regex: regexp }
        }
      ];
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.status) query.status = req.status;
    if (req.isSale) query.isSale = req.isSale;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.videoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.videoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const fileIds = [];
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
      v.teaserId && fileIds.push(v.teaserId);
    });

    const [performers, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      const performer = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }

      if (v.thumbnailId) {
        const thumbnail = files.find((f) => f._id.toString() === v.thumbnailId.toString());
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = {
            name: thumbnail.name,
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            name: video.name,
            url: null,
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
      if (v.teaserId) {
        const teaser = files.find((f) => f._id.toString() === v.teaserId.toString());
        if (teaser) {
          // eslint-disable-next-line no-param-reassign
          v.teaser = {
            name: teaser.name,
            url: null,
            thumbnails: teaser.getThumbnails(),
            duration: teaser.duration
          };
        }
      }
    });

    return {
      data: videos,
      total
    };
  }

  public async performerSearch(req: VideoSearchRequest, performer?: UserDto): Promise<PageableData<VideoDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        { tags: { $elemMatch: { $regex: regexp } } },
        {
          description: { $regex: regexp }
        }
      ];
    }
    query.performerId = performer._id;
    if (req.isSale) query.isSale = req.isSale;
    if (req.status) query.status = req.status;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.videoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.videoModel.countDocuments(query)
    ]);
    const fileIds = [];
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
      v.teaserId && fileIds.push(v.teaserId);
    });

    const [files] = await Promise.all([
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      if (v.thumbnailId) {
        const thumbnail = files.find((f) => f._id.toString() === v.thumbnailId.toString());
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = {
            name: thumbnail.name,
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.teaserId) {
        const teaser = files.find((f) => f._id.toString() === v.teaserId.toString());
        if (teaser) {
          // eslint-disable-next-line no-param-reassign
          v.teaser = {
            name: teaser.name,
            url: null,
            thumbnails: teaser.getThumbnails()
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            name: video.name,
            url: null,
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
    });

    return {
      data: videos,
      total
    };
  }

  public async userSearch(req: VideoSearchRequest, user: UserDto): Promise<PageableData<VideoDto>> {
    const query = {
      status: STATUS.ACTIVE
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        { tags: { $elemMatch: { $regex: regexp } } },
        {
          description: { $regex: regexp }
        }
      ];
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.isSale) query.isSale = req.isSale;
    if (req.excludedId) query._id = { $ne: req.excludedId };
    if (req.ids && Array.isArray(req.ids)) {
      query._id = {
        $in: req.ids
      };
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.videoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.videoModel.countDocuments(query)
    ]);
    const videos = await this.mapArrayInfo(data, user);
    return {
      data: videos,
      total
    };
  }

  public async mapArrayInfo(data, user: UserDto) {
    const fileIds = [];
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
      v.teaserId && fileIds.push(v.teaserId);
    });
    const performerIds = uniq(data.map((d) => d.performerId));
    const videoIds = data.map((d) => d._id);
    const [files, subscriptions, transactions] = await Promise.all([
      fileIds.length ? this.fileService.findByIds(fileIds) : [],
      user?._id ? this.subscriptionService.findSubscriptionList({
        userId: user._id,
        performerId: { $in: performerIds },
        expiredAt: { $gt: new Date() },
        status: SUBSCRIPTION_STATUS.ACTIVE
      }) : [],
      user?._id ? this.tokenTransactionSearchService.findByQuery({
        sourceId: user._id,
        targetId: { $in: videoIds },
        target: PURCHASE_ITEM_TARTGET_TYPE.VIDEO,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }) : []
    ]);
    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((vid) => {
      const v = vid;
      if (v.thumbnailId) {
        const thumbnail = files.find((f) => f._id.toString() === v.thumbnailId.toString());
        if (thumbnail) {
          v.thumbnail = {
            url: thumbnail.getUrl(),
            thumbnails: thumbnail.getThumbnails()
          };
        }
      }
      if (v.teaserId) {
        const teaser = files.find((f) => f._id.toString() === v.teaserId.toString());
        if (teaser) {
          v.teaser = {
            url: null, // teaser.getUrl(),
            thumbnails: teaser.getThumbnails(),
            duration: teaser.duration
          };
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          v.video = {
            url: null, // video.getUrl(),
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
      const isSubscribed = subscriptions.find((s) => `${s.performerId}` === `${v.performerId}`);
      v.isSubscribed = !user ? false : !!((isSubscribed || (`${user._id}` === `${v.performerId}`) || (user.roles && user.roles.includes('admin'))));
      const bought = transactions.find((transaction) => `${transaction.targetId}` === `${v._id}`);
      v.isBought = !user ? false : !!((bought || (`${user._id}` === `${v.performerId}`) || (user.roles && user.roles.includes('admin'))));
      return v;
    });
    return videos;
  }
}
