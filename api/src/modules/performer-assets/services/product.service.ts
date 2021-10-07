import {
  Injectable, Inject, forwardRef, ForbiddenException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  EntityNotFoundException, QueueEventService, QueueEvent, StringHelper
} from 'src/kernel';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { PerformerService } from 'src/modules/performer/services';
import { ReactionService } from 'src/modules/reaction/services/reaction.service';
import { merge, uniq, pick } from 'lodash';
import { EVENT } from 'src/kernel/constants';
import { REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { PaymentTokenService } from 'src/modules/purchased-item/services';
import { PurchaseItemType } from 'src/modules/purchased-item/constants';
import { AuthService } from 'src/modules/auth/services';
import { PRODUCT_TYPE } from '../constants';
import { ProductDto } from '../dtos';
import { ProductCreatePayload, ProductUpdatePayload } from '../payloads';
import { InvalidFileException } from '../exceptions';
import { ProductModel } from '../models';
import { PERFORMER_PRODUCT_MODEL_PROVIDER } from '../providers';

export const PERFORMER_PRODUCT_CHANNEL = 'PERFORMER_PRODUCT_CHANNEL';

@Injectable()
export class ProductService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => ReactionService))
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => PaymentTokenService))
    private readonly checkPaymentService: PaymentTokenService,
    @Inject(PERFORMER_PRODUCT_MODEL_PROVIDER)
    private readonly productModel: Model<ProductModel>,
    private readonly fileService: FileService,
    private readonly queueEventService: QueueEventService
  ) {}

  public async findByIds(ids: any) {
    const productIds = uniq((ids as any).map((i) => i.toString()));

    const products = await this.productModel
      .find({
        _id: {
          $in: productIds
        }
      })
      .lean()
      .exec();
    return products.map((p) => new ProductDto(p));
  }

  public async findById(id: string | ObjectId) {
    const data = await this.productModel.findById(id);
    return data;
  }

  public async create(
    payload: ProductCreatePayload,
    digitalFile: FileDto,
    imageFile: FileDto,
    creator?: UserDto
  ): Promise<ProductDto> {
    if (payload.type === PRODUCT_TYPE.DIGITAL && !digitalFile) {
      throw new InvalidFileException('Missing digital file');
    }

    // eslint-disable-next-line new-cap
    const product = new this.productModel(payload);
    if (digitalFile) product.digitalFileId = digitalFile._id;
    if (imageFile) product.imageId = imageFile._id;
    if (creator) {
      if (!product.performerId) {
        product.performerId = creator._id;
      }
      product.createdBy = creator._id;
      product.updatedBy = creator._id;
    }
    product.createdAt = new Date();
    product.updatedAt = new Date();
    product.slug = StringHelper.createAlias(payload.name);
    const slugCheck = await this.productModel.countDocuments({
      slug: product.slug
    });
    if (slugCheck) {
      product.slug = `${product.slug}-${StringHelper.randomString(8)}`;
    }
    await product.save();
    const dto = new ProductDto(product);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_PRODUCT_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );
    return dto;
  }

  public async update(
    id: string | ObjectId,
    payload: ProductUpdatePayload,
    digitalFile: FileDto,
    imageFile: FileDto,
    updater?: UserDto
  ): Promise<ProductDto> {
    const product = await this.productModel.findOne({ _id: id });
    if (!product) {
      throw new EntityNotFoundException();
    }
    const oldStatus = product.status;

    if (
      payload.type === PRODUCT_TYPE.DIGITAL
      && !product.digitalFileId && !digitalFile
    ) {
      throw new InvalidFileException('Missing digital file');
    }
    let { slug } = product;
    if (payload.name !== product.name) {
      slug = StringHelper.createAlias(payload.name);
      const slugCheck = await this.productModel.countDocuments({
        slug,
        _id: { $ne: product._id }
      });
      if (slugCheck) {
        slug = `${slug}-${StringHelper.randomString(8)}`;
      }
    }
    merge(product, payload);
    const deletedFileIds = [];
    if (digitalFile) {
      product.digitalFileId && deletedFileIds.push(product.digitalFileId);
      product.digitalFileId = digitalFile._id;
    }

    if (imageFile) {
      product.imageId && deletedFileIds.push(product.imageId);
      product.imageId = imageFile._id;
    }
    if (updater) product.updatedBy = updater._id;
    product.updatedAt = new Date();
    product.slug = slug;
    await product.save();
    deletedFileIds.length
      && (await Promise.all(
        deletedFileIds.map((fileId) => this.fileService.remove(fileId))
      ));

    const dto = new ProductDto(product);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_PRODUCT_CHANNEL,
        eventName: EVENT.UPDATED,
        data: {
          ...dto,
          oldStatus
        }
      })
    );
    return dto;
  }

  public async delete(id: string | ObjectId): Promise<boolean> {
    const product = await this.productModel.findOne({ _id: id });
    if (!product) {
      throw new EntityNotFoundException();
    }

    await product.remove();
    product.digitalFileId
      && (await this.fileService.remove(product.digitalFileId));
    product.imageId && (await this.fileService.remove(product.imageId));

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_PRODUCT_CHANNEL,
        eventName: EVENT.DELETED,
        data: new ProductDto(product)
      })
    );
    return true;
  }

  public async getDetails(id: string, user: UserDto) {
    const query = isObjectId(id) ? { _id: id } : { slug: id };
    const product = await this.productModel.findOne(query);
    if (!product) {
      throw new EntityNotFoundException();
    }

    const [performer, image, digitalFile] = await Promise.all([
      this.performerService.findById(product.performerId),
      product.imageId ? this.fileService.findById(product.imageId) : null,
      product.digitalFileId ? this.fileService.findById(product.digitalFileId) : null
    ]);
    const bookmark = user && await this.reactionService.checkExisting(product._id, user._id, REACTION.BOOK_MARK, REACTION_TYPE.PRODUCT);
    const dto = new ProductDto(product);
    dto.isBookMarked = !!bookmark;
    dto.image = image ? image.getUrl() : null;
    if (digitalFile) {
      const auth = await this.authService.findBySource({ source: 'user', type: 'email', sourceId: user._id })
      || await this.authService.findBySource({ source: 'user', type: 'username', sourceId: user._id });
      const jwToken = this.authService.generateJWT(pick(auth, ['_id', 'source', 'sourceId']), { expiresIn: 3 * 60 * 60 });
      dto.digitalFileUrl = digitalFile ? `${new FileDto(digitalFile).getUrl()}?productId=${product._id}&token=${jwToken}` : null;
    }
    dto.performer = new PerformerDto(performer).toResponse();
    await this.productModel.updateOne({ _id: product._id }, { $inc: { 'stats.views': 1 } });
    return dto;
  }

  public async updateStock(id: string | ObjectId, num = -1) {
    return this.productModel.updateOne(
      { _id: id },
      { $inc: { stock: num } }
    );
  }

  public async updateCommentStats(id: string | ObjectId, num = 1) {
    return this.productModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.comments': num }
      }
    );
  }

  public async updateLikeStats(id: string | ObjectId, num = 1) {
    return this.productModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.likes': num }
      }
    );
  }

  public async updateBookmarkStats(id: string | ObjectId, num = 1) {
    return this.productModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.bookmarks': num }
      }
    );
  }

  public async generateDownloadLink(productId, userId) {
    const product = await this.productModel.findById(productId);
    if (!product.digitalFileId) throw new EntityNotFoundException();
    const file = await this.fileService.findById(product.digitalFileId);
    if (!file) throw new EntityNotFoundException();

    const auth = await this.authService.findBySource({ source: 'user', type: 'email', sourceId: userId })
      || await this.authService.findBySource({ source: 'user', type: 'username', sourceId: userId });
    const jwToken = this.authService.generateJWT(pick(auth, ['_id', 'source', 'sourceId']), { expiresIn: 3 * 60 * 60 });
    // TODO - should change with header download link
    return `${new FileDto(file).getUrl()}?productId=${product._id}&token=${jwToken}`;
  }

  public async checkAuth(req: any, user: UserDto) {
    const { query } = req;
    if (!query.productId) {
      throw new ForbiddenException();
    }
    if (user.roles && user.roles.indexOf('admin') > -1) {
      return true;
    }
    // check type video
    const product = await this.productModel.findById(query.productId);
    if (!product) throw new EntityNotFoundException();
    if (user._id.toString() === product.performerId.toString()) {
      return true;
    }
    // check bought
    const bought = await this.checkPaymentService.checkBought(new ProductDto(product), PurchaseItemType.PRODUCT, user);
    if (!bought) {
      throw new ForbiddenException();
    }
    return true;
  }
}
