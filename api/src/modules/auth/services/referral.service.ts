import {
  Injectable, Inject, forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { StringHelper } from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import * as moment from 'moment';
import { REFERRAL_MODEL_PROVIDER, REFERRAL_CODE_MODEL_PROVIDER } from '../providers';
import { ReferralModel, ReferralCodeModel } from '../models';
import { ReferralStats, ReferralSearch, NewReferralPyaload } from '../payloads';
import { ReferralDto } from '../dtos';

@Injectable()
export class ReferralService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(REFERRAL_MODEL_PROVIDER)
    private readonly referralModel: Model<ReferralModel>,
    @Inject(REFERRAL_CODE_MODEL_PROVIDER)
    private readonly referralCodeModel: Model<ReferralCodeModel>
  ) { }

  public async newReferral(payload: NewReferralPyaload): Promise<ReferralModel> {
    const refCode = await this.referralCodeModel.findOne({
      code: payload.code
    });
    if (!refCode) return;
    const referral = await this.referralModel.findOne({
      registerSource: payload.registerSource,
      registerId: payload.registerId,
      referralSource: refCode.source,
      referralId: refCode.sourceId
    });
    if (referral) return;
    await this.referralModel.create({
      registerSource: payload.registerSource,
      registerId: payload.registerId,
      referralSource: refCode.source,
      referralId: refCode.sourceId,
      createdAt: new Date()
    });
  }

  public async findOne(query: any): Promise<ReferralModel> {
    return this.referralModel.findOne(query);
  }

  public async countByQuery(query: any): Promise<number> {
    return this.referralModel.countDocuments(query);
  }

  private async getCode() {
    const code = StringHelper.randomString(12);
    const data = await this.referralCodeModel.findOne({
      code
    });
    if (data) {
      const newData = await this.getCode();
      return newData;
    }
    return code;
  }

  public async userCode(user: UserDto) {
    const data = await this.referralCodeModel.findOne({
      sourceId: user._id
    });
    if (data) {
      return data.code;
    }
    const code = await this.getCode();
    const newData = await this.referralCodeModel.create({
      source: user.isPerformer ? 'performer' : 'user',
      sourceId: user._id,
      code,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return newData.code;
  }

  public async adminStats(req: ReferralStats) {
    const query = {} as any;
    if (req.referralId) {
      query.referralId = req.referralId;
    }

    const [totalRegister] = await Promise.all([
      this.referralModel.countDocuments(query)
      // this.referralModel.aggregate([
      //   {
      //     $group: {
      //       _id: '$referralId',
      //       count: {
      //         $sum: '$netPrice'
      //       }
      //     }
      //   }
      // ]),
    ]);
    return {
      totalRegister
      // totalReferral
    };
  }

  public async search(
    req: ReferralSearch
  ) {
    const query = {} as any;
    if (req.referralId) {
      query.referralId = req.referralId;
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
      this.referralModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.referralModel.countDocuments(query)
    ]);
    const referralIds = data.map((d) => d.referralId);
    const registerIds = data.map((d) => d.registerId);
    const Ids = referralIds.concat(registerIds);
    const [users, performers] = await Promise.all([
      Ids.length ? this.userService.findByIds(Ids) : [],
      Ids.length ? this.performerService.findByIds(Ids) : []
    ]);

    const results = data.map((d) => new ReferralDto(d));
    results.forEach((d) => {
      const register = users.find((r) => `${r._id}` === `${d.registerId}`) || performers.find((r) => `${r._id}` === `${d.registerId}`);
      const referral = users.find((r) => `${r._id}` === `${d.referralId}`) || performers.find((r) => `${r._id}` === `${d.referralId}`);
      // eslint-disable-next-line no-param-reassign
      d.referralInfo = referral ? new UserDto(referral as any).toResponse() : null;
      // eslint-disable-next-line no-param-reassign
      d.registerInfo = register ? new UserDto(register as any).toResponse() : null;
    });
    return {
      data: results,
      total
    };
  }
}
