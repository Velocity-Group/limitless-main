import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import * as moment from 'moment';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { SEARCH_CHANNEL } from 'src/modules/search/constants';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerModel } from '../models';
import { PERFORMER_MODEL_PROVIDER } from '../providers';
import { PerformerDto, IPerformerResponse } from '../dtos';
import { PerformerSearchPayload } from '../payloads';
import { PERFORMER_STATUSES } from '../constants';

@Injectable()
export class PerformerSearchService {
  constructor(
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    private readonly queueEventService: QueueEventService
  ) { }

  public async adminSearch(
    req: PerformerSearchPayload
  ): Promise<PageableData<PerformerDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { name: searchValue },
        { username: searchValue },
        { email: searchValue },
        { bodyType: searchValue },
        { gender: searchValue },
        { ethnicity: searchValue }
      ];
    }
    if (req.performerIds) {
      query._id = { $in: req.performerIds.split(',') };
    }
    if (req.status) {
      query.status = req.status;
    }
    ['hair', 'pubicHair', 'ethnicity', 'country', 'bodyType', 'gender',
      'height', 'weight', 'eyes', 'bust', 'sexualPreference'].forEach((f) => {
      if (req[f]) {
        query[f] = { $regex: req[f] };
      }
    });
    if (req.fromAge && req.toAge) {
      query.dateOfBirth = {
        $gte: new Date(req.fromAge),
        $lte: new Date(req.toAge)
      };
    }
    if (req.age) {
      const fromAge = req.age.split('_')[0];
      const toAge = req.age.split('_')[1];
      const fromDate = moment().subtract(toAge, 'years').startOf('day').toDate();
      const toDate = moment().subtract(fromAge, 'years').startOf('day').toDate();
      query.dateOfBirth = {
        $gte: fromDate,
        $lte: toDate
      };
    }
    let sort = {
      isOnline: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    if (req.sort === 'latest') {
      sort = '-createdAt';
    }
    if (req.sort === 'oldest') {
      sort = 'createdAt';
    }
    if (req.sort === 'popular') {
      sort = '-stats.views';
    }
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item)),
      total
    };
  }

  // TODO - should create new search service?
  public async search(
    req: PerformerSearchPayload,
    user?: UserDto
  ): Promise<PageableData<PerformerDto>> {
    const query = {
      status: PERFORMER_STATUSES.ACTIVE,
      verifiedDocument: true,
      username: { $ne: null }
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { name: searchValue },
        { username: searchValue },
        { bodyType: searchValue },
        { gender: searchValue },
        { ethnicity: searchValue },
        { sexualPreference: searchValue }
      ];
      await this.queueEventService.publish(
        new QueueEvent({
          channel: SEARCH_CHANNEL,
          eventName: EVENT.CREATED,
          data: {
            keyword: req.q,
            fromSource: 'user',
            fromSourceId: user?._id || null
          }
        })
      );
    }
    if (req.performerIds) {
      query._id = { $in: req.performerIds.split(',') };
    }
    if (req.status) {
      query.status = req.status;
    }
    ['hair', 'pubicHair', 'ethnicity', 'country', 'bodyType', 'gender',
      'height', 'weight', 'eyes', 'bust', 'sexualPreference'].forEach((f) => {
      if (req[f]) {
        query[f] = { $regex: req[f] };
      }
    });
    if (req.fromAge && req.toAge) {
      query.dateOfBirth = {
        $gte: new Date(req.fromAge),
        $lte: new Date(req.toAge)
      };
    }
    if (req.age) {
      const fromAge = req.age.split('_')[0];
      const toAge = req.age.split('_')[1];
      const fromDate = moment().subtract(toAge, 'years').startOf('day');
      const toDate = moment().subtract(fromAge, 'years').startOf('day');
      query.dateOfBirth = {
        $gte: fromDate,
        $lte: toDate
      };
    }
    let sort = {
      isOnline: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    if (req.sort === 'latest') {
      sort = '-createdAt';
    }
    if (req.sort === 'oldest') {
      sort = 'createdAt';
    }
    if (req.sort === 'popular') {
      sort = '-stats.views';
    }
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item)),
      total
    };
  }

  public async searchByIds(
    req: PerformerSearchPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const query = {} as any;
    if (req.ids) {
      query._id = { $in: req.ids };
    }

    const [data, total] = await Promise.all([
      this.performerModel
        .find(query),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item).toSearchResponse()),
      total
    };
  }

  public async searchByKeyword(
    req: PerformerSearchPayload
  ): Promise<any> {
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
          username: { $regex: regexp }
        }
      ];
    }
    const [data] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
    ]);
    return data;
  }

  public async topPerformers(
    req: PerformerSearchPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const query = {} as any;
    query.status = 'active';
    if (req.gender) {
      query.gender = req.gender;
    }
    const sort = {
      score: -1,
      'stats.subscribers': -1,
      'stats.views': -1
    };
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new PerformerDto(item).toSearchResponse()),
      total
    };
  }

  public async randomSearch(req: PerformerSearchPayload): Promise<any> {
    const query = {
      status: PERFORMER_STATUSES.ACTIVE,
      verifiedDocument: true
    } as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: new RegExp(req.q, 'i') }
        },
        {
          email: { $regex: new RegExp(req.q, 'i') }
        },
        {
          username: { $regex: new RegExp(req.q, 'i') }
        }
      ];
    }
    if (req.fromAge && req.toAge) {
      query.dateOfBirth = {
        $gte: new Date(req.fromAge),
        $lte: new Date(req.toAge)
      };
    }
    if (req.isFreeSubscription) {
      query.isFreeSubscription = true;
    }
    if (req.gender) {
      query.gender = req.gender;
    }
    if (req.country) {
      query.country = { $regex: req.country };
    }
    if (req.height) {
      query.height = { $regex: req.height };
    }
    if (req.eyes) {
      query.eyes = { $regex: req.eyes };
    }
    if (req.sexualPreference) {
      query.sexualPreference = { $regex: req.sexualPreference };
    }
    const data = await this.performerModel.aggregate([
      { $match: query },
      { $sample: { size: 30 } }
    ]);
    return {
      data: data.map((item) => new PerformerDto(item).toSearchResponse())
    };
  }
}
