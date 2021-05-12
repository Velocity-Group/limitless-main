import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { AdminChangeTokenModel } from '../models/admin-change-token-balance-log.model';
import { ADMIN_CHANGE_TOKEN_BALANCE_LOGS } from '../providers';
import { ChangeTokenLogsSearchPayload } from '../payloads';

@Injectable()
export class ChangeTokenLogService {
  constructor(
    @Inject(ADMIN_CHANGE_TOKEN_BALANCE_LOGS)
    private readonly changeTokenLogModel: Model<AdminChangeTokenModel>
  ) { }

  public async tokenChangeLogs(req: ChangeTokenLogsSearchPayload):Promise<any> {
    const query = {
      source: req.source,
      sourceId: req.sourceId
    } as any;
    const [data] = await Promise.all([
      this.changeTokenLogModel
        .find(query)
        .lean()
        .sort('-createdAt')
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10))
    ]);
    return data;
  }

  public async changeTokenLog({ sourceId, source, token }) {
    return this.changeTokenLogModel.create({
      source,
      sourceId,
      token,
      createdAt: new Date()
    });
  }
}
