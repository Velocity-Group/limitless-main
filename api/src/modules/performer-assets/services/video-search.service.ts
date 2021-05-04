import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { STATUS } from 'src/kernel/constants';
import { PurchasedItemSearchService } from 'src/modules/purchased-item/services';
import { PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARTGET_TYPE } from 'src/modules/purchased-item/constants';
import { UserDto } from 'src/modules/user/dtos';
import { VideoDto } from '../dtos';
import { VideoSearchRequest } from '../payloads';
import { VideoModel } from '../models';
import { PERFORMER_VIDEO_MODEL_PROVIDER } from '../providers';

@Injectable()
export class VideoSearchService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => PurchasedItemSearchService))
    private readonly purchasedItemSearchService: PurchasedItemSearchService,
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
        v.performer = {
          username: performer.username
        };
      }

      if (v.thumbnailId) {
        const thumbnail = files.find((f) => f._id.toString() === v.thumbnailId.toString());
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = thumbnail.getUrl();
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: video.getUrl(),
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
    const performerIds = data.map((d) => d.performerId);
    const fileIds = [];
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
    });

    const [performers, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      const perforerFound = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (perforerFound) {
        // eslint-disable-next-line no-param-reassign
        v.performer = {
          username: perforerFound.username
        };
      }

      if (v.thumbnailId) {
        const thumbnail = files.find((f) => f._id.toString() === v.thumbnailId.toString());
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = thumbnail.getUrl();
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: video.getUrl(),
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
      status: STATUS.ACTIVE,
      isSchedule: false
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
    const performerIds = data.map((d) => d.performerId);
    const fileIds = [];
    const videoIds = data.map((d) => d._id);
    data.forEach((v) => {
      v.thumbnailId && fileIds.push(v.thumbnailId);
      v.fileId && fileIds.push(v.fileId);
    });

    const [performers, files, transactions] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : [],
      user ? this.purchasedItemSearchService.findByQuery({
        sourceId: user._id,
        targetId: { $in: videoIds },
        target: PURCHASE_ITEM_TARTGET_TYPE.VIDEO,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }) : []
    ]);

    const videos = data.map((v) => new VideoDto(v));
    videos.forEach((v) => {
      const performer = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = {
          username: performer.username
        };
      }
      // check login & subscriber filter data
      if (v.thumbnailId) {
        const thumbnail = files.find((f) => f._id.toString() === v.thumbnailId.toString());
        if (thumbnail) {
          // eslint-disable-next-line no-param-reassign
          v.thumbnail = thumbnail.getUrl();
        }
      }
      if (v.fileId) {
        const video = files.find((f) => f._id.toString() === v.fileId.toString());
        if (video) {
          // eslint-disable-next-line no-param-reassign
          v.video = {
            url: null, // video.getUrl(),
            thumbnails: video.getThumbnails(),
            duration: video.duration
          };
        }
      }
      if (user) {
        const isBought = transactions.find((t) => t.targetId.toString() === v._id.toString());
        // eslint-disable-next-line no-param-reassign
        v.isBought = !!isBought;
      }
    });

    return {
      data: videos,
      total
    };
  }
}
