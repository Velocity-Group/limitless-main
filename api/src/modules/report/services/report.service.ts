import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData, EntityNotFoundException } from 'src/kernel';
import { uniq } from 'lodash';
import { PerformerDto } from 'src/modules/performer/dtos';
import { ReportModel } from '../models/report.model';
import { REPORT_MODEL_PROVIDER } from '../providers';
import {
  ReportSearchRequestPayload, ReportCreatePayload
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { ReportDto } from '../dtos/report.dto';
import { UserService } from '../../user/services';
import { PerformerService } from '../../performer/services';

@Injectable()
export class ReportService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(REPORT_MODEL_PROVIDER)
    private readonly reportModel: Model<ReportModel>

  ) { }

  public async create(
    payload: ReportCreatePayload,
    user: UserDto
  ): Promise<ReportDto> {
    const existReport = await this.reportModel.findOne({
      target: payload.target,
      targetId: payload.targetId,
      sourceId: user._id
    });
    if (existReport) {
      existReport.description = payload.description;
      await existReport.save();
      return existReport;
    }
    const data = { ...payload } as any;
    data.sourceId = user._id;
    data.source = user.isPerformer ? 'performer' : 'user';
    data.createdAt = new Date();
    data.updatedAt = new Date();
    const newreport = await this.reportModel.create(data);
    return newreport;
  }

  public async remove(id) {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new EntityNotFoundException();
    }
    await report.remove();
    return { deleted: true };
  }

  public async search(
    req: ReportSearchRequestPayload
  ): Promise<PageableData<ReportDto>> {
    const query = {} as any;
    if (req.sourceId) {
      query.sourceId = req.sourceId;
    }
    if (req.source) {
      query.source = req.source;
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.targetId) {
      query.targetId = req.targetId;
    }
    if (req.target) {
      query.target = req.target;
    }
    const sort = {
      createdAt: -1
    };
    const [data, total] = await Promise.all([
      this.reportModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.reportModel.countDocuments(query)
    ]);
    const reports = data.map((d) => new ReportDto(d));
    const UIds = uniq(data.map((d) => d.sourceId));
    const performerIds = uniq(data.map((d) => d.performerId));
    const [users, performers, sources] = await Promise.all([
      UIds.length ? this.userService.findByIds(UIds) : [],
      UIds.length ? this.performerService.findByIds(UIds) : [],
      performerIds.length ? this.performerService.findByIds(performerIds) : []
    ]);
    reports.forEach((report: ReportDto) => {
      const per = performers.find(
        (p) => p._id.toString() === report.sourceId.toString()
      );
      const user = users.find(
        (u) => u._id.toString() === report.sourceId.toString()
      );
      const performer = sources.find(
        (p) => p._id.toString() === report.performerId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      report.sourceInfo = (per && new PerformerDto(per)) || (user && new UserDto(user)) || null;
      // eslint-disable-next-line no-param-reassign
      report.performerInfo = (performer && new PerformerDto(performer)) || null;
    });
    return {
      data: reports,
      total
    };
  }
}
