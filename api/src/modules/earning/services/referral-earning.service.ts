import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { uniq } from 'lodash';
import * as moment from 'moment';
import { UserDto } from 'src/modules/user/dtos';
import { ReferralService } from 'src/modules/auth/services';
import { UserService } from 'src/modules/user/services';
import { ReferralEarningModel } from '../models';
import { REFERRAL_EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import {
  ReferralEarningSearchRequestPayload
} from '../payloads';
import { PerformerService } from '../../performer/services';
import { ReferralEarningDto, IReferralEarningStatResponse } from '../dtos/referral-earning.dto';

@Injectable()
export class ReferralEarningService {
  constructor(
    @Inject(forwardRef(() => ReferralService))
    private readonly referralService: ReferralService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(REFERRAL_EARNING_MODEL_PROVIDER)
    private readonly referralEarningModel: Model<ReferralEarningModel>
  ) {}

  public async search(
    req: ReferralEarningSearchRequestPayload
  ): Promise<PageableData<ReferralEarningDto>> {
    const query = {} as any;
    if (req.referralId) {
      query.referralId = req.referralId;
    }
    if (req.registerId) {
      query.registerId = req.registerId;
    }

    if (req.type) {
      query.type = req.type;
    }

    if (req.isPaid) {
      query.isPaid = req.isPaid === 'true';
    }

    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).startOf('day').toDate()
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
      this.referralEarningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.referralEarningModel.countDocuments(query)
    ]);
    const earnings = data.map((d) => new ReferralEarningDto(d));
    const registerIds = data.map((d) => d.registerId);
    const referralIds = data.map((d) => d.referralId);
    const Ids = uniq(registerIds.concat(referralIds));
    const [users, performers] = await Promise.all([
      this.userService.findByIds(Ids) || [],
      this.performerService.findByIds(Ids) || []
    ]);

    earnings.forEach((earning: ReferralEarningDto) => {
      const registerInfo = users.find((p) => `${p._id}` === `${earning.registerId}`) || performers.find((p) => `${p._id}` === `${earning.registerId}`);
      // eslint-disable-next-line no-param-reassign
      earning.registerInfo = registerInfo ? new UserDto(registerInfo as any).toResponse() : null;
      const referralInfo = users.find((p) => `${p._id}` === `${earning.referralId}`) || performers.find((p) => `${p._id}` === `${earning.referralId}`);
      // eslint-disable-next-line no-param-reassign
      earning.referralInfo = referralInfo ? new UserDto(referralInfo as any).toResponse() : null;
    });
    return {
      data: earnings,
      total
    };
  }

  public async details(id: string) {
    const earning = await this.referralEarningModel.findById(toObjectId(id));
    if (!earning) {
      throw new EntityNotFoundException();
    }
    const [performers, users] = await Promise.all([
      this.performerService.findByIds([earning.referralId, earning.registerId]),
      this.userService.findByIds([earning.referralId, earning.registerId])
    ]);
    const data = new ReferralEarningDto(earning);
    const registerInfo = users.find((p) => `${p._id}` === `${earning.registerId}`) || performers.find((p) => `${p._id}` === `${earning.registerId}`);
    data.registerInfo = registerInfo ? new UserDto(registerInfo as any).toResponse() : null;
    const referralInfo = users.find((p) => `${p._id}` === `${earning.referralId}`) || performers.find((p) => `${p._id}` === `${earning.referralId}`);
    data.referralInfo = referralInfo ? new UserDto(referralInfo as any).toResponse() : null;
    return data;
  }

  public async stats(
    req: ReferralEarningSearchRequestPayload
  ): Promise<IReferralEarningStatResponse> {
    const query = {} as any;
    if (req.registerId) {
      query.registerId = toObjectId(req.registerId);
    }
    if (req.referralId) {
      query.referralId = toObjectId(req.referralId);
    }

    const [totalRegisters, totalSales, totalNetPrice] = await Promise.all([
      this.referralService.countByQuery(query),
      this.referralEarningModel.countDocuments(query),
      this.referralEarningModel.aggregate<any>([
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
    return {
      totalRegisters,
      totalSales,
      totalNetPrice: (totalNetPrice[0] && totalNetPrice[0].total) || 0
    };
  }
}
