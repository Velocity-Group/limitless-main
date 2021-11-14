import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { EarningModel } from '../models/earning.model';
import { EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import {
  EarningSearchRequestPayload,
  UpdateEarningStatusPayload
} from '../payloads';
import { PerformerService } from '../../performer/services';
import { EarningDto, IEarningStatResponse } from '../dtos/earning.dto';
import { PerformerDto } from '../../performer/dtos';
import { PaymentService } from '../../payment/services';

@Injectable()
export class EarningService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    private readonly paymentService: PaymentService
  ) {}

  public async admminSearch(
    req: EarningSearchRequestPayload
  ): Promise<PageableData<EarningDto>> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;
    const query = {} as any;
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.transactionId) {
      query.transactionId = req.transactionId;
    }
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.isPaid) {
      query.isPaid = req.isPaid;
    }

    const sort = {
      createdAt: -1
    } as any;

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }

    const [data, total] = await Promise.all([
      this.earningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.earningModel.countDocuments(query)
    ]);
    const earnings = data.map((d) => new EarningDto(d));
    const PIds = data.map((d) => d.performerId);
    const UIds = data.map((d) => d.userId);
    const [users, performers] = await Promise.all([
      this.userService.findByIds(UIds) || [],
      this.performerService.findByIds(PIds) || []
    ]);

    earnings.forEach((earning: EarningDto) => {
      const performer = earning.performerId && performers.find(
        (p) => p._id.toString() === earning.performerId.toString()
      );
        // eslint-disable-next-line no-param-reassign
      earning.performerInfo = performer
        ? new PerformerDto(performer).toResponse()
        : null;
      const user = earning.userId && users.find(
        (p) => p._id.toString() === earning.userId.toString()
      );
        // eslint-disable-next-line no-param-reassign
      earning.userInfo = user
        ? new UserDto(user).toResponse()
        : null;
    });
    return {
      data: earnings,
      total
    };
  }

  public async search(
    req: EarningSearchRequestPayload,
    user: UserDto
  ): Promise<PageableData<EarningDto>> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;

    const query = {
      performerId: user._id
    } as any;
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.isPaid) {
      query.isPaid = req.isPaid;
    }
    const sort = {
      createdAt: -1
    } as any;

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }

    const [data, total] = await Promise.all([
      this.earningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.earningModel.countDocuments(query)
    ]);
    const earnings = data.map((d) => new EarningDto(d));
    const UIds = data.map((d) => d.userId);
    const [users] = await Promise.all([
      this.userService.findByIds(UIds) || []
    ]);

    earnings.forEach((earning: EarningDto) => {
      const u = earning.userId && users.find(
        (p) => p._id.toString() === earning.userId.toString()
      );
        // eslint-disable-next-line no-param-reassign
      earning.userInfo = u
        ? new UserDto(u).toResponse()
        : null;
    });
    return {
      data: earnings,
      total
    };
  }

  public async details(id: string) {
    const earning = await this.earningModel.findById(toObjectId(id));
    const transaction = await this.paymentService.findById(
      earning.transactionId
    );
    if (!earning || !transaction) {
      throw new EntityNotFoundException();
    }
    const [user, performer] = await Promise.all([
      this.userService.findById(earning.userId),
      this.performerService.findById(earning.performerId)
    ]);
    const data = new EarningDto(earning);
    data.userInfo = user ? new UserDto(user).toResponse(true, true) : null;
    data.performerInfo = performer
      ? new PerformerDto(performer).toResponse(true, true)
      : null;
    data.transactionInfo = transaction;
    return data;
  }

  public async stats(
    req: EarningSearchRequestPayload
  ): Promise<IEarningStatResponse> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;

    const query = {} as any;
    if (req.performerId) {
      query.performerId = toObjectId(req.performerId);
    }
    if (req.transactionId) {
      query.transactionId = req.transactionId;
    }
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }
    const [totalGrossPrice, totalNetPrice] = await Promise.all([
      this.earningModel.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$grossPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ])
    ]);
    const totalGross = (totalGrossPrice && totalGrossPrice.length && totalGrossPrice[0].total) || 0;
    const totalNet = (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;
    const totalSiteCommission = totalGross - totalNet;
    return {
      totalGrossPrice: totalGross,
      totalNetPrice: totalNet,
      totalSiteCommission
    };
  }

  public async updatePaidStatus(
    payload: UpdateEarningStatusPayload
  ): Promise<any> {
    if (!payload.fromDate || payload.fromDate === 'undefined') throw new Error('Date invalid');
    if (!payload.toDate || payload.toDate === 'undefined') throw new Error('Date invalid');
    const query = { } as any;

    if (payload.fromDate && payload.toDate) {
      query.createdAt = {
        $gt: new Date(payload.fromDate),
        $lte: new Date(payload.toDate)
      };
    }

    if (payload.performerId) {
      query.performerId = payload.performerId;
    }
    return this.earningModel.updateMany(query, {
      $set: { isPaid: true, paidAt: new Date() }
    });
  }
}
