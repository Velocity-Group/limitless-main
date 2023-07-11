import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  EntityNotFoundException,
  PageableData,
  QueueEvent,
  QueueEventService
} from 'src/kernel';
import { SETTING_CHANNEL } from 'src/modules/settings/constants';
import { TranslationModel as Translation } from '../models';
import { TRANSLATION_SCHEMA_PROVIDER } from '../providers';
import {
  TranslationCreatePayload,
  TranslationSearchPayload,
  TranslationUpdatePayload
} from '../payloads';

@Injectable()
export class TranslationService {
  private logger = new Logger(TranslationService.name);

  constructor(
    @Inject(TRANSLATION_SCHEMA_PROVIDER)
    private readonly TranslationModel: Model<Translation>,
    private readonly queueEventService: QueueEventService
  ) { }

  public async findById(id: string | ObjectId) {
    return this.TranslationModel.findOne({ _id: id });
  }

  public findByIds(ids: string[] | ObjectId[]) {
    return this.TranslationModel.find({ _id: { $in: ids } });
  }

  public getListByIds(query: {
    sourceIds: string[] | ObjectId[];
    locale: string;
    source?: string;
  }) {
    const { sourceIds, locale, source } = query;
    const queryData = {
      sourceId: {
        $in: sourceIds
      },
      locale
    } as any;
    if (source) queryData.source = source;
    return this.TranslationModel.find(queryData).lean();
  }

  public async get(query: {
    source?: string;
    sourceId: string | ObjectId;
    locale: string;
  }) {
    return this.TranslationModel.findOne(query);
  }

  public async create(payload: TranslationCreatePayload) {
    const { locale, sourceId } = payload;
    let translation = await this.TranslationModel.findOne({ locale, sourceId });
    if (translation) {
      throw new HttpException(
        'Translation have already been existed.',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    translation = await this.TranslationModel.create(payload);
    if (translation.source === 'setting') {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: SETTING_CHANNEL,
          eventName: 'update',
          data: translation
        })
      );
    }
    return translation.toObject();
  }

  public async update(id: string, payload: TranslationUpdatePayload) {
    const translation = await this.TranslationModel.findOne({ _id: id });
    if (!translation) {
      throw new EntityNotFoundException();
    }

    await this.TranslationModel.updateOne({ _id: id }, payload);
    if (translation.source === 'setting') {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: SETTING_CHANNEL,
          eventName: 'update',
          data: translation
        })
      );
    }
    return true;
  }

  public async delete(id: string) {
    const translation = await this.TranslationModel.findOne({ _id: id });
    if (!translation) {
      throw new EntityNotFoundException();
    }

    return this.TranslationModel.deleteOne({ _id: id });
  }

  public async search(
    payload: Partial<TranslationSearchPayload>
  ): Promise<PageableData<any>> {
    const query = {} as any;
    if (payload.source) {
      query.source = payload.source;
    }
    if (payload.sourceId) {
      query.sourceId = payload.sourceId;
    }
    if (payload.locales) {
      query.locale = { $in: payload.locales.split(',') };
    }
    if (payload.sourceIds) {
      query.sourceId = { $in: payload.sourceIds.split(',') };
    }

    const sort = {};
    if (payload.sort && payload.sortBy) {
      sort[payload.sortBy] = payload.sort;
    }

    const [data, total] = await Promise.all([
      this.TranslationModel.find(query)
        .sort(sort)
        .limit(parseInt(payload.limit as string, 10))
        .skip(parseInt(payload.offset as string, 10))
        .lean(),
      this.TranslationModel.count(query)
    ]);

    return {
      data,
      total
    };
  }
}
