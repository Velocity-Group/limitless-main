import {
  Injectable, Inject
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  AgendaService
} from 'src/kernel';
import * as moment from 'moment';
import { TRENDING_MODEL_PROVIDER } from './provider';
import { TrendingModel } from './trending.model';

const REMOVE_TRENDING_AGENDA = 'REMOVE_TRENDING_AGENDA';

@Injectable()
export class TrendingRemoveJob {
  constructor(
    @Inject(TRENDING_MODEL_PROVIDER)
    private readonly trendingModel: Model<TrendingModel>,
    private readonly agenda: AgendaService
  ) {
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agenda as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          REMOVE_TRENDING_AGENDA
        ]
      }
    });

    this.agenda.define(REMOVE_TRENDING_AGENDA, {}, this.scheduleVideo.bind(this));
    this.agenda.schedule('10 seconds from now', REMOVE_TRENDING_AGENDA, {});
  }

  private async scheduleVideo(job: any, done: any): Promise<void> {
    await job.remove();
    try {
      await this.trendingModel.deleteMany({
        createdAt: { $lt: moment().startOf('month').toDate() }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Remove trending error', e);
    } finally {
      this.agenda.schedule('1 day from now', REMOVE_TRENDING_AGENDA, {});
      typeof done === 'function' && done();
    }
  }
}
