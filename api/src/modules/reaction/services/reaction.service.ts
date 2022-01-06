import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData, QueueEventService, QueueEvent } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import {
  VideoService, GalleryService, ProductService, VideoSearchService
} from 'src/modules/performer-assets/services';
import { ObjectId } from 'mongodb';
import { FeedService } from 'src/modules/feed/services';
import { uniq } from 'lodash';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FeedDto } from 'src/modules/feed/dtos';
import {
  ProductDto
} from 'src/modules/performer-assets/dtos';
import { FileService } from 'src/modules/file/services';
import { ReactionModel } from '../models/reaction.model';
import { REACT_MODEL_PROVIDER } from '../providers/reaction.provider';
import {
  ReactionCreatePayload, ReactionSearchRequestPayload
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { ReactionDto } from '../dtos/reaction.dto';
import { UserService } from '../../user/services';
import { PerformerService } from '../../performer/services';
import { REACTION, REACTION_CHANNEL, REACTION_TYPE } from '../constants';

@Injectable()
export class ReactionService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => VideoSearchService))
    private readonly videoSearchService: VideoSearchService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => FeedService))
    private readonly feedService: FeedService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(REACT_MODEL_PROVIDER)
    private readonly reactionModel: Model<ReactionModel>,
    private readonly queueEventService: QueueEventService

  ) { }

  public async findOneQuery(query) {
    return this.reactionModel.findOne(query).lean();
  }

  public async findByQuery(query) {
    return this.reactionModel.find(query).lean();
  }

  public async create(
    data: ReactionCreatePayload,
    user: UserDto
  ): Promise<ReactionDto> {
    const reaction = { ...data } as any;
    const existReact = await this.reactionModel.findOne({
      objectType: reaction.objectType,
      objectId: reaction.objectId,
      createdBy: user._id,
      action: reaction.action
    });
    if (existReact) {
      return existReact;
    }
    reaction.createdBy = user._id;
    reaction.createdAt = new Date();
    reaction.updatedAt = new Date();
    const newreaction = await this.reactionModel.create(reaction);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: REACTION_CHANNEL,
        eventName: EVENT.CREATED,
        data: new ReactionDto(newreaction)
      })
    );
    return newreaction;
  }

  public async remove(payload: ReactionCreatePayload, user: UserDto) {
    const reaction = await this.reactionModel.findOne({
      objectType: payload.objectType,
      objectId: payload.objectId,
      createdBy: user._id,
      action: payload.action
    });
    if (!reaction) {
      return false;
    }
    await reaction.remove();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: REACTION_CHANNEL,
        eventName: EVENT.DELETED,
        data: new ReactionDto(reaction)
      })
    );
    return true;
  }

  public async search(
    req: ReactionSearchRequestPayload
  ): Promise<PageableData<ReactionDto>> {
    const query = {} as any;
    if (req.objectId) {
      query.objectId = req.objectId;
    }
    const sort = {
      createdAt: -1
    };
    const [data, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);
    const reactions = data.map((d) => new ReactionDto(d));
    const UIds = data.map((d) => d.createdBy);
    const [users, performers] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      UIds.length ? this.performerService.findByIds(UIds) : []
    ]);
    reactions.forEach((reaction: ReactionDto) => {
      const performer = performers.find(
        (p) => p._id.toString() === reaction.createdBy.toString()
      );
      const user = users.find(
        (u) => u._id.toString() === reaction.createdBy.toString()
      );
      // eslint-disable-next-line no-param-reassign
      reaction.creator = performer || user;
    });
    return {
      data: reactions,
      total
    };
  }

  public async getListProduct(req: ReactionSearchRequestPayload, user: UserDto) {
    const query = {
      objectType: REACTION_TYPE.PRODUCT,
      action: REACTION.BOOK_MARK,
      createdBy: user._id
    } as any;
    if (req.createdBy) query.createdBy = req.createdBy;
    if (req.action) query.action = req.action;

    const sort = {
      [req.sortBy || 'createdAt']: req.sort === 'desc' ? -1 : 1
    };
    const [items, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);

    const productIds = uniq(items.map((i) => i.objectId));
    const products = productIds.length > 0 ? await this.productService.findByIds(productIds) : [];
    const fileIds = products.map((p) => p.imageId);
    const images = fileIds.length ? await this.fileService.findByIds(fileIds) : [];
    const reactions = items.map((v) => new ReactionDto(v));
    reactions.forEach((item) => {
      const product = products.find((p) => `${p._id}` === `${item.objectId}`);
      if (product) {
        const p = new ProductDto(product);
        const image = images.find((f) => f._id.toString() === p.imageId.toString());
        p.image = image ? image.getUrl() : null;
        // eslint-disable-next-line no-param-reassign
        item.objectInfo = p;
      }
    });

    return {
      data: reactions,
      total
    };
  }

  public async getListVideo(req: ReactionSearchRequestPayload, user: UserDto) {
    const query = {
      objectType: REACTION_TYPE.VIDEO,
      action: REACTION.BOOK_MARK,
      createdBy: user._id
    } as any;
    if (req.createdBy) query.createdBy = req.createdBy;
    if (req.action) query.action = req.action;

    const sort = {
      [req.sortBy || 'createdAt']: req.sort === 'desc' ? -1 : 1
    };
    const [items, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);
    const videoIds = uniq(items.map((i) => i.objectId));
    const videos = videoIds.length > 0 ? await this.videoService.findByIds(videoIds) : [];
    const mapVideos = await this.videoSearchService.mapArrayInfo(videos, user);
    const reactions = items.map((v) => new ReactionDto(v));
    reactions.forEach((r) => {
      const item = r;
      const video = mapVideos.find((v) => `${v._id}` === `${item.objectId}`);
      item.objectInfo = video;
      return item;
    });

    return {
      data: reactions,
      total
    };
  }

  public async getListGallery(req: ReactionSearchRequestPayload, user: UserDto) {
    const query = {
      objectType: REACTION_TYPE.GALLERY,
      action: REACTION.BOOK_MARK,
      createdBy: user._id
    } as any;
    if (req.createdBy) query.createdBy = req.createdBy;
    if (req.action) query.action = req.action;

    const sort = {
      [req.sortBy || 'createdAt']: req.sort === 'desc' ? -1 : 1
    };
    const [items, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);

    const galleryIds = uniq(items.map((i) => i.objectId));
    const galleries = galleryIds.length > 0 ? await this.galleryService.findByIds(galleryIds) : [];
    const mapGalleries = await this.galleryService.mapArrayInfo(galleries, user);
    const reactions = items.map((v) => new ReactionDto(v));
    reactions.forEach((r) => {
      const item = r;
      const gallery = mapGalleries.find((p) => `${p._id}` === `${item.objectId}`);
      item.objectInfo = gallery;
      return item;
    });

    return {
      data: reactions,
      total
    };
  }

  public async getListPerformer(req: ReactionSearchRequestPayload, user: UserDto) {
    const query = {
      objectType: REACTION_TYPE.PERFORMER,
      action: REACTION.BOOK_MARK,
      createdBy: user._id
    } as any;
    if (req.createdBy) query.createdBy = req.createdBy;
    if (req.action) query.action = req.action;

    const sort = {
      [req.sortBy || 'createdAt']: req.sort === 'desc' ? -1 : 1
    };
    const [items, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);

    const performerIds = uniq(items.map((i) => i.objectId));
    const performers = await this.performerService.findByIds(performerIds);
    const reactions = items.map((v) => new ReactionDto(v));
    reactions.forEach((item) => {
      const performer = performers.find((p) => `${p._id}` === `${item.objectId}`);
      // eslint-disable-next-line no-param-reassign
      item.objectInfo = performer ? new PerformerDto(performer).toSearchResponse() : null;
    });

    return {
      data: reactions,
      total
    };
  }

  public async getListFeeds(req: ReactionSearchRequestPayload, user: UserDto, jwToken: string) {
    const query = {
      objectType: REACTION_TYPE.FEED,
      action: REACTION.BOOK_MARK,
      createdBy: user._id
    } as any;
    if (req.createdBy) query.createdBy = req.createdBy;
    if (req.action) query.action = req.action;
    if (req.objectType) {
      query.objectType = req.objectType;
    }

    const sort = {
      [req.sortBy || 'createdAt']: req.sort === 'desc' ? -1 : 1
    };
    const [items, total] = await Promise.all([
      this.reactionModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.reactionModel.countDocuments(query)
    ]);

    const feedIds = uniq(items.map((i) => i.objectId));
    const feeds = await this.feedService.findByIds(feedIds);
    const mapFeeds = await this.feedService.populateFeedData(feeds, user, jwToken);
    const reactions = items.map((v) => new ReactionDto(v));
    reactions.forEach((item) => {
      const feed = mapFeeds.find((p) => `${p._id}` === `${item.objectId}`);
      // eslint-disable-next-line no-param-reassign
      item.objectInfo = feed ? new FeedDto(feed) : null;
    });

    return {
      data: reactions,
      total
    };
  }

  public async checkExisting(objectId: string | ObjectId, userId: string | ObjectId, action: string, objectType: string) {
    return this.reactionModel.countDocuments({
      objectId, createdBy: userId, action, objectType
    });
  }
}
