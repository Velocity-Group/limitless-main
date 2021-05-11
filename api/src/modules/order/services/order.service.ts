/* eslint-disable no-param-reassign */
import {
  Injectable,
  Inject,
  forwardRef
} from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import {
  ProductService
} from 'src/modules/performer-assets/services';
import {
  EntityNotFoundException
} from 'src/kernel';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as moment from 'moment';
import { PerformerDto } from 'src/modules/performer/dtos';
import { MailerService } from 'src/modules/mailer';
import { uniq } from 'lodash';
import { PRODUCT_TYPE } from 'src/modules/performer-assets/constants';
import { ORDER_MODEL_PROVIDER } from '../providers';
import { OrderModel } from '../models';
import {
  OrderSearchPayload, OrderUpdatePayload
} from '../payloads';
import {
  ORDER_STATUS
} from '../constants';
import { OrderDto } from '../dtos';

@Injectable()
export class OrderService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(ORDER_MODEL_PROVIDER)
    private readonly orderModel: Model<OrderModel>,
    private readonly mailService: MailerService
  ) { }

  public async findById(id: string | ObjectId) {
    return this.orderModel.findById(id);
  }

  public async findByIds(ids: string[] | ObjectId[]) {
    return this.orderModel.find({ _id: { $in: ids } });
  }

  public async findByQuery(payload: any) {
    const data = await this.orderModel.find(payload);
    return data;
  }

  public async search(req: OrderSearchPayload) {
    const query = { } as any;
    if (req.performerId) query.performerId = req.performerId;
    if (req.deliveryStatus) query.deliveryStatus = req.deliveryStatus;
    if (req.phoneNumber) query.phoneNumber = { $regex: req.phoneNumber };
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).endOf('day'),
        $lte: moment(req.toDate).endOf('day')
      };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.orderModel.countDocuments(query)
    ]);
    const PIds = uniq(data.map((d) => d.performerId));
    const UIds = uniq(data.map((d) => d.userId));
    const productIds = uniq(data.map((d) => d.productIds[0]));

    const [performers, users, products] = await Promise.all([
      PIds.length ? this.performerService.findByIds(PIds) : [],
      UIds.length ? this.performerService.findByIds(UIds) : [],
      productIds.length ? this.productService.findByIds(productIds) : []
    ]);

    const orders = data.map((v) => new OrderDto(v));
    orders.forEach(async (order) => {
      if (order.performerId) {
        const performerInfo = performers.find(
          (t) => t._id.toString() === order.performerId.toString()
        );
        if (performerInfo) {
          order.performerInfo = performerInfo.toResponse();
        }
      }
      if (order.userId) {
        const userInfo = users.find(
          (t) => t._id.toString() === order.userId.toString()
        );
        if (userInfo) {
          order.userInfo = userInfo.toResponse();
        }
      }
      if (order.productIds) {
        const productsInfo = products.filter((p) => order.productIds[0].toString() === p._id.toString());
        if (productsInfo.length) {
          order.productsInfo = productsInfo;
        }
      }
    });
    return {
      data: orders,
      total
    };
  }

  public async findOne(id: string, jwToken: string) {
    const order = await this.findById(id);
    if (!order) {
      throw new EntityNotFoundException();
    }

    const [user, performer, products] = await Promise.all([
      this.performerService.findById(order.userId),
      this.performerService.findById(order.performerId),
      this.productService.findByIds(order.productIds)
    ]);
    const newOrder = new OrderDto(order);
    if (user) {
      newOrder.userInfo = new PerformerDto(user).toResponse();
    }
    if (performer) {
      newOrder.performerInfo = new PerformerDto(performer).toResponse();
    }
    if (products.length) {
      newOrder.productsInfo = products;
    }
    if (newOrder.digitalPath && jwToken && products[0].type === PRODUCT_TYPE.DIGITAL) {
      newOrder.digitalPath = `${newOrder.digitalPath}?productId=${products[0]._id}&token=${jwToken}`;
    }
    return newOrder;
  }

  public async update(id: string, payload: OrderUpdatePayload) {
    const data = { ...payload };
    const order = await this.findById(id);
    if (!order) {
      throw new EntityNotFoundException();
    }
    await this.orderModel.updateOne({ _id: id }, data, { new: true });
    if (data.deliveryStatus !== ORDER_STATUS.PROCESSING) {
      const user = await this.performerService.findById(order.userId);
      if (user) {
        await this.mailService.send({
          subject: 'Order Status Changed',
          to: user.email,
          data: {
            user,
            order,
            deliveryStatus: data.deliveryStatus
          },
          template: 'update-order-status.html'
        });
      }
    }
    return { success: true };
  }

  public async userSearch(req: OrderSearchPayload, user: any) {
    const query = {
      userId: user._id
    } as any;
    if (req.deliveryStatus) query.deliveryStatus = req.deliveryStatus;
    if (req.phoneNumber) query.phoneNumber = { $regex: req.phoneNumber };
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate),
        $lt: moment(req.toDate)
      };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.orderModel.countDocuments(query)
    ]);
    const PIds = uniq(data.map((d) => d.performerId));
    const productIds = uniq(data.map((d) => d.productIds[0]));
    const [performers, products] = await Promise.all([
      this.performerService.findByIds(PIds),
      this.productService.findByIds(productIds)
    ]);
    const orders = data.map((v) => new OrderDto(v));
    orders.forEach(async (order) => {
      if (order.performerId) {
        const performerInfo = performers.find(
          (t) => t._id.toString() === order.performerId.toString()
        );
        if (performerInfo) {
          order.performerInfo = performerInfo.toResponse();
        }
        if (order.productIds) {
          const productsInfo = products.filter((p) => order.productIds[0].toString() === p._id.toString());
          if (productsInfo.length) {
            order.productsInfo = productsInfo;
          }
        }
      }
    });
    return {
      data: orders,
      total
    };
  }
}
