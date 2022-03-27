import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { uniq } from 'lodash';
import { PageableData } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { STATUS } from 'src/kernel/constants';
import { TokenTransactionSearchService } from 'src/modules/token-transaction/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARTGET_TYPE } from 'src/modules/token-transaction/constants';
import { Storage } from 'src/modules/storage/contants';
import { PERFORMER_PHOTO_MODEL_PROVIDER } from '../providers';
import { PhotoModel } from '../models';
import { PhotoDto } from '../dtos';
import { PhotoSearchRequest } from '../payloads';
import { GalleryService } from './gallery.service';

@Injectable()
export class PhotoSearchService {
  constructor(
    @Inject(forwardRef(() => TokenTransactionSearchService))
    private readonly tokenTransactionSearchService: TokenTransactionSearchService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(PERFORMER_PHOTO_MODEL_PROVIDER)
    private readonly photoModel: Model<PhotoModel>,
    private readonly galleryService: GalleryService,
    private readonly fileService: FileService
  ) { }

  public async adminSearch(req: PhotoSearchRequest, jwToken: string): Promise<PageableData<PhotoDto>> {
    const query = {} as any;
    if (req.q) query.title = { $regex: req.q };
    if (req.performerId) query.performerId = req.performerId;
    if (req.galleryId) query.galleryId = req.galleryId;
    if (req.status) query.status = req.status;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const galleryIds = data.map((d) => d.galleryId);
    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));
    const [performers, galleries, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    photos.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }

      if (v.galleryId) {
        const gallery = galleries.find((p) => p._id.toString() === v.galleryId.toString());
        // eslint-disable-next-line no-param-reassign
        if (gallery) v.gallery = gallery;
      }

      const file = files.find((f) => f._id.toString() === v.fileId.toString());
      if (file) {
        let fileUrl = file.getUrl(true);
        if (file.server !== Storage.S3) {
          fileUrl = `${fileUrl}?photoId=${v._id}&token=${jwToken}`;
        }
        // eslint-disable-next-line no-param-reassign
        v.photo = {
          size: file.size,
          thumbnails: file.getThumbnails(),
          url: fileUrl,
          width: file.width,
          height: file.height,
          mimeType: file.mimeType
        };
      }
    });

    return {
      data: photos,
      total
    };
  }

  public async performerSearch(req: PhotoSearchRequest, user: UserDto, jwToken: string): Promise<PageableData<PhotoDto>> {
    const query = {} as any;
    if (req.q) query.title = { $regex: req.q };
    query.performerId = user._id;
    if (req.galleryId) query.galleryId = req.galleryId;
    if (req.status) query.status = req.status;
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort('-createdAt')
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));
    const [performers, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    photos.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find((p) => p._id.toString() === v.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }

      const file = files.find((f) => f._id.toString() === v.fileId.toString());
      if (file) {
        let fileUrl = file.getUrl(`${v.performerId}` === `${user._id}`);
        if (file.server !== Storage.S3) {
          fileUrl = `${fileUrl}?photoId=${v._id}&token=${jwToken}`;
        }
        // eslint-disable-next-line no-param-reassign
        v.photo = {
          size: file.size,
          thumbnails: file.getThumbnails(),
          url: fileUrl,
          width: file.width,
          height: file.height,
          mimeType: file.mimeType
        };
      }
    });

    return {
      data: photos,
      total
    };
  }

  public async searchPhotos(req: PhotoSearchRequest, user: UserDto, jwToken: string) {
    const query = {
      processing: false,
      status: STATUS.ACTIVE
    } as any;
    if (req.galleryId) query.galleryId = req.galleryId;
    const sort = { createdAt: -1 };
    const [data, total] = await Promise.all([
      this.photoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.photoModel.countDocuments(query)
    ]);

    const fileIds = data.map((d) => d.fileId);
    const photos = data.map((v) => new PhotoDto(v));
    const performerIds = uniq(data.map((v) => v.performerId));
    const galleryIds = data.filter((d) => d.galleryId).map((p) => p.galleryId);
    const [galleries, files, subscriptions, transactions] = await Promise.all([
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : [],
      user?._id ? this.subscriptionService.findSubscriptionList({
        userId: user._id,
        performerId: { $in: performerIds },
        expiredAt: { $gt: new Date() },
        status: SUBSCRIPTION_STATUS.ACTIVE
      }) : [],
      user?._id ? this.tokenTransactionSearchService.findByQuery({
        sourceId: user._id,
        targetId: { $in: galleryIds },
        target: PURCHASE_ITEM_TARTGET_TYPE.GALLERY,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }) : []
    ]);
    photos.forEach((v) => {
      if (v.galleryId) {
        const gallery = galleries.find(
          (p) => p._id.toString() === v.galleryId.toString()
        );
          // eslint-disable-next-line no-param-reassign
        if (gallery) v.gallery = gallery;
      }
      const subscription = subscriptions.find((s) => `${s.performerId}` === `${v.performerId}`);
      const bought = transactions.find((transaction) => `${transaction.targetId}` === `${v.galleryId}`);
      const canView = (v.gallery && !v.gallery.isSale && !!subscription) || (v.gallery && v.gallery.isSale && !!bought) || (user && `${user._id}` === `${v.performerId}`) || (user && user.roles && user.roles.includes('admin'));
      const file = files.find((f) => f._id.toString() === v.fileId.toString());
      if (file) {
        let fileUrl = file.getUrl(canView);
        if (file.server !== Storage.S3) {
          fileUrl = `${fileUrl}?photoId=${v._id}&token=${jwToken}`;
        }
        // eslint-disable-next-line no-param-reassign
        v.photo = {
          size: file.size,
          thumbnails: file.getThumbnails(),
          url: fileUrl,
          width: file.width,
          height: file.height,
          mimeType: file.mimeType
        };
      }
    });

    return {
      data: photos,
      total
    };
  }
}
