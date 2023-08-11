import {
  Injectable, Inject
} from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDto } from 'src/modules/user/dtos';
import {
  SOURCE_TYPE
} from '../constants';
import { PayoutMethodModel } from '../models';
import { PAYOUT_METHOD_MODEL_PROVIDER } from '../providers/payout-request.provider';

@Injectable()
export class PayoutMethodService {
  constructor(
    @Inject(PAYOUT_METHOD_MODEL_PROVIDER)
    private readonly payoutMethodModel: Model<PayoutMethodModel>
  ) { }

  public async findOne(query): Promise<any> {
    const request = await this.payoutMethodModel.findOne(query);
    return request;
  }

  public async updateMethod(
    key: string,
    payload: any,
    user: UserDto
  ) {
    const query = {
      sourceId: user._id,
      source: user.isPerformer ? SOURCE_TYPE.PERFORMER : SOURCE_TYPE.USER,
      key
    };
    const method = await this.payoutMethodModel.findOne(query);
    if (method) {
      method.value = payload;
      await method.save();
      return method;
    }
    const resp = await this.payoutMethodModel.create({
      key,
      value: payload,
      source: user.isPerformer ? SOURCE_TYPE.PERFORMER : SOURCE_TYPE.USER,
      sourceId: user._id
    });
    return resp;
  }

  public async adminUpdateMethod(
    key: string,
    payload: any
  ) {
    const query = {
      sourceId: payload.sourceId,
      source: payload.source,
      key
    };
    const method = await this.payoutMethodModel.findOne(query);
    if (method) {
      method.value = payload;
      await method.save();
      return method;
    }
    const resp = await this.payoutMethodModel.create({
      key,
      value: payload,
      source: payload.source,
      sourceId: payload.sourceId
    });
    return resp;
  }
}
