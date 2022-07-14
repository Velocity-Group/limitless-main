import {
  Injectable,
  Inject,
  ForbiddenException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDto } from 'src/modules/user/dtos';
import { EntityNotFoundException, SearchRequest, PageableData } from 'src/kernel';
import { SHIPPING_ADDRESS_MODEL_PROVIDER } from '../providers';
import { ShippingAddressModel } from '../models';
import {
  AddressBodyPayload
} from '../payloads';
import { } from '../dtos';

@Injectable()
export class ShippingAddressService {
  constructor(
    @Inject(SHIPPING_ADDRESS_MODEL_PROVIDER)
    private readonly addressModel: Model<ShippingAddressModel>
  ) { }

  public async findOne(id: string, user: UserDto): Promise<ShippingAddressModel> {
    const data = await this.addressModel.findById(id);
    if (`${data.sourceId}` !== `${user._id}`) throw new ForbiddenException();
    return data;
  }

  public async create(
    payload: AddressBodyPayload,
    user: UserDto
  ): Promise<ShippingAddressModel> {
    const data = {
      ...payload,
      source: 'user',
      sourceId: user._id,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    const resp = await this.addressModel.create(data);
    return resp;
  }

  public async update(
    id: string,
    payload: AddressBodyPayload,
    user: UserDto
  ): Promise<any> {
    const address = await this.addressModel.findById(id);
    if (!address) {
      throw new EntityNotFoundException();
    }
    if (`${address.sourceId}` !== `${user._id}`) throw new ForbiddenException();
    await this.addressModel.updateOne({ _id: id }, payload);
    return true;
  }

  public async delete(
    id: string,
    user: UserDto
  ): Promise<any> {
    const address = await this.addressModel.findById(id);
    if (!address) {
      throw new EntityNotFoundException();
    }
    if (`${address.sourceId}` !== `${user._id}`) throw new ForbiddenException();
    await this.addressModel.deleteOne({ _id: id });
    return true;
  }

  public async search(
    req: SearchRequest,
    user: UserDto
  ): Promise<PageableData<any>> {
    const query = {
      sourceId: user._id
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { name: searchValue }
      ];
    }
    let sort = {
      updatedAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.addressModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.addressModel.countDocuments(query)
    ]);
    return {
      data,
      total
    };
  }
}
