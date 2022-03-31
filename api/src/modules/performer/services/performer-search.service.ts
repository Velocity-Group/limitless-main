import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import * as moment from 'moment';
import { PerformerModel } from '../models';
import { PERFORMER_MODEL_PROVIDER } from '../providers';
import { PerformerDto, IPerformerResponse } from '../dtos';
import { PerformerSearchPayload } from '../payloads';
import { PERFORMER_STATUSES } from '../constants';

@Injectable()
export class PerformerSearchService {
  constructor(
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>
  ) { }

  public async adminSearch(
    req: PerformerSearchPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { firstName: searchValue },
        { lastName: searchValue },
        { name: searchValue },
        { username: searchValue },
        { email: searchValue }
      ];
    }
    if (req.performerIds) {
      query._id = { $in: req.performerIds.split(',') };
    }
    ['hair', 'pubicHair', 'ethnicity', 'country', 'bodyType', 'gender', 'status',
      'height', 'weight', 'eyes', 'butt', 'sexualOrientation'].forEach((f) => {
      if (req[f]) {
        query[f] = req[f];
      }
    });
    if (req.verifiedDocument) {
      query.verifiedDocument = req.verifiedDocument === 'true';
    }
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
      updatedAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
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
    const performers = data.map((d) => new PerformerDto(d).toResponse(true));
    return {
      data: performers,
      total
    };
  }

  // TODO - should create new search service?
  public async search(
    req: PerformerSearchPayload
  ): Promise<PageableData<any>> {
    const query = {
      status: PERFORMER_STATUSES.ACTIVE,
      verifiedDocument: true
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { name: searchValue },
        { username: searchValue }
      ];
    }
    if (req.performerIds) {
      query._id = { $in: req.performerIds.split(',') };
    }
    ['hair', 'pubicHair', 'ethnicity', 'country', 'bodyType', 'gender',
      'height', 'weight', 'eyes', 'butt', 'sexualOrientation', 'streamingStatus'].forEach((f) => {
      if (req[f]) {
        query[f] = req[f];
      }
    });
    if (req.fromAge && req.toAge) {
      query.dateOfBirth = {
        $gte: moment(req.fromAge).startOf('day').toDate(),
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
    if (req.isFreeSubscription) {
      query.isFreeSubscription = req.isFreeSubscription === 'true';
    }
    let sort = {
      updatedAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    if (req.sortBy === 'online') {
      sort = '-isOnline';
    }
    if (req.sortBy === 'live') {
      sort = '-live';
    }
    if (req.sortBy === 'latest') {
      sort = '-createdAt';
    }
    if (req.sortBy === 'oldest') {
      sort = 'createdAt';
    }
    if (req.sortBy === 'popular') {
      sort = '-score';
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
      data,
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
    if (req.gender) {
      query.gender = req.gender;
    }
    if (req.country) {
      query.country = { $regex: req.country };
    }
    if (req.isFreeSubscription) {
      if (typeof req.isFreeSubscription === 'string') {
        query.isFreeSubscription = req.isFreeSubscription === 'true';
      } else {
        query.isFreeSubscription = req.isFreeSubscription;
      }
    }
    const data = await this.performerModel.aggregate([
      { $match: query },
      { $sample: { size: 50 } }
    ]);
    return {
      data: data.map((item) => new PerformerDto(item).toSearchResponse())
    };
  }
}
