import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { STATUS } from 'src/kernel/constants';
import { PERFORMER_PRODUCT_MODEL_PROVIDER } from '../providers';
import { ProductModel } from '../models';
import { ProductDto } from '../dtos';
import { ProductSearchRequest } from '../payloads';

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(PERFORMER_PRODUCT_MODEL_PROVIDER)
    private readonly productModel: Model<ProductModel>,
    private readonly fileService: FileService
  ) {}

  public async getTrendings(req: any) {
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
          name: { $regex: regexp }
        }
      ];
    }
    if (req.ids && req.ids.length > 0) {
      query._id = { $in: req.ids };
    }

    const sort = {
      'stats.views': -1,
      'stats.likes': -1,
      'stats.comments': -1,
      'stats.bookmarks': -1,
      updatedAt: -1
    };

    const [data] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10))
    ]);

    const imageIds = data.map((d) => d.imageId);
    const products = data.map((v) => new ProductDto(v));
    const performerIds = data.map((v) => v.performerId);
    const [images, performers] = await Promise.all([
      imageIds.length ? this.fileService.findByIds(imageIds) : [],
      this.performerService.findByIds(performerIds)
    ]);
    products.forEach((v) => {
      const file = images.length > 0 && v.imageId
        ? images.find((f) => f._id.toString() === v.imageId.toString())
        : null;
      // TODO - get default image for dto?
      if (file) {
        // eslint-disable-next-line no-param-reassign
        v.image = file.getUrl();
      }
      const performer = performers.find((p) => `${p._id}` === `${v.performerId}`);
      // eslint-disable-next-line no-param-reassign
      v.performer = performer.toResponse();
    });
    return products;
  }

  public async adminSearch(
    req: ProductSearchRequest
  ): Promise<PageableData<ProductDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.status) query.status = req.status;

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.productModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const imageIds = data.map((d) => d.imageId);
    const products = data.map((v) => new ProductDto(v));
    const [performers, images] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      imageIds.length ? this.fileService.findByIds(imageIds) : []
    ]);
    products.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find(
        (p) => p._id.toString() === v.performerId.toString()
      );
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = {
          username: performer.username
        };
      }
      const file = images.length > 0 && v.imageId
        ? images.find((f) => f._id.toString() === v.imageId.toString())
        : null;
      // TODO - get default image for dto?
      if (file) {
        // eslint-disable-next-line no-param-reassign
        v.image = file.getUrl();
      }
    });

    return {
      data: products,
      total
    };
  }

  public async performerSearch(
    req: ProductSearchRequest,
    user: UserDto
  ): Promise<PageableData<ProductDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }
    query.performerId = user._id;
    if (req.status) query.status = req.status;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.productModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const imageIds = data.map((d) => d.imageId);
    const products = data.map((v) => new ProductDto(v));
    const [performers, images] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      imageIds.length ? this.fileService.findByIds(imageIds) : []
    ]);
    products.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find(
        (p) => p && p._id.toString() === v.performerId.toString()
      );
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = {
          username: performer.username
        };
      }
      // TODO - check user or performer
      const file = images.length > 0 && v.imageId
        ? images.find((f) => f._id.toString() === v.imageId.toString())
        : null;
      // TODO - get default image for dto?
      if (file) {
        // eslint-disable-next-line no-param-reassign
        v.image = file.getUrl();
      }
    });

    return {
      data: products,
      total
    };
  }

  public async userSearch(
    req: ProductSearchRequest
  ): Promise<PageableData<ProductDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.excludedId) query._id = { $ne: req.excludedId };
    if (req.includedIds) query._id = { $in: req.includedIds };
    query.status = 'active';
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.productModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const imageIds = data.map((d) => d.imageId);
    const products = data.map((v) => new ProductDto(v));
    const [performers, images] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      imageIds.length ? this.fileService.findByIds(imageIds) : []
    ]);
    products.forEach((v) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = performers.find(
        (p) => p._id.toString() === v.performerId.toString()
      );
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        v.performer = new PerformerDto(performer).toResponse();
      }
      // TODO - check user or performer
      const file = images.length > 0 && v.imageId
        ? images.find((f) => f._id.toString() === v.imageId.toString())
        : null;
      // TODO - get default image for dto?
      if (file) {
        // eslint-disable-next-line no-param-reassign
        v.image = file.getUrl();
      }
    });

    return {
      data: products,
      total
    };
  }
}
