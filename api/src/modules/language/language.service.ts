import { Inject, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { merge } from 'lodash';
import { Parser as CsvParser } from 'json2csv';
import { LanguageModel } from './language.model';
import { LANGUAGE_MODEL_PROVIDER } from './language.provider';
import {
  LanguageSettingPayload,
  LanguageSettingSearchPayload
} from './payloads';
import { LanguageDto } from './dtos';

const csvToJson = require('csvtojson');

@Injectable()
export class LanguageService {
  constructor(
    @Inject(LANGUAGE_MODEL_PROVIDER)
    private readonly LanguageSettingModel: Model<LanguageModel>
  ) { }

  async findById(id: string | ObjectId) {
    return this.LanguageSettingModel.findById(id);
  }

  async findByIdAttribute(query: any) {
    return this.LanguageSettingModel.findById(query);
  }

  async findByKey(key: string, locale: string) {
    return this.LanguageSettingModel.findOne({ key, locale });
  }

  async create(data: LanguageSettingPayload): Promise<LanguageDto> {
    let language = await this.LanguageSettingModel.findOne({
      key: data.key,
      locale: data.locale
    });
    if (!language) {
      language = new this.LanguageSettingModel();
    }

    merge(language, data);
    await language.save();
    const dto = new LanguageDto(language);
    return dto;
  }

  async update(id: string | ObjectId, data: LanguageSettingPayload) {
    const language = await this.LanguageSettingModel.findOne({ _id: id });
    if (!language) {
      throw new EntityNotFoundException();
    }
    merge(language, data);
    await language.save();
    const dto = new LanguageDto(language);
    return dto;
  }

  async delete(id: string | ObjectId) {
    const language = await this.LanguageSettingModel.findOne({ _id: id });
    if (!language) {
      throw new EntityNotFoundException();
    }

    return language.delete();
  }

  async resetToUSLocale() {
    await this.LanguageSettingModel.deleteMany({ locale: { $ne: 'en-US' } });

    return true;
  }

  async search(
    payload: LanguageSettingSearchPayload
  ): Promise<PageableData<LanguageDto>> {
    const query = {} as any;
    if (payload.key) {
      query.key = payload.key;
    }

    if (payload.locale) {
      query.locale = payload.locale;
    }

    if (payload.value) {
      const regexp = new RegExp(payload.value, 'i');
      query.value = { $regex: regexp };
    }

    const [data, total] = await Promise.all([
      this.LanguageSettingModel.find(query).select(
        '-__v -updatedAt -createdAt'
      ),
      this.LanguageSettingModel.countDocuments(query)
    ]);

    return {
      data: data.map((d) => new LanguageDto(d)),
      total
    };
  }

  async generateLanguage({ locale }) {
    const texts = await this.LanguageSettingModel.find({ locale: 'en-US' });
    // create new langs
    await texts.reduce(async (lp, text) => {
      await lp;
      // check text and insert if not exist
      const count = await this.LanguageSettingModel.countDocuments({
        locale,
        key: text.key
      });
      if (!count) {
        await this.LanguageSettingModel.create({
          locale,
          key: text.key,
          value: text.value
        });
      }
      return Promise.resolve();
    }, Promise.resolve());
    return true;
  }

  async generateCsvJson(locale) {
    const defaultTexts = await this.LanguageSettingModel.find({ locale: 'en-US' });
    const localeTexts = await this.LanguageSettingModel.find({ locale });
    const jsonData = defaultTexts.map((enLanguage) => {
      const localeLanguage = localeTexts.find((lc) => lc.key === enLanguage.key);
      return {
        key: enLanguage.key,
        value: localeLanguage?.value || enLanguage.value
      };
    });
    const fields = [{
      label: 'Key',
      value: 'key'
    }, {
      label: 'Value',
      value: 'value'
    }];
    const json2csvParser = new CsvParser({ fields });
    return json2csvParser.parse(jsonData);
  }

  async importLanguageCsvFile(locale, absolutePath) {
    const jsonData = await csvToJson({
      trim: true
    }).fromFile(absolutePath);
    await jsonData.reduce(async (lp, text) => {
      await lp;
      if (!text.Key) return Promise.resolve();
      return this.LanguageSettingModel.updateOne({
        locale,
        key: text.Key
      }, {
        locale,
        key: text.Key,
        value: text.Value || '',
        updatedAt: new Date()
      }, {
        upsert: true
      });
    }, Promise.resolve());
  }
}
